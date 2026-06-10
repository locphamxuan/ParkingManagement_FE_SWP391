import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  RefreshCcw,
  ScanLine,
  QrCode,
  AlertCircle,
  Car,
  Bike,
  User,
  Mail,
  Phone,
  Wallet,
  Calendar,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { staffApi, type ParkingSession, type PlateInfo } from '@/services/staff/staffApi';
import { AIAutoScanZone } from '@/components/staff/AIAutoScanZone';
import { QRCodeScannerModal } from '@/components/staff/QRCodeScannerModal';
import { CameraModal, type ScanResult } from '@/components/staff/CameraModal';
import { normalizePlate } from '@/utils/plate';

type VehicleKind = 'car' | 'motorcycle';
type PaymentKind = 'cash' | 'bank_transfer' | 'wallet';
type OperationMode = 'check-in' | 'check-out';

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

// Elapsed parking time from entry until now (or until exit if checked out).
const fmtDuration = (from: string | null | undefined, to?: string | null) => {
  if (!from) return '—';
  const end = to ? new Date(to).getTime() : Date.now();
  const mins = Math.max(0, Math.floor((end - new Date(from).getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h} giờ ${m} phút` : `${m} phút`;
};

export function StaffOperationsPage() {
  const { buildingId, building } = useBuildingContext();

  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  // Form state
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState<string | null>(null);
  const [vehicleType, setVehicleType] = useState<VehicleKind>('car');
  const [paymentMethod, setPaymentMethod] = useState<PaymentKind>('cash');
  const [opMessage, setOpMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  // Camera 2 — QR identification (account / vehicle), the fallback when the
  // plate can't be read by Camera 1.
  const [isIdQrOpen, setIsIdQrOpen] = useState(false);

  // Plate → account info (chỉ để hiển thị; khách vãng lai khi không có tài khoản)
  const [plateAccountInfo, setPlateAccountInfo] = useState<{ hasAccount: boolean; registeredVehicleType?: 'car' | 'motorcycle' | null; user: { id: string; fullName: string; email: string } | null } | null>(null);
  // Reject (từ chối) check-in/out flow
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  // Checkout/thanh toán modal — mở khi nhấp vào 1 xe đang đỗ
  const [checkoutTarget, setCheckoutTarget] = useState<ParkingSession | null>(null);

  // Popup đối chiếu biển số sau khi quét
  const [scannedPlateInfo, setScannedPlateInfo] = useState<PlateInfo | null>(null);
  const [isPlateInfoModalOpen, setIsPlateInfoModalOpen] = useState(false);
  const [isPlateInfoLoading, setIsPlateInfoLoading] = useState(false);

  // Bank transfer modal
  const [bankTransfer, setBankTransfer] = useState<BankTransferState | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Check-in đặt chỗ trước
  const [reservationCode, setReservationCode] = useState('');

  // Both vehicle types supported by default (staff can always override)
  const allowedTypes = ['CAR', 'MOTORCYCLE'];

  const detectTypeFromPlate = (plate: string): VehicleKind => {
    const clean = plate.trim().toUpperCase();
    if (clean.length >= 3) {
      const prefix = clean.split('-')[0]?.trim() || '';
      if (prefix.length === 3) return 'car';
      if (/[A-Z]{2}$/.test(prefix)) {
        const letters = prefix.substring(2);
        return ['LD', 'DA', 'KT', 'MD'].includes(letters) ? 'car' : 'motorcycle';
      }
      if (/^\d{2}[A-Z]\d/.test(prefix)) return 'motorcycle';
    }
    return 'car';
  };

  useEffect(() => {
    const clean = plateNumber.trim().toUpperCase();
    if (clean.length >= 3) {
      const detected = detectTypeFromPlate(clean);
      if (detected === 'motorcycle' && allowedTypes.includes('MOTORCYCLE')) setVehicleType('motorcycle');
      else if (detected === 'car' && allowedTypes.includes('CAR')) setVehicleType('car');
    }
  }, [plateNumber, allowedTypes]);

  const plateTypeWarning = useMemo(() => {
    const clean = plateNumber.trim().toUpperCase();
    if (clean.length >= 3) {
      const detected = detectTypeFromPlate(clean);
      if (detected !== vehicleType) return `Cảnh báo: Biển số có vẻ là ${detected === 'car' ? 'ô tô' : 'xe máy'}, nhưng bạn chọn ${vehicleType === 'car' ? 'ô tô' : 'xe máy'}.`;
    }
    return null;
  }, [plateNumber, vehicleType]);

  const buildingSupportWarning = useMemo(() => {
    if (allowedTypes.length === 0) return null;
    const code = vehicleType === 'car' ? 'CAR' : 'MOTORCYCLE';
    if (!allowedTypes.includes(code))
      return `Tòa nhà này không hỗ trợ loại xe ${vehicleType === 'car' ? 'ô tô' : 'xe máy'}.`;
    return null;
  }, [allowedTypes, vehicleType]);

  // Tự động tra cứu chủ biển số
  useEffect(() => {
    const clean = plateNumber.trim().toUpperCase();
    if (clean.length >= 7) {
      staffApi
        .lookupPlate(clean)
        .then((res) => {
          setPlateAccountInfo((res as { data?: typeof plateAccountInfo })?.data ?? null);
        })
        .catch(() => undefined);
    } else {
      setPlateAccountInfo(null);
    }
  }, [plateNumber]);

  // Tra cứu biển số rồi mở popup đối chiếu (dùng cho cả Camera 1 và Camera 2/QR).
  const openPlateInfo = async (plate: string, brand: string | null = null) => {
    const clean = normalizePlate(plate) || plate.trim().toUpperCase();
    setPlateNumber(clean);
    if (brand) setVehicleBrand(brand);
    setIsPlateInfoLoading(true);
    try {
      const res = await staffApi.lookupPlate(clean);
      const info = (res as { data?: PlateInfo })?.data ?? null;
      setScannedPlateInfo(info ?? { plateNumber: clean, hasAccount: false });
    } catch {
      setScannedPlateInfo({ plateNumber: clean, hasAccount: false });
    } finally {
      setIsPlateInfoLoading(false);
      setIsPlateInfoModalOpen(true);
    }
  };

  // Camera 2: giải QR (token biển số PLT- hoặc ID tài khoản) → mở popup đối chiếu.
  const handleResolveIdQr = async (code: string) => {
    setIsIdQrOpen(false);
    try {
      const res = await staffApi.resolveQr(code);
      const data = (res as {
        data?: {
          kind: 'plate' | 'user';
          plate?: { plateNumber: string; vehicleType?: string; brand?: string | null } | null;
          user?: { id: string; fullName: string; email: string } | null;
        };
      })?.data;
      if (!data) {
        setOpMessage({ type: 'err', text: 'Không nhận diện được mã QR.' });
        return;
      }
      if (data.kind === 'plate' && data.plate?.plateNumber) {
        if (data.plate.vehicleType === 'motorcycle') setVehicleType('motorcycle');
        else if (data.plate.vehicleType) setVehicleType('car');
        await openPlateInfo(data.plate.plateNumber, data.plate.brand ?? null);
      } else if (data.user) {
        setOpMessage({ type: 'ok', text: `Nhận diện tài khoản: ${data.user.fullName} (${data.user.email}).` });
      } else {
        setOpMessage({ type: 'err', text: 'Mã QR không khớp với tài khoản hoặc phương tiện nào.' });
      }
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Lỗi tra cứu mã QR.' });
    }
  };

  const refreshSessions = useCallback(() => {
    setLoading(true);
    staffApi
      .getActiveSessions({ populate: 'slot.floor,vehicleType,entryGate,exitGate' })
      .then((res) => {
        const rows = (res as { data?: { items?: ParkingSession[] } | ParkingSession[] })?.data;
        const list = Array.isArray(rows) ? rows : ((rows as { items?: ParkingSession[] })?.items ?? []);
        setSessions(list);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Tải dữ liệu thất bại'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions, reloadTick]);

  const metrics = useMemo(() => [
    { label: 'Đang đỗ', value: sessions.filter((s) => s.status === 'active').length },
    { label: 'Tổng phiên', value: sessions.length },
    { label: 'Hoàn thành', value: sessions.filter((s) => s.status === 'completed').length },
  ], [sessions]);

  const activeSessions = sessions.filter((s) => s.status === 'active');

  const onCheckIn = async () => {
    setOpMessage(null);
    const currentPlate = normalizePlate(plateNumber) || plateNumber.trim().toUpperCase();
    try {
      await staffApi.checkIn({
        plateNumber: currentPlate,
        vehicleType: vehicleType === 'motorcycle' ? 'motorcycle' : 'car',
        building: buildingId || undefined,
        vehicleBrand: vehicleBrand || undefined,
      });
      setOpMessage({ type: 'ok', text: `Đã tạo phiên gửi xe cho biển số ${currentPlate} thành công.` });
      setPlateNumber('');
      setVehicleBrand(null);
      setReloadTick((n) => n + 1);
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Check-in thất bại' });
    }
  };

  // Thanh toán & cho xe ra — chạy trên phiên đang chọn trong modal thanh toán.
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
      await staffApi.checkOut(target._id, { paymentMethod });
      setOpMessage({ type: 'ok', text: `Đã thu phí & cho ra xe ${target.plateNumber}.` });
      setPaymentMethod('cash');
      setCheckoutTarget(null);
      setReloadTick((n) => n + 1);
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Check-out thất bại' });
    }
  };

  // Staff từ chối check-in/out (vd loại xe không khớp đăng ký) → BE gửi thông báo cho khách.
  const onReject = async () => {
    const isCheckoutReject = Boolean(checkoutTarget);
    const plate = isCheckoutReject
      ? checkoutTarget!.plateNumber
      : (normalizePlate(plateNumber) || plateNumber.trim().toUpperCase());
    const stage: OperationMode = isCheckoutReject ? 'check-out' : 'check-in';
    if (!plate || !rejectReason.trim()) return;
    try {
      const res = await staffApi.reject({
        plateNumber: plate,
        stage,
        reason: rejectReason.trim(),
        building: buildingId || undefined,
      });
      const notified = (res as { data?: { notified?: boolean } })?.data?.notified;
      setOpMessage({
        type: 'ok',
        text: `Đã từ chối ${stage === 'check-out' ? 'cho xe ra' : 'cho xe vào'} biển ${plate}.${notified ? ' Đã gửi thông báo cho khách.' : ' (Biển chưa có tài khoản nên không gửi được thông báo.)'}`,
      });
      setRejectOpen(false);
      setRejectReason('');
      setCheckoutTarget(null);
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Từ chối thất bại' });
    }
  };

  // Loại xe nhận diện/đang chọn có lệch với loại đã đăng ký không?
  const vehicleTypeMismatch = Boolean(
    plateAccountInfo?.registeredVehicleType && plateAccountInfo.registeredVehicleType !== vehicleType
  );

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

  const onCheckInReservation = async () => {
    if (!reservationCode.trim()) return;
    setOpMessage(null);
    try {
      await staffApi.checkInReservation(reservationCode.trim());
      setOpMessage({ type: 'ok', text: 'Check-in đặt chỗ trước thành công.' });
      setReservationCode('');
      setReloadTick((n) => n + 1);
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Check-in đặt chỗ thất bại' });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="grid gap-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Ca vận hành</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">Check-in / Check-out</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {building ? `${building.code} · ${building.name}` : 'Chưa chọn tòa nhà'}
            </p>
          </div>
          <Button variant="secondary" onClick={refreshSessions} className="gap-2 self-start lg:self-auto">
            <RefreshCcw size={14} /> Làm mới
          </Button>
        </div>
      </section>

      {/* Metrics */}
      <section className="grid gap-3 sm:grid-cols-3">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">{m.label}</p>
              <p className="mt-3 text-3xl font-semibold text-foreground">{loading ? '–' : String(m.value)}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Main panel */}
      <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        {/* Form vận hành */}
        <Card>
          <CardHeader>
            <CardTitle>Thao tác vận hành</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Nhận diện phương tiện (Xe vào) */}
            <div className="space-y-2.5">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Bước 1 · Nhận diện (xe vào)</p>
              <AIAutoScanZone
                onPlateDetected={({ plateNumber: plate, brand }: ScanResult) => openPlateInfo(plate, brand)}
                onCameraOpen={() => setIsCameraModalOpen(true)}
                isScanning={isPlateInfoLoading}
              />

              {/* Camera 2 — QR identification fallback */}
              <button
                type="button"
                onClick={() => setIsIdQrOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/40"
              >
                <QrCode size={15} className="text-primary" /> Camera 2 · Quét QR (dự phòng)
              </button>
              <p className="text-[11px] text-muted-foreground text-center">
                Xe ra: nhấp vào xe ở danh sách <strong>"Xe đang đỗ"</strong> bên phải để thanh toán.
              </p>
            </div>

            {/* Thông tin xe */}
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Bước 2 · Thông tin xe</p>
              <div className="grid gap-1.5">
                <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Biển số xe</label>
                <Input
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  onBlur={(e) => {
                    const n = normalizePlate(e.target.value);
                    if (n) setPlateNumber(n);
                  }}
                  placeholder="59G2-038.80"
                  onKeyDown={(e) => e.key === 'Enter' && onCheckIn()}
                />
                {vehicleBrand && (
                  <span className="inline-flex w-fit items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-300">
                    <Car size={11} /> Hãng xe: {vehicleBrand}
                  </span>
                )}
                {plateNumber.trim().length >= 7 && plateAccountInfo?.hasAccount && (
                  <div className="mt-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <p className="text-xs text-emerald-400">
                      Thành viên: <strong className="text-foreground">{plateAccountInfo.user?.fullName}</strong> ({plateAccountInfo.user?.email})
                    </p>
                  </div>
                )}
                {plateNumber.trim().length >= 7 && plateAccountInfo && !plateAccountInfo.hasAccount && (
                  <div className="mt-1 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <p className="text-xs text-amber-300">
                      Biển số <strong className="text-foreground">{plateNumber.toUpperCase()}</strong> — <strong>Khách vãng lai</strong> (chưa có tài khoản).
                    </p>
                  </div>
                )}
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Loại xe</label>
                <div className="flex gap-2 p-1 rounded-lg bg-muted border border-border">
                  <button
                    type="button"
                    disabled={!allowedTypes.includes('CAR')}
                    onClick={() => setVehicleType('car')}
                    className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-bold transition-all ${vehicleType === 'car' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground disabled:opacity-30'}`}
                  >
                    <Car size={13} /> Ô tô {!allowedTypes.includes('CAR') && '(N/A)'}
                  </button>
                  <button
                    type="button"
                    disabled={!allowedTypes.includes('MOTORCYCLE')}
                    onClick={() => setVehicleType('motorcycle')}
                    className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-bold transition-all ${vehicleType === 'motorcycle' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground disabled:opacity-30'}`}
                  >
                    <Bike size={13} /> Xe máy {!allowedTypes.includes('MOTORCYCLE') && '(N/A)'}
                  </button>
                </div>
                {plateTypeWarning && <p className="text-[11px] text-amber-400 flex items-center gap-1"><AlertCircle size={11} /> {plateTypeWarning}</p>}
                {buildingSupportWarning && <p className="text-[11px] text-rose-400 flex items-center gap-1"><AlertCircle size={11} /> {buildingSupportWarning}</p>}
                {vehicleTypeMismatch && (
                  <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-[11px] text-rose-300 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1">
                      <AlertCircle size={12} /> Loại xe không khớp đăng ký (đã đăng ký: <strong>{plateAccountInfo?.registeredVehicleType === 'car' ? 'Ô tô' : 'Xe máy'}</strong>).
                    </span>
                    <button type="button" onClick={() => setRejectOpen(true)} className="shrink-0 rounded-md bg-rose-500 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-rose-400">
                      Từ chối
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Nút hành động */}
            <div className="flex gap-2">
              <Button
                onClick={onCheckIn}
                disabled={!plateNumber.trim() || loading || !!buildingSupportWarning}
                className="flex-1 h-11 gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60"
              >
                <ScanLine size={16} /> Check-in (xe vào)
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectOpen(true)}
                disabled={loading || !plateNumber.trim()}
                className="h-11 border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
              >
                Từ chối
              </Button>
            </div>

            {/* Check-in đặt chỗ trước */}
            <div className="rounded-xl border border-border bg-card/50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary mb-3">Check-in đặt chỗ trước</p>
              <div className="flex gap-2">
                <Input
                  value={reservationCode}
                  onChange={(e) => setReservationCode(e.target.value)}
                  placeholder="Mã đặt chỗ / ID"
                  onKeyDown={(e) => e.key === 'Enter' && onCheckInReservation()}
                />
                <Button type="button" onClick={() => setIsQrModalOpen(true)} variant="secondary" className="shrink-0 gap-1.5">
                  <QrCode size={14} /> Quét QR
                </Button>
                <Button
                  type="button"
                  onClick={onCheckInReservation}
                  disabled={!reservationCode.trim()}
                  className="shrink-0 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60"
                >
                  Check-in
                </Button>
              </div>
            </div>

            {/* Phản hồi thao tác */}
            {opMessage && (
              <div className={`rounded-xl border p-4 text-sm ${opMessage.type === 'ok' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'}`}>
                {opMessage.text}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danh sách phiên đang đỗ */}
        <Card>
          <CardHeader>
            <CardTitle>Xe đang đỗ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Đang tải...</p>
            ) : error ? (
              <p className="text-sm text-rose-400">{error}</p>
            ) : activeSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Không có xe đang đỗ.</p>
            ) : (
              activeSessions.slice(0, 8).map((s) => {
                const floor = s.slot?.floor?.name || s.slot?.floor?.code || '—';
                const slotCode = s.slot?.code || '—';
                const isMember = Boolean(s.isMember ?? s.user);
                return (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => { setCheckoutTarget(s); setPaymentMethod('cash'); }}
                    title="Nhấp để thanh toán & cho xe ra"
                    className="block w-full rounded-xl border border-border bg-card p-3.5 text-left transition hover:border-primary/40 hover:bg-primary/5"
                  >
                    {/* Header: plate + member/walk-in */}
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

                    {/* Detail grid */}
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
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Giờ ra</span>
                        <p className="font-medium text-foreground">{s.exitTime ? fmtTime(s.exitTime) : 'Chưa ra'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Thời gian đỗ</span>
                        <p className="font-medium text-primary">{fmtDuration(s.entryTime, s.exitTime)}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Phí tạm tính</span>
                        <p className="font-bold text-primary">{fmtMoney(s.currentFee ?? s.fee)}</p>
                      </div>
                    </div>
                    <p className="mt-2.5 text-center text-[11px] font-semibold text-primary">Nhấp để thanh toán & cho xe ra →</p>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>

      {/* QR Scanner Modal (mã đặt chỗ) */}
      <QRCodeScannerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onScanSuccess={(code: string) => {
          setReservationCode(code);
          setOpMessage({ type: 'ok', text: `Đã quét mã đặt chỗ: ${code}` });
        }}
      />

      <CameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={({ plateNumber: plate, brand }: ScanResult) => {
          setIsCameraModalOpen(false);
          if (plate) openPlateInfo(plate, brand);
        }}
      />

      {/* Camera 2 — QR identification (account / vehicle) fallback */}
      <QRCodeScannerModal
        isOpen={isIdQrOpen}
        onClose={() => setIsIdQrOpen(false)}
        onScanSuccess={handleResolveIdQr}
        title="Camera 2 · Quét QR tài khoản / phương tiện"
      />

      {/* Từ chối check-in/out */}
      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-card p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-400">Từ chối {checkoutTarget ? 'cho xe ra' : 'cho xe vào'}</p>
                <h3 className="text-xl font-semibold text-foreground">Lý do từ chối</h3>
              </div>
              <button onClick={() => { setRejectOpen(false); setRejectReason(''); }} className="text-muted-foreground hover:text-foreground transition">✕</button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Biển số <strong className="text-foreground font-mono">{checkoutTarget?.plateNumber || normalizePlate(plateNumber) || plateNumber || '—'}</strong>. Hệ thống sẽ gửi thông báo kèm lý do đến tài khoản khách (nếu biển đã đăng ký).
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Vd: Đăng ký xe máy nhưng thực tế là ô tô; thông tin phương tiện không khớp..."
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

      {/* Thanh toán & cho xe ra (mở khi nhấp vào 1 xe đang đỗ) */}
      {checkoutTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Thanh toán · Xe ra</p>
                <h3 className="text-xl font-semibold text-foreground font-mono">{checkoutTarget.plateNumber}</h3>
              </div>
              <button onClick={() => { setCheckoutTarget(null); setPaymentMethod('cash'); }} className="text-muted-foreground hover:text-foreground transition">✕</button>
            </div>

            {/* Chi tiết phiên */}
            <div className="rounded-xl border border-border bg-card/50 p-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Khách</span><span className="font-medium text-foreground">{(checkoutTarget.isMember ?? checkoutTarget.user) ? (checkoutTarget.user?.fullName || 'Thành viên') : 'Khách vãng lai'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Loại xe</span><span className="font-medium text-foreground">{checkoutTarget.vehicleType?.name ?? '—'}{checkoutTarget.vehicleBrand ? ` · ${checkoutTarget.vehicleBrand}` : ''}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Vào lúc</span><span className="font-medium text-foreground">{fmtTime(checkoutTarget.entryTime)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Thời gian đỗ</span><span className="font-medium text-foreground">{fmtDuration(checkoutTarget.entryTime)}</span></div>
            </div>

            {/* Số tiền phải trả */}
            <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Số tiền phải trả</span>
              <span className="font-mono text-2xl font-black text-primary">{fmtMoney(checkoutTarget.currentFee ?? checkoutTarget.fee)}</span>
            </div>

            {/* Phương thức thanh toán */}
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

      {/* Modal đối chiếu thông tin biển số xe sau khi quét */}
      {isPlateInfoModalOpen && scannedPlateInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            {/* Header with status gradient */}
            <div className={`px-6 py-4 flex items-center gap-3 border-b border-border bg-gradient-to-r ${
              scannedPlateInfo.hasAccount
                ? 'from-emerald-500/10 to-teal-500/10 text-emerald-400'
                : 'from-amber-500/10 to-orange-500/10 text-amber-400'
            }`}>
              {scannedPlateInfo.hasAccount ? (
                <ShieldCheck className="h-5 w-5 shrink-0" />
              ) : (
                <ShieldAlert className="h-5 w-5 shrink-0" />
              )}
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.24em] opacity-80">
                  {scannedPlateInfo.hasAccount ? 'Thành viên hệ thống' : 'Khách vãng lai'}
                </p>
                <h3 className="text-base font-bold text-foreground">
                  {scannedPlateInfo.hasAccount ? 'Đối chiếu thành công' : 'Chưa liên kết tài khoản'}
                </h3>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Realistic Vehicle Plate Visualizer */}
              <div className="flex justify-center">
                <div className="relative border-4 border-slate-800 bg-white text-slate-900 px-6 py-2.5 rounded-xl font-mono font-black text-2xl tracking-widest shadow-lg flex flex-col items-center min-w-[200px] select-none before:content-[''] before:absolute before:inset-0.5 before:border before:border-slate-300 before:rounded-lg">
                  <span className="text-[8px] font-sans font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 w-full text-center pb-0.5 mb-1 z-10">
                    VIỆT NAM
                  </span>
                  <span className="z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">{scannedPlateInfo.plateNumber}</span>
                </div>
              </div>

              {/* Status and Details */}
              {scannedPlateInfo.hasAccount && scannedPlateInfo.user ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-emerald-500/15 p-2 text-emerald-400">
                        <User size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Họ và tên</p>
                        <p className="text-sm font-semibold text-foreground">{scannedPlateInfo.user.fullName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 border-t border-border/50 pt-2.5">
                      <div className="rounded-full bg-emerald-500/15 p-2 text-emerald-400">
                        <Mail size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Email</p>
                        <p className="text-sm font-semibold text-foreground truncate max-w-[240px]">{scannedPlateInfo.user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 border-t border-border/50 pt-2.5">
                      <div className="rounded-full bg-emerald-500/15 p-2 text-emerald-400">
                        <Phone size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Số điện thoại</p>
                        <p className="text-sm font-semibold text-foreground">{scannedPlateInfo.user.phone || 'Chưa cập nhật'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 border-t border-border/50 pt-2.5">
                      <div className="rounded-full bg-emerald-500/15 p-2 text-emerald-400">
                        <Wallet size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Số dư ví</p>
                        <p className="text-base font-black text-emerald-400">{scannedPlateInfo.user.walletBalance.toLocaleString('vi-VN')} đ</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3 text-center">
                  <p className="text-sm text-amber-200/90 leading-relaxed">
                    Hệ thống không tìm thấy tài khoản thành viên nào được liên kết với biển số <strong className="text-amber-400 font-mono">{scannedPlateInfo.plateNumber}</strong>.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    "Dạ thưa anh/chị, biển số này chưa đăng ký tài khoản. Anh/chị có muốn liên kết vào tài khoản thành viên để được hưởng ưu đãi và nhận diện tự động không ạ?"
                  </p>
                </div>
              )}

              {/* Active Session Status (Important context for check-in / check-out decision) */}
              {scannedPlateInfo.activeSession && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 flex gap-2.5 items-start">
                  <div className="rounded-lg bg-rose-500/10 p-2 text-rose-400 shrink-0">
                    <Calendar size={15} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-rose-400">Xe đang đỗ trong bãi — chọn "Thanh toán &amp; cho ra"</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Vào lúc: {new Date(scannedPlateInfo.activeSession.entryTime).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="bg-muted/50 border-t border-border/80 px-6 py-4 flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsPlateInfoModalOpen(false);
                  setScannedPlateInfo(null);
                }}
                className="flex-1 text-xs"
              >
                Đóng
              </Button>

              {scannedPlateInfo.activeSession ? (
                <Button
                  onClick={() => {
                    const full = sessions.find((s) => s._id === scannedPlateInfo.activeSession!.id);
                    setIsPlateInfoModalOpen(false);
                    setScannedPlateInfo(null);
                    if (full) { setCheckoutTarget(full); setPaymentMethod('cash'); }
                    else setOpMessage({ type: 'err', text: 'Không tìm thấy phiên trong danh sách — bấm Làm mới rồi thử lại.' });
                  }}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 font-bold text-xs"
                >
                  Thanh toán &amp; cho ra
                </Button>
              ) : (
                <Button
                  onClick={async () => {
                    setIsPlateInfoModalOpen(false);
                    setScannedPlateInfo(null);
                    await onCheckIn();
                  }}
                  disabled={!!buildingSupportWarning}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 font-bold text-xs"
                >
                  Check-in ngay
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
