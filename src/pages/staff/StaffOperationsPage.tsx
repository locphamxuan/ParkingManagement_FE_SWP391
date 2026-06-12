import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScanLine,
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
  Image as ImageIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { staffApi, type PlateInfo } from '@/services/staff/staffApi';
import { LivePlateCamera, type PlateScanResult, type LiveCameraHandle } from '@/components/staff/LivePlateCamera';
import { LiveQRCamera } from '@/components/staff/LiveQRCamera';
import { LivePortraitCamera } from '@/components/staff/LivePortraitCamera';
import { QRCodeScannerModal } from '@/components/staff/QRCodeScannerModal';
import { normalizePlate } from '@/utils/plate';

type VehicleKind = 'car' | 'motorcycle';
type OperationMode = 'check-in' | 'check-out';

// Loại xe tòa nhà hỗ trợ (staff luôn có thể chọn cả 2). Đặt ở module scope để
// tham chiếu ổn định — tránh effect tự-nhận-diện chạy lại mỗi lần render và ghi
// đè lựa chọn loại xe thủ công của nhân viên.
const ALLOWED_TYPES = ['CAR', 'MOTORCYCLE'];

export function StaffOperationsPage() {
  const { buildingId, building } = useBuildingContext();

  const [loading, setLoading] = useState(false);

  // Form state
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState<string | null>(null);
  const [vehicleType, setVehicleType] = useState<VehicleKind>('car');
  const [opMessage, setOpMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Captured camera snapshots (saved to DB at check-in).
  const [plateImage, setPlateImage] = useState<string | null>(null);
  const [portraitImage, setPortraitImage] = useState<string | null>(null);
  // Imperative handles so we can grab a fresh frame from either camera at the
  // moment of check-in — guaranteeing BOTH plate + portrait images are saved.
  const plateCamRef = useRef<LiveCameraHandle>(null);
  const qrCamRef = useRef<LiveCameraHandle>(null);
  const portraitCamRef = useRef<LiveCameraHandle>(null);

  // Plate → account info (chỉ để hiển thị; khách vãng lai khi không có tài khoản)
  const [plateAccountInfo, setPlateAccountInfo] = useState<{ hasAccount: boolean; registeredVehicleType?: 'car' | 'motorcycle' | null; user: { id: string; fullName: string; email: string } | null } | null>(null);
  // Reject (từ chối) check-in flow
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Popup đối chiếu biển số sau khi quét
  const [scannedPlateInfo, setScannedPlateInfo] = useState<PlateInfo | null>(null);
  const [isPlateInfoModalOpen, setIsPlateInfoModalOpen] = useState(false);
  const [isPlateInfoLoading, setIsPlateInfoLoading] = useState(false);

  // Check-in đặt chỗ trước
  const [reservationCode, setReservationCode] = useState('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Both vehicle types supported by default (staff can always override)
  const allowedTypes = ALLOWED_TYPES;

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

  // Tự nhận diện loại xe khi BIỂN SỐ thay đổi (không ghi đè khi nhân viên tự đổi).
  useEffect(() => {
    const clean = plateNumber.trim().toUpperCase();
    if (clean.length >= 3) {
      const detected = detectTypeFromPlate(clean);
      if (detected === 'motorcycle' && ALLOWED_TYPES.includes('MOTORCYCLE')) setVehicleType('motorcycle');
      else if (detected === 'car' && ALLOWED_TYPES.includes('CAR')) setVehicleType('car');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plateNumber]);

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

  // Camera 1 nhận diện biển số → lưu ảnh biển số + mở popup đối chiếu.
  const handlePlateDetected = ({ plateNumber: plate, brand, plateImage: img }: PlateScanResult) => {
    setPlateImage(img);
    void openPlateInfo(plate, brand);
  };

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

  // Camera 3: quét QR (token biển số PLT- hoặc ID tài khoản) → mở popup. Ảnh chân
  // dung do camera chân dung (Camera 1) chụp riêng lúc check-in.
  const handleResolveIdQr = async (code: string) => {
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
        setOpMessage({ type: 'ok', text: `Đã nhận diện tài khoản: ${data.user.fullName} (${data.user.email}). Đã lưu ảnh chân dung.` });
      } else {
        setOpMessage({ type: 'err', text: 'Mã QR không khớp với tài khoản hoặc phương tiện nào.' });
      }
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Lỗi tra cứu mã QR.' });
    }
  };

  const resetForm = () => {
    setPlateNumber('');
    setVehicleBrand(null);
    setPlateImage(null);
    setPortraitImage(null);
    setPlateAccountInfo(null);
  };

  const onCheckIn = async () => {
    setOpMessage(null);
    setLoading(true);
    const currentPlate = normalizePlate(plateNumber) || plateNumber.trim().toUpperCase();
    // Ensure BOTH images are captured at check-in: use the already-scanned frame
    // if present, otherwise grab a fresh frame from the live camera. This way the
    // checkout staff always sees a full plate + portrait set.
    const plateImg = plateImage ?? plateCamRef.current?.capture() ?? null;
    // Ảnh chân dung lấy từ camera chân dung riêng (Camera 1).
    const portraitImg = portraitImage ?? portraitCamRef.current?.capture() ?? null;
    try {
      await staffApi.checkIn({
        plateNumber: currentPlate,
        vehicleType: vehicleType === 'motorcycle' ? 'motorcycle' : 'car',
        building: buildingId || undefined,
        vehicleBrand: vehicleBrand || undefined,
        plateImage: plateImg,
        portraitImage: portraitImg,
      });
      setOpMessage({ type: 'ok', text: `Đã tạo phiên gửi xe cho biển số ${currentPlate} thành công.` });
      resetForm();
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Check-in thất bại' });
    } finally {
      setLoading(false);
    }
  };

  // Staff từ chối check-in (vd loại xe không khớp đăng ký) → BE gửi thông báo cho khách.
  const onReject = async () => {
    const plate = normalizePlate(plateNumber) || plateNumber.trim().toUpperCase();
    const stage: OperationMode = 'check-in';
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
        text: `Đã từ chối cho xe vào biển ${plate}.${notified ? ' Đã gửi thông báo cho khách.' : ' (Biển chưa có tài khoản nên không gửi được thông báo.)'}`,
      });
      setRejectOpen(false);
      setRejectReason('');
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Từ chối thất bại' });
    }
  };

  // Loại xe nhận diện/đang chọn có lệch với loại đã đăng ký không?
  const vehicleTypeMismatch = Boolean(
    plateAccountInfo?.registeredVehicleType && plateAccountInfo.registeredVehicleType !== vehicleType
  );

  const onCheckInReservation = async () => {
    if (!reservationCode.trim()) return;
    setOpMessage(null);
    try {
      await staffApi.checkInReservation(reservationCode.trim());
      setOpMessage({ type: 'ok', text: 'Check-in đặt chỗ trước thành công.' });
      setReservationCode('');
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
            <h2 className="mt-1 text-xl font-semibold text-foreground">Check-in xe vào</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {building ? `${building.code} · ${building.name}` : 'Chưa chọn tòa nhà'}
            </p>
          </div>
          <Link
            to="/staff/parked"
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-md bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/80 lg:self-auto"
          >
            <Car size={14} /> Xe đang đỗ
          </Link>
        </div>
      </section>

      {/* 3 camera riêng biệt: Chân dung · Biển số · QR */}
      <section className="grid gap-4 lg:grid-cols-3">
        <LivePortraitCamera ref={portraitCamRef} paused={isPlateInfoModalOpen} />
        <LivePlateCamera ref={plateCamRef} onDetected={handlePlateDetected} busy={loading || isPlateInfoLoading} />
        <LiveQRCamera ref={qrCamRef} onResult={handleResolveIdQr} paused={isPlateInfoModalOpen} />
      </section>

      {/* Main panel */}
      <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        {/* Form vận hành */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin xe vào</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-4">
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

              {/* Captured snapshots preview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Ảnh biển số</p>
                  <div className="aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted/40 flex items-center justify-center">
                    {plateImage ? (
                      <img src={plateImage} alt="Ảnh biển số" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon size={20} className="text-muted-foreground/40" />
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Ảnh chân dung</p>
                  <div className="aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted/40 flex items-center justify-center">
                    {portraitImage ? (
                      <img src={portraitImage} alt="Ảnh chân dung" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon size={20} className="text-muted-foreground/40" />
                    )}
                  </div>
                </div>
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
                    <Car size={13} /> Ô tô
                  </button>
                  <button
                    type="button"
                    disabled={!allowedTypes.includes('MOTORCYCLE')}
                    onClick={() => setVehicleType('motorcycle')}
                    className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-bold transition-all ${vehicleType === 'motorcycle' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground disabled:opacity-30'}`}
                  >
                    <Bike size={13} /> Xe máy
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

            {/* Phản hồi thao tác */}
            {opMessage && (
              <div className={`rounded-xl border p-4 text-sm ${opMessage.type === 'ok' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'}`}>
                {opMessage.text}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Đặt chỗ trước + hướng dẫn */}
        <Card>
          <CardHeader>
            <CardTitle>Check-in đặt chỗ trước</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Khách đặt chỗ trước có thể tự check-in tại cổng bằng cách quét QR phương tiện (không cần qua nhân viên).
              Nhân viên cũng có thể nhập/quét mã đặt chỗ tại đây.
            </p>
            <div className="flex gap-2">
              <Input
                value={reservationCode}
                onChange={(e) => setReservationCode(e.target.value)}
                placeholder="Mã đặt chỗ / ID"
                onKeyDown={(e) => e.key === 'Enter' && onCheckInReservation()}
              />
              <Button type="button" onClick={() => setIsQrModalOpen(true)} variant="secondary" className="shrink-0 gap-1.5">
                Quét QR
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
            <div className="rounded-xl border border-border bg-card/50 p-4 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">Xe ra / thanh toán</p>
              Việc thu phí &amp; cho xe ra do nhân viên cổng ra thực hiện. Xem danh sách tại tab <Link to="/staff/parked" className="font-semibold text-primary hover:underline">“Xe đang đỗ”</Link>.
            </div>
          </CardContent>
        </Card>
      </section>

      {/* QR Scanner Modal (mã đặt chỗ) */}
      <QRCodeScannerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onScanSuccess={(code: string) => {
          setReservationCode(code);
          setIsQrModalOpen(false);
          setOpMessage({ type: 'ok', text: `Đã quét mã đặt chỗ: ${code}` });
        }}
        title="Quét mã đặt chỗ"
      />

      {/* Từ chối check-in */}
      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-card p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-400">Từ chối cho xe vào</p>
                <h3 className="text-xl font-semibold text-foreground">Lý do từ chối</h3>
              </div>
              <button onClick={() => { setRejectOpen(false); setRejectReason(''); }} className="text-muted-foreground hover:text-foreground transition">✕</button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Biển số <strong className="text-foreground font-mono">{normalizePlate(plateNumber) || plateNumber || '—'}</strong>. Hệ thống sẽ gửi thông báo kèm lý do đến tài khoản khách (nếu biển đã đăng ký).
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
                    Khách vãng lai — nhân viên xử lý check-in thủ công như bình thường.
                  </p>
                </div>
              )}

              {/* Active Session Status — xe đang đỗ → sang tab Xe đang đỗ */}
              {scannedPlateInfo.activeSession && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 flex gap-2.5 items-start">
                  <div className="rounded-lg bg-rose-500/10 p-2 text-rose-400 shrink-0">
                    <Calendar size={15} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-rose-400">Xe đang đỗ trong bãi — nhân viên cổng ra sẽ cho xe ra</p>
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
                <Link
                  to="/staff/parked"
                  className="flex-1 inline-flex h-10 items-center justify-center rounded-md bg-gradient-to-r from-orange-500 to-amber-400 text-xs font-bold text-slate-950"
                >
                  Xem xe đang đỗ
                </Link>
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
