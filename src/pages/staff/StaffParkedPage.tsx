import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw, CheckCircle2, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { useAuth } from '@/hooks/useAuth';
import { staffApi, type ParkingSession } from '@/services/staff/staffApi';
import { LivePlateCamera, type PlateScanResult, type LiveCameraHandle } from '@/components/staff/LivePlateCamera';
import { LiveQRCamera } from '@/components/staff/LiveQRCamera';
import { LivePortraitCamera } from '@/components/staff/LivePortraitCamera';
import { normalizePlate } from '@/utils/plate';

type PaymentKind = 'cash' | 'bank_transfer' | 'wallet';

interface BankTransferState {
  orderCode: number;
  checkoutUrl: string;
  amount: number;
  plate: string;
}

const fmtTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString('vi-VN') : '—';

const fmtMoney = (n: number | null | undefined) =>
  n != null ? `${n.toLocaleString('vi-VN')} đ` : '—';

const fmtDuration = (from: string | null | undefined, to?: string | null) => {
  if (!from) return '—';
  const end = to ? new Date(to).getTime() : Date.now();
  const mins = Math.max(0, Math.floor((end - new Date(from).getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h} giờ ${m} phút` : `${m} phút`;
};

function CompareImg({ src, label }: { src?: string | null; label: string }) {
  return (
    <div>
      <div className="aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted/40 flex items-center justify-center">
        {src ? (
          <img src={src} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="text-[10px] text-muted-foreground/60">Chưa có</span>
        )}
      </div>
      <p className="mt-0.5 text-center text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * Một component dùng cho 2 route:
 *  - /staff/checkout  (readOnly=false) → tab "Check-out xe ra": camera quét →
 *    đối chiếu ảnh chân dung + biển số → thu phí & cho xe ra. (nhân viên cổng ra)
 *  - /staff/parked    (readOnly=true)  → tab "Xe đang đỗ": chỉ xem danh sách.
 *    (cả hai loại nhân viên đều xem được, không thao tác thanh toán)
 */
export function StaffParkedPage({ readOnly = false }: { readOnly?: boolean }) {
  const { buildingId, building } = useBuildingContext();
  const { user } = useAuth();
  const canCheckout = !readOnly;

  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [opMessage, setOpMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [checkoutTarget, setCheckoutTarget] = useState<ParkingSession | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentKind>('cash');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [bankTransfer, setBankTransfer] = useState<BankTransferState | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Frames captured at CHECK-OUT time, to compare against the images stored at
  // check-in (plate + portrait) so staff can verify it's the right vehicle/person.
  const [capturedPlateImage, setCapturedPlateImage] = useState<string | null>(null);
  const [capturedPortraitImage, setCapturedPortraitImage] = useState<string | null>(null);
  const portraitCamRef = useRef<LiveCameraHandle>(null);

  const refreshSessions = useCallback(() => {
    setLoading(true);
    staffApi
      .getActiveSessions({ populate: 'slot.floor,vehicleType,entryGate,exitGate' })
      .then((res) => {
        const rows = (res as { data?: { items?: ParkingSession[] } | ParkingSession[] })?.data;
        const list = Array.isArray(rows) ? rows : ((rows as { items?: ParkingSession[] })?.items ?? []);
        setSessions(list.filter((s) => s.status === 'active'));
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Tải dữ liệu thất bại'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refreshSessions();
    const timer = setInterval(refreshSessions, 30_000);
    return () => clearInterval(timer);
  }, [refreshSessions, reloadTick]);

  const totalFee = useMemo(
    () => sessions.reduce((sum, s) => sum + (s.currentFee ?? s.fee ?? 0), 0),
    [sessions],
  );

  // Identify the active session for a plate and open the checkout/payment modal.
  // Same business flow as check-in: scan to identify, then process the vehicle.
  const openCheckoutByPlate = (plate: string) => {
    const clean = normalizePlate(plate) || plate.trim().toUpperCase();
    const found = sessions.find(
      (s) => (normalizePlate(s.plateNumber) || s.plateNumber.toUpperCase()) === clean,
    );
    if (found) {
      setOpMessage(null);
      setCheckoutTarget(found);
      setPaymentMethod('cash');
    } else {
      setOpMessage({
        type: 'err',
        text: `Không tìm thấy xe đang đỗ với biển số ${clean}. Hãy bấm “Làm mới” rồi thử lại.`,
      });
    }
  };

  // Camera 1 — biển số. Lưu khung ảnh để đối chiếu với ảnh lúc vào.
  const handlePlateDetected = ({ plateNumber, plateImage }: PlateScanResult) => {
    setCapturedPlateImage(plateImage);
    openCheckoutByPlate(plateNumber);
  };

  // Camera 3 — QR (token biển số PLT- / ID tài khoản). Reservation/khách chỉ cần
  // quét QR phương tiện là đủ để nhận diện và cho xe ra. Ảnh chân dung do camera
  // chân dung (Camera 1) chụp riêng lúc cho xe ra.
  const handleResolveIdQr = async (code: string) => {
    try {
      const res = await staffApi.resolveQr(code);
      const data = (res as {
        data?: {
          kind: 'plate' | 'user';
          plate?: { plateNumber: string } | null;
          activeSessions?: { plateNumber: string }[];
        };
      })?.data;
      if (data?.kind === 'plate' && data.plate?.plateNumber) {
        openCheckoutByPlate(data.plate.plateNumber);
      } else if (data?.activeSessions && data.activeSessions.length > 0) {
        openCheckoutByPlate(data.activeSessions[0].plateNumber);
      } else {
        setOpMessage({ type: 'err', text: 'Không tìm thấy xe đang đỗ gắn với mã QR này.' });
      }
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Lỗi tra cứu mã QR.' });
    }
  };

  const onCheckOut = async () => {
    const target = checkoutTarget;
    if (!target) return;
    setOpMessage(null);
    try {
      if (paymentMethod === 'bank_transfer') {
        const res = await staffApi.initiateSessionPayment(target._id);
        const d = (res as unknown as { data?: { orderCode: number; checkoutUrl: string; amount: number; plateNumber?: string } })?.data;
        if (d) {
          setBankTransfer({
            orderCode: d.orderCode,
            checkoutUrl: d.checkoutUrl,
            amount: d.amount,
            plate: d.plateNumber || target.plateNumber,
          });
          setCheckoutTarget(null);
        }
        return;
      }
      // Ảnh chân dung lúc ra: ưu tiên ảnh đã chụp, nếu chưa thì chụp 1 khung từ camera chân dung.
      const exitPortrait = capturedPortraitImage ?? portraitCamRef.current?.capture() ?? null;
      await staffApi.checkOut(target._id, {
        paymentMethod,
        exitPlateImage: capturedPlateImage,
        exitPortraitImage: exitPortrait,
      });
      setOpMessage({ type: 'ok', text: `Đã thu phí & cho ra xe ${target.plateNumber}.` });
      setPaymentMethod('cash');
      setCheckoutTarget(null);
      setCapturedPlateImage(null);
      setCapturedPortraitImage(null);
      setReloadTick((n) => n + 1);
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Check-out thất bại' });
    }
  };

  const onReject = async () => {
    if (!checkoutTarget || !rejectReason.trim()) return;
    try {
      const res = await staffApi.reject({
        plateNumber: checkoutTarget.plateNumber,
        stage: 'check-out',
        reason: rejectReason.trim(),
        building: buildingId || undefined,
      });
      const notified = (res as { data?: { notified?: boolean } })?.data?.notified;
      setOpMessage({
        type: 'ok',
        text: `Đã từ chối cho xe ra biển ${checkoutTarget.plateNumber}.${notified ? ' Đã gửi thông báo cho khách.' : ''}`,
      });
      setRejectOpen(false);
      setRejectReason('');
      setCheckoutTarget(null);
      setCapturedPlateImage(null);
      setCapturedPortraitImage(null);
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Từ chối thất bại' });
    }
  };

  const onVerifyBankTransfer = async () => {
    if (!bankTransfer) return;
    setVerifying(true);
    try {
      const res = await staffApi.verifySessionPayment(bankTransfer.orderCode);
      const status = (res as { data?: { status?: string } })?.data?.status;
      if (status === 'success') {
        setBankTransfer(null);
        setPaymentMethod('cash');
        setOpMessage({ type: 'ok', text: 'Đã nhận thanh toán — phiên gửi xe hoàn thành.' });
        setReloadTick((n) => n + 1);
      } else if (status === 'cancelled' || status === 'expired') {
        setBankTransfer(null);
        setOpMessage({ type: 'err', text: `Thanh toán ${status}. Vui lòng thực hiện lại.` });
      } else {
        setOpMessage({ type: 'err', text: 'Chưa nhận được thanh toán. Khách cần hoàn tất chuyển khoản.' });
      }
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Xác nhận thanh toán thất bại' });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="grid gap-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">
              {canCheckout ? 'Ca vận hành · Cổng ra' : 'Giám sát bãi đỗ'}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">
              {canCheckout ? 'Check-out xe ra' : 'Xe đang đỗ'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {building ? `${building.code} · ${building.name}` : 'Chưa chọn tòa nhà'}
              {canCheckout
                ? ' · Quét biển số / QR hoặc nhấp vào xe để thu phí và cho ra'
                : ' · Danh sách xe đang đỗ (chỉ xem)'}
            </p>
          </div>
          <Button variant="secondary" onClick={refreshSessions} className="gap-2 self-start lg:self-auto">
            <RefreshCcw size={14} /> Làm mới
          </Button>
        </div>
      </section>

      {/* Metrics */}
      <section className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">Đang đỗ</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{loading ? '–' : sessions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">Tổng phí tạm tính</p>
            <p className="mt-3 text-3xl font-semibold text-primary">{loading ? '–' : fmtMoney(totalFee)}</p>
          </CardContent>
        </Card>
      </section>

      {/* 3 camera riêng biệt — quét để cho xe ra (chân dung · biển số · QR).
          Chỉ hiện cho nhân viên cổng ra. */}
      {canCheckout && (
        <>
          <section className="grid gap-4 lg:grid-cols-3">
            <LivePortraitCamera ref={portraitCamRef} paused={!!checkoutTarget || !!bankTransfer || rejectOpen} />
            <LivePlateCamera onDetected={handlePlateDetected} busy={loading} />
            <LiveQRCamera onResult={handleResolveIdQr} paused={!!checkoutTarget || !!bankTransfer || rejectOpen} />
          </section>
          <p className="-mt-2 text-center text-[11px] text-muted-foreground">
            Quét biển số (Camera 1) hoặc QR phương tiện/tài khoản (Camera 2) để cho xe ra. Khách đặt chỗ chỉ cần quét QR phương tiện.
          </p>
        </>
      )}

      {!canCheckout && (
        <div className="rounded-xl border border-sky-500/25 bg-sky-500/5 px-4 py-3 text-sm text-sky-300">
          Chế độ <strong>chỉ xem</strong> danh sách xe đang đỗ. Việc cho xe ra &amp; thu phí được thực hiện ở tab <strong>“Check-out xe ra”</strong> (nhân viên cổng ra).
        </div>
      )}

      {opMessage && (
        <div className={`rounded-xl border p-4 text-sm ${opMessage.type === 'ok' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'}`}>
          {opMessage.text}
        </div>
      )}

      {/* Parked list */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách xe đang đỗ</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          ) : error ? (
            <p className="text-sm text-rose-400">{error}</p>
          ) : sessions.length === 0 ? (
            <div className="py-10 text-center">
              <Car size={28} className="mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Không có xe đang đỗ.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {sessions.map((s) => {
                const floor = s.slot?.floor?.name || s.slot?.floor?.code || '—';
                const slotCode = s.slot?.code || '—';
                const isMember = Boolean(s.isMember ?? s.user);
                return (
                  <button
                    key={s._id}
                    type="button"
                    onClick={canCheckout ? () => { setCheckoutTarget(s); setPaymentMethod('cash'); } : undefined}
                    title={canCheckout ? 'Nhấp để thanh toán & cho xe ra' : 'Chỉ nhân viên cổng ra mới cho xe ra'}
                    className={`block w-full rounded-xl border border-border bg-card p-3.5 text-left transition ${canCheckout ? 'cursor-pointer hover:border-primary/40 hover:bg-primary/5' : 'cursor-default'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-mono font-bold text-foreground truncate">{s.plateNumber}</p>
                        {s.vehicleBrand && (
                          <span className="shrink-0 rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-400">
                            {s.vehicleBrand}
                          </span>
                        )}
                      </div>
                      {isMember ? (
                        <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-400">
                          Thành viên
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-amber-400">
                          Khách vãng lai
                        </span>
                      )}
                    </div>
                    {isMember && s.user?.fullName && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{s.user.fullName}{s.user.email ? ` · ${s.user.email}` : ''}</p>
                    )}
                    {/* Check-in bởi nhân viên nào, qua cổng nào (cổng vào) */}
                    <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
                      Check-in: {s.staff?.fullName ?? '—'}
                      {s.entryGate?.code ? ` · cổng ${s.entryGate.code}` : ''}
                    </p>

                    {/* Camera snapshots */}
                    {(s.plateImage || s.portraitImage) && (
                      <div className="mt-2 flex gap-2">
                        {s.plateImage && (
                          <img src={s.plateImage} alt="Biển số" className="h-12 w-16 rounded border border-border object-cover" />
                        )}
                        {s.portraitImage && (
                          <img src={s.portraitImage} alt="Chân dung" className="h-12 w-16 rounded border border-border object-cover" />
                        )}
                      </div>
                    )}

                    <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                      <div>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Loại xe</span>
                        <p className="font-medium text-foreground">{s.vehicleType?.name ?? '—'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Cổng vào</span>
                        <p className="font-medium text-foreground">{s.entryGate?.code ?? '—'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Tầng</span>
                        <p className="font-medium text-foreground">{floor}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Ô đỗ</span>
                        <p className="font-medium text-foreground">{slotCode}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Giờ vào</span>
                        <p className="font-medium text-foreground">{fmtTime(s.entryTime)}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Thời gian đỗ</span>
                        <p className="font-medium text-primary">{fmtDuration(s.entryTime, s.exitTime)}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Phí tạm tính</span>
                      <span className="font-bold text-primary">{fmtMoney(s.currentFee ?? s.fee)}</span>
                    </div>
                    {canCheckout && (
                      <p className="mt-2 text-center text-[11px] font-semibold text-primary">Nhấp để thanh toán & cho xe ra →</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Thanh toán & cho xe ra */}
      {checkoutTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Thanh toán · Xe ra</p>
                <h3 className="text-xl font-semibold text-foreground font-mono">{checkoutTarget.plateNumber}</h3>
              </div>
              <button onClick={() => { setCheckoutTarget(null); setPaymentMethod('cash'); setCapturedPlateImage(null); setCapturedPortraitImage(null); }} className="text-muted-foreground hover:text-foreground transition">✕</button>
            </div>

            {/* Đối chiếu ảnh: lúc vào (đã lưu) vs lúc ra (vừa quét) */}
            <div className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
                Đối chiếu ảnh biển số &amp; chân dung
              </p>
              <div className="grid grid-cols-2 gap-3">
                {/* Cột: lúc vào */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Lúc vào (đã lưu)</p>
                  <CompareImg src={checkoutTarget.plateImage} label="Biển số" />
                  <CompareImg src={checkoutTarget.portraitImage} label="Chân dung" />
                </div>
                {/* Cột: lúc ra */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Lúc ra (vừa quét)</p>
                  <CompareImg src={capturedPlateImage} label="Biển số" />
                  <CompareImg src={capturedPortraitImage} label="Chân dung" />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Nhân viên đối chiếu xem có khớp không. Nếu không khớp, bấm <strong className="text-rose-400">Từ chối</strong>.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card/50 p-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Khách</span><span className="font-medium text-foreground">{(checkoutTarget.isMember ?? checkoutTarget.user) ? (checkoutTarget.user?.fullName || 'Thành viên') : 'Khách vãng lai'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Loại xe</span><span className="font-medium text-foreground">{checkoutTarget.vehicleType?.name ?? '—'}{checkoutTarget.vehicleBrand ? ` · ${checkoutTarget.vehicleBrand}` : ''}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Vào lúc</span><span className="font-medium text-foreground">{fmtTime(checkoutTarget.entryTime)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Thời gian đỗ</span><span className="font-medium text-foreground">{fmtDuration(checkoutTarget.entryTime)}</span></div>
              <div className="flex justify-between border-t border-border/60 pt-1.5"><span className="text-muted-foreground">NV check-in</span><span className="font-medium text-foreground">{checkoutTarget.staff?.fullName ?? '—'}{checkoutTarget.entryGate?.code ? ` · cổng ${checkoutTarget.entryGate.code}` : ''}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">NV check-out</span><span className="font-medium text-emerald-400">{user?.fullName || user?.email || 'Bạn'}</span></div>
            </div>

            <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Số tiền phải trả</span>
              <span className="font-mono text-2xl font-black text-primary">{fmtMoney(checkoutTarget.currentFee ?? checkoutTarget.fee)}</span>
            </div>

            <p className="mt-4 mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">Phương thức thanh toán</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {[{ value: 'cash', label: 'Tiền mặt' }, { value: 'bank_transfer', label: 'Chuyển khoản' }, { value: 'wallet', label: 'Trừ ví' }].map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPaymentMethod(m.value as PaymentKind)}
                  className={`rounded-xl border px-3 py-2.5 text-center text-sm font-medium transition ${paymentMethod === m.value ? 'border-primary/40 bg-primary/10 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/20'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
              <Button onClick={onCheckOut} disabled={loading} className="h-11 gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60">
                <CheckCircle2 size={16} /> {paymentMethod === 'bank_transfer' ? 'Tạo QR thu tiền' : `Thu ${fmtMoney(checkoutTarget.currentFee ?? checkoutTarget.fee)} & cho ra`}
              </Button>
              <Button type="button" variant="outline" onClick={() => setRejectOpen(true)} className="h-11 border-rose-500/40 text-rose-400 hover:bg-rose-500/10">
                Từ chối
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reject (xe ra) */}
      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-card p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-400">Từ chối cho xe ra</p>
                <h3 className="text-xl font-semibold text-foreground">Lý do từ chối</h3>
              </div>
              <button onClick={() => { setRejectOpen(false); setRejectReason(''); }} className="text-muted-foreground hover:text-foreground transition">✕</button>
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Lý do từ chối cho xe ra..."
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-rose-500/50"
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => { setRejectOpen(false); setRejectReason(''); }} className="text-xs">Hủy</Button>
              <Button onClick={onReject} disabled={!rejectReason.trim()} className="bg-rose-500 text-white hover:bg-rose-400 text-xs disabled:opacity-60">
                Xác nhận từ chối
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal chuyển khoản ngân hàng */}
      {bankTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Chuyển khoản</p>
            <h3 className="mt-1 text-xl font-semibold text-foreground">Thu phí gửi xe</h3>
            <div className="mt-4 rounded-xl border border-border bg-card/50 p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Biển số</span><span className="font-semibold text-foreground">{bankTransfer.plate}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Số tiền</span><span className="font-mono text-lg font-bold text-amber-400">{bankTransfer.amount.toLocaleString('vi-VN')} đ</span></div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Mở trang thanh toán và để khách quét QR. Sau khi khách chuyển khoản, nhấn <strong className="text-foreground">Xác nhận</strong>.</p>
            <Button onClick={() => window.open(bankTransfer.checkoutUrl, '_blank', 'noopener')} variant="secondary" className="mt-4 w-full gap-2">
              Mở trang QR thanh toán
            </Button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button onClick={onVerifyBankTransfer} disabled={verifying} className="gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60">
                {verifying ? 'Đang xác nhận...' : 'Xác nhận thanh toán'}
              </Button>
              <Button variant="secondary" onClick={() => setBankTransfer(null)} disabled={verifying}>Đóng</Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
