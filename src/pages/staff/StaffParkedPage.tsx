import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw, CheckCircle2, Car, ScanLine, QrCode, UserSquare, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { useAuth } from '@/hooks/useAuth';
import { useAssignedGates } from '@/hooks/staff/useAssignedGates';
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
  return h > 0 ? `${h} h ${m} m` : `${m} m`;
};

function CompareImg({ src, label }: { src?: string | null; label: string }) {
  return (
    <div>
      <div className="aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted/40 flex items-center justify-center">
        {src ? (
          <img src={src} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="text-[10px] text-muted-foreground/60">None</span>
        )}
      </div>
      <p className="mt-0.5 text-center text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * Một component, 2 view:
 *  - view="scanner" (/staff/checkout · tab "Vehicle Check-out"): CHỈ camera quét
 *    biển số / QR để tìm xe rồi mở modal thu phí. Không hiện danh sách.
 *  - view="list" (/staff/parked · tab "Parked Vehicles"): danh sách xe đang đỗ; nhân
 *    viên gate RA bấm vào xe để checkout, nhân viên khác chỉ xem.
 */
export function StaffParkedPage({ view = 'list' }: { view?: 'scanner' | 'list' }) {
  const { buildingId, building } = useBuildingContext();
  const { user } = useAuth();
  const { showCheckOut } = useAssignedGates();
  // View scanner (tab Check-out) luôn cho thao tác; view list (tab Parked Vehicles) chỉ
  // cho checkout nếu là nhân viên gate ra, ngược lại chỉ xem.
  const canCheckout = view === 'scanner' ? true : showCheckOut;

  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [opMessage, setOpMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [checkoutTarget, setCheckoutTarget] = useState<ParkingSession | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentKind>('cash');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Scanner tìm xe (tuần tự — chỉ 1 camera). Wizard checkout: 1 chụp chân dung ra · 2 thu phí.
  const [identifyMode, setIdentifyMode] = useState<'plate' | 'qr'>('plate');
  const [coStep, setCoStep] = useState<1 | 2>(1);

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
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load data'))
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

  // Open modal checkout cho 1 session. Danh sách (listActive) ĐÃ lược ảnh base64 cho
  // nhẹ payload → fetch chi tiết để lấy ảnh LÚC VÀO (biển số + chân dung) đối chiếu.
  const openCheckout = useCallback(async (session: ParkingSession, exitPlateImage: string | null = null) => {
    setOpMessage(null);
    setCheckoutTarget(session);
    setPaymentMethod('cash');
    setCoStep(1);
    // Giữ ảnh biển số LÚC RA nếu đã quét được (đường quét); card-click thì null.
    setCapturedPlateImage(exitPlateImage);
    setCapturedPortraitImage(null);
    try {
      const res = await staffApi.sessions.detail(session._id);
      const full = (res as { data?: ParkingSession })?.data;
      if (full) {
        setCheckoutTarget((prev) =>
          prev && prev._id === session._id
            ? { ...prev, plateImage: full.plateImage, portraitImage: full.portraitImage }
            : prev,
        );
      }
    } catch {
      /* ảnh đối chiếu là phụ trợ — bỏ qua nếu lỗi tải chi tiết */
    }
  }, []);

  // Identify the active session for a plate and open the checkout/payment modal.
  const openCheckoutByPlate = (plate: string, exitPlateImage: string | null = null) => {
    const clean = normalizePlate(plate) || plate.trim().toUpperCase();
    const found = sessions.find(
      (s) => (normalizePlate(s.plateNumber) || s.plateNumber.toUpperCase()) === clean,
    );
    if (found) {
      void openCheckout(found, exitPlateImage);
    } else {
      setOpMessage({
        type: 'err',
        text: `No parked vehicle found with plate ${clean}. Click Refresh and try again.`,
      });
    }
  };

  // Camera biển số: lưu khung ảnh LÚC RA + tìm xe để mở thu phí.
  const handlePlateDetected = ({ plateNumber, plateImage }: PlateScanResult) => {
    openCheckoutByPlate(plateNumber, plateImage);
  };

  // Camera 3 — QR (token biển số PLT- / ID tài khoản). Reservation/khách chỉ cần
  // quét QR phương tiện là đủ để nhận diện và cho xe ra. Portrait Photo do camera
  // chân dung (Camera 1) chụp riêng lúc cho xe ra.
  const handleResolveIdQr = async (code: string) => {
    try {
      const res = await staffApi.resolveQr(code, buildingId);
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
        setOpMessage({ type: 'err', text: 'No parked vehicle is linked to this QR code.' });
      }
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'QR lookup failed.' });
    }
  };

  const onCheckOut = async () => {
    const target = checkoutTarget;
    if (!target) return;
    setOpMessage(null);
    const dueFee = target.currentFee ?? target.fee ?? 0;
    try {
      // Chỉ tạo QR chuyển khoản khi thực sự có tiền phải thu (gói trong hạn mức = 0đ).
      if (paymentMethod === 'bank_transfer' && dueFee > 0) {
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
      // Portrait Photo lúc ra: ưu tiên ảnh đã chụp, nếu chưa thì chụp 1 khung từ camera chân dung.
      const exitPortrait = capturedPortraitImage ?? portraitCamRef.current?.capture() ?? null;
      await staffApi.checkOut(target._id, {
        ...(target.isReservation ? {} : { paymentMethod: dueFee > 0 ? paymentMethod : 'cash' }),
        exitPlateImage: capturedPlateImage,
        exitPortraitImage: exitPortrait,
      });
      setOpMessage({
        type: 'ok',
        text: target.isReservation
          ? `Checked out vehicle ${target.plateNumber} — the system deducted the wallet automatically.`
          : dueFee > 0
            ? `Collected payment and checked out vehicle ${target.plateNumber}.`
            : `Checked out vehicle ${target.plateNumber} (free by package).`,
      });
      setPaymentMethod('cash');
      setCheckoutTarget(null);
      setCapturedPlateImage(null);
      setCapturedPortraitImage(null);
      setReloadTick((n) => n + 1);
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Check-out failed' });
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
        text: `Rejected check-out for plate ${checkoutTarget.plateNumber}.${notified ? ' Notification sent to the customer.' : ''}`,
      });
      setRejectOpen(false);
      setRejectReason('');
      setCheckoutTarget(null);
      setCapturedPlateImage(null);
      setCapturedPortraitImage(null);
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Rejection failed' });
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
        setOpMessage({ type: 'ok', text: 'Payment received. Parking session completed.' });
        setReloadTick((n) => n + 1);
      } else if (status === 'cancelled' || status === 'expired') {
        setBankTransfer(null);
        setOpMessage({ type: 'err', text: `Payment ${status}. Please try again.` });
      } else {
        setOpMessage({ type: 'err', text: 'Payment has not been received. The customer must complete the transfer.' });
      }
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Payment confirmation failed' });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
      {/* Header — tiêu đề + 2 chỉ số inline + làm mới */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
            {view === 'scanner' ? 'Exit Gate · Vehicle Scan' : canCheckout ? 'Exit Gate' : 'Parking Monitoring'}
          </p>
          <h2 className="mt-0.5 text-xl font-bold text-foreground">
            {view === 'scanner' ? 'Vehicle Check-out' : 'Parked Vehicles'}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {building ? `${building.code} · ${building.name}` : 'No Building Selected'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="rounded-xl border border-border bg-background px-4 py-2 text-center min-w-[88px]">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Parked</p>
            <p className="text-lg font-bold text-foreground">{loading ? '–' : sessions.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-background px-4 py-2 text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Estimated Total Fee</p>
            <p className="text-lg font-bold text-primary">{loading ? '–' : fmtMoney(totalFee)}</p>
          </div>
          <Button variant="secondary" onClick={refreshSessions} className="gap-2 h-11">
            <RefreshCcw size={14} /> Refresh
          </Button>
        </div>
      </div>

      {/* ══ VIEW "scanner" — tab Vehicle Check-out: CHỈ camera quét ══ */}
      {view === 'scanner' && (
        <div className="mx-auto w-full max-w-xl space-y-4">
          {!canCheckout ? (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
              This account is not assigned to an exit gate, so check-out is not available.
            </div>
          ) : !checkoutTarget && !bankTransfer && !rejectOpen ? (
            <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
              <div className="flex gap-2 p-1 rounded-lg bg-muted border border-border">
                <button
                  type="button"
                  onClick={() => setIdentifyMode('plate')}
                  className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md text-xs font-bold transition-all ${identifyMode === 'plate' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <ScanLine size={13} /> Scan Plate (AI)
                </button>
                <button
                  type="button"
                  onClick={() => setIdentifyMode('qr')}
                  className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md text-xs font-bold transition-all ${identifyMode === 'qr' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <QrCode size={13} /> Scan QR
                </button>
              </div>
              {identifyMode === 'plate' ? (
                <LivePlateCamera onDetected={handlePlateDetected} busy={loading} />
              ) : (
                <LiveQRCamera onResult={handleResolveIdQr} />
              )}
              <p className="text-center text-[11px] text-muted-foreground">
                Scan the license plate / vehicle QR to find the vehicle and open payment. View all vehicles in the Parked Vehicles tab.
              </p>
            </section>
          ) : null}
          {opMessage && (
            <div className={`rounded-xl border p-4 text-sm ${opMessage.type === 'ok' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'}`}>
              {opMessage.text}
            </div>
          )}
        </div>
      )}

      {/* ══ VIEW "list" — tab Parked Vehicles: danh sách (bấm để checkout) ══ */}
      {view === 'list' && (
        <div className="space-y-4">
          {!canCheckout && (
            <div className="rounded-xl border border-sky-500/25 bg-sky-500/5 px-4 py-3 text-sm text-sky-300">
              <strong>View-only</strong> mode. Check-out and payment are handled by exit-gate staff.
            </div>
          )}

          {opMessage && (
            <div className={`rounded-xl border p-4 text-sm ${opMessage.type === 'ok' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'}`}>
              {opMessage.text}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Parked Vehicle List</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : error ? (
                <p className="text-sm text-rose-400">{error}</p>
              ) : sessions.length === 0 ? (
                <div className="py-10 text-center">
                  <Car size={28} className="mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No parked vehicles.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {sessions.map((s) => {
                const floor = s.slot?.floor?.name || s.slot?.floor?.code || '—';
                const slotCode = s.slot?.code || '—';
                const isMember = Boolean(s.isMember ?? s.user) || s.isLongTerm;
                return (
                  <button
                    key={s._id}
                    type="button"
                    onClick={canCheckout ? () => void openCheckout(s) : undefined}
                    title={canCheckout ? 'Click to collect payment & check out' : 'Only exit-gate staff can check vehicles out'}
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
                      <div className="flex shrink-0 items-center gap-1">
                        {s.isLongTerm && (
                          <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-orange-400">
                            Package
                          </span>
                        )}
                        {isMember ? (
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-400">
                            Member
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-amber-400">
                            Walk-in Customer
                          </span>
                        )}
                      </div>
                    </div>
                    {isMember && s.user?.fullName && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{s.user.fullName}{s.user.email ? ` · ${s.user.email}` : ''}</p>
                    )}
                    {/* Check-in bởi nhân viên nào, qua gate nào (gate vào) */}
                    <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
                      Check-in: {s.staff?.fullName ?? '—'}
                      {s.entryGate?.code ? ` · gate ${s.entryGate.code}` : ''}
                    </p>

                    {/* Camera snapshots */}
                    {(s.plateImage || s.portraitImage) && (
                      <div className="mt-2 flex gap-2">
                        {s.plateImage && (
                          <img src={s.plateImage} alt="License Plate" className="h-12 w-16 rounded border border-border object-cover" />
                        )}
                        {s.portraitImage && (
                          <img src={s.portraitImage} alt="Portrait" className="h-12 w-16 rounded border border-border object-cover" />
                        )}
                      </div>
                    )}

                    <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                      <div>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Vehicle Type</span>
                        <p className="font-medium text-foreground">{s.vehicleType?.name ?? '—'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Entry Gate</span>
                        <p className="font-medium text-foreground">{s.entryGate?.code ?? '—'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Floor</span>
                        <p className="font-medium text-foreground">{floor}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Slot</span>
                        <p className="font-medium text-foreground">{slotCode}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Entry Time</span>
                        <p className="font-medium text-foreground">{fmtTime(s.entryTime)}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Parking Duration</span>
                        <p className="font-medium text-primary">{fmtDuration(s.entryTime, s.exitTime)}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {s.isLongTerm ? 'Overage Fee' : s.isReservation ? 'Remaining Due' : 'Estimated Fee'}
                      </span>
                      <span className="font-bold text-primary">
                        {s.isReservation
                          ? fmtMoney(s.reservationRemainingFee ?? 0)
                          : (s.currentFee ?? s.fee ?? 0) > 0
                            ? fmtMoney(s.currentFee ?? s.fee)
                            : s.isLongTerm ? 'Free' : fmtMoney(0)}
                      </span>
                    </div>
                    {canCheckout && (
                      <p className="mt-2 text-center text-[11px] font-semibold text-primary">Click to collect payment & check out →</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
        </div>
      )}

      {/* Payment & cho xe ra */}
      {checkoutTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Payment · Check-out</p>
                <h3 className="text-xl font-semibold text-foreground font-mono">{checkoutTarget.plateNumber}</h3>
              </div>
              <button onClick={() => { setCheckoutTarget(null); setPaymentMethod('cash'); setCoStep(1); setCapturedPlateImage(null); setCapturedPortraitImage(null); }} className="text-muted-foreground hover:text-foreground transition">✕</button>
            </div>

            {/* Step indicator */}
            <div className="mb-4 flex items-center gap-2 text-[11px] font-bold">
              {[{ n: 1, label: 'Capture Exit Portrait' }, { n: 2, label: 'Compare & Collect' }].map((s, i) => (
                <div key={s.n} className="flex items-center gap-2">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${coStep >= s.n ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{s.n}</span>
                  <span className={coStep === s.n ? 'text-foreground' : 'text-muted-foreground'}>{s.label}</span>
                  {i < 1 && <span className="mx-1 h-px w-5 bg-border" />}
                </div>
              ))}
            </div>

            {/* ── BƯỚC 1 — Capture Portrait lúc ra ── */}
            {coStep === 1 && (
              <div className="space-y-4">
                <LivePortraitCamera ref={portraitCamRef} />
                {capturedPortraitImage && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-400">
                    <UserSquare size={14} /> Exit portrait captured. You can retake it.
                  </div>
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setCoStep(2)} className="h-11 gap-1">
                    Skip
                  </Button>
                  <Button
                    onClick={() => {
                      const img = portraitCamRef.current?.capture() ?? null;
                      if (!img) { setOpMessage({ type: 'err', text: 'Portrait camera is not ready. Please try again.' }); return; }
                      setCapturedPortraitImage(img);
                      setOpMessage(null);
                      setCoStep(2);
                    }}
                    className="flex-1 h-11 gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110"
                  >
                    <UserSquare size={16} /> {capturedPortraitImage ? 'Retake & Continue' : 'Capture Portrait & Continue'} <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            )}

            {/* ── BƯỚC 2 — Compare & Collect ── */}
            {coStep === 2 && (
            <>
            {/* Đối chiếu ảnh: lúc vào (đã lưu) vs lúc ra (vừa quét) */}
            <div className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
                Compare plate & portrait photos
              </p>
              <div className="grid grid-cols-2 gap-3">
                {/* Cột: lúc vào */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Entry (saved)</p>
                  <CompareImg src={checkoutTarget.plateImage} label="License Plate" />
                  <CompareImg src={checkoutTarget.portraitImage} label="Portrait" />
                </div>
                {/* Cột: lúc ra */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Exit (just captured)</p>
                  <CompareImg src={capturedPlateImage} label="License Plate" />
                  <CompareImg src={capturedPortraitImage} label="Portrait" />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Staff should verify whether the photos match. If they do not match, click <strong className="text-rose-400">Reject</strong>.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card/50 p-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span className="font-medium text-foreground">{(checkoutTarget.isMember ?? checkoutTarget.user) ? (checkoutTarget.user?.fullName || 'Member') : 'Walk-in Customer'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Vehicle Type</span><span className="font-medium text-foreground">{checkoutTarget.vehicleType?.name ?? '—'}{checkoutTarget.vehicleBrand ? ` · ${checkoutTarget.vehicleBrand}` : ''}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Entry Time</span><span className="font-medium text-foreground">{fmtTime(checkoutTarget.entryTime)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Parking Duration</span><span className="font-medium text-foreground">{fmtDuration(checkoutTarget.entryTime)}</span></div>
              <div className="flex justify-between border-t border-border/60 pt-1.5"><span className="text-muted-foreground">Check-in Staff</span><span className="font-medium text-foreground">{checkoutTarget.staff?.fullName ?? '—'}{checkoutTarget.entryGate?.code ? ` · gate ${checkoutTarget.entryGate.code}` : ''}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Check-out Staff</span><span className="font-medium text-emerald-400">{user?.fullName || user?.email || 'You'}</span></div>
            </div>

            {checkoutTarget.isLongTerm && (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                Long-term package vehicle{checkoutTarget.maxHoursPerDay ? ` · free ${checkoutTarget.maxHoursPerDay}h/day` : ''}.{' '}
                {(checkoutTarget.overageHours ?? 0) > 0
                  ? `Overstayed ${checkoutTarget.overageHours?.toFixed(1)}h → charge the overage at the normal rate.`
                  : 'Within limit -> free.'}
              </div>
            )}

            {checkoutTarget.isReservation ? (
              <div className="mt-4 rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-sky-300">
                Reservations — the system will deduct the remaining amount (<strong>{fmtMoney(checkoutTarget.reservationRemainingFee ?? 0)}</strong>) from the wallet after check-out.
              </div>
            ) : (
              <>
                <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Amount Due</span>
                  <span className="font-mono text-2xl font-black text-primary">
                    {(checkoutTarget.currentFee ?? checkoutTarget.fee ?? 0) > 0
                      ? fmtMoney(checkoutTarget.currentFee ?? checkoutTarget.fee)
                      : 'Free'}
                  </span>
                </div>

                {(checkoutTarget.currentFee ?? checkoutTarget.fee ?? 0) > 0 && (
                  <>
                    <p className="mt-4 mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">Payment Method</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {[{ value: 'cash', label: 'Cash' }, { value: 'bank_transfer', label: 'Bank Transfer' }, { value: 'wallet', label: 'Wallet' }].map((m) => (
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
                  </>
                )}
              </>
            )}

            <div className="mt-5 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setCoStep(1)} className="h-11 gap-1">
                <ArrowLeft size={16} /> Back
              </Button>
              <Button onClick={onCheckOut} disabled={loading} className="flex-1 h-11 gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60">
                <CheckCircle2 size={16} /> {checkoutTarget.isReservation
                  ? 'Check out (auto wallet deduction)'
                  : (checkoutTarget.currentFee ?? checkoutTarget.fee ?? 0) <= 0
                    ? 'Check out (free)'
                    : paymentMethod === 'bank_transfer' ? 'Create Payment QR' : `Collect ${fmtMoney(checkoutTarget.currentFee ?? checkoutTarget.fee)} & check out`}
              </Button>
              <Button type="button" variant="outline" onClick={() => setRejectOpen(true)} className="h-11 border-rose-500/40 text-rose-400 hover:bg-rose-500/10">
                Reject
              </Button>
            </div>
            </>
            )}
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
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-400">Reject Check-out</p>
                <h3 className="text-xl font-semibold text-foreground">Rejection Reason</h3>
              </div>
              <button onClick={() => { setRejectOpen(false); setRejectReason(''); }} className="text-muted-foreground hover:text-foreground transition">✕</button>
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Reason for rejecting check-out..."
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-rose-500/50"
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => { setRejectOpen(false); setRejectReason(''); }} className="text-xs">Cancel</Button>
              <Button onClick={onReject} disabled={!rejectReason.trim()} className="bg-rose-500 text-white hover:bg-rose-400 text-xs disabled:opacity-60">
                Confirm Rejection
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal chuyển khoản ngân hàng */}
      {bankTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Bank Transfer</p>
            <h3 className="mt-1 text-xl font-semibold text-foreground">Collect Parking Fee</h3>
            <div className="mt-4 rounded-xl border border-border bg-card/50 p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">License Plate</span><span className="font-semibold text-foreground">{bankTransfer.plate}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Amount</span><span className="font-mono text-lg font-bold text-amber-400">{bankTransfer.amount.toLocaleString('vi-VN')} đ</span></div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Open the payment page and let the customer scan the QR. After the transfer is completed, click <strong className="text-foreground">Confirm</strong>.</p>
            <Button onClick={() => window.open(bankTransfer.checkoutUrl, '_blank', 'noopener')} variant="secondary" className="mt-4 w-full gap-2">
              Open Payment QR Page
            </Button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button onClick={onVerifyBankTransfer} disabled={verifying} className="gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60">
                {verifying ? 'Confirming...' : 'Confirm Payment'}
              </Button>
              <Button variant="secondary" onClick={() => setBankTransfer(null)} disabled={verifying}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
