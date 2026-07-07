import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScanLine,
  AlertCircle,
  Car,
  Bike,
  ArrowLeft,
  ArrowRight,
  UserSquare,
  QrCode,
  Settings,
  Image as ImageIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { staffApi, type PlateInfo } from '@/services/staff/staffApi';
import { useAssignedGates } from '@/hooks/staff/useAssignedGates';
import { LivePlateCamera, type PlateScanResult, type LiveCameraHandle } from '@/components/staff/LivePlateCamera';
import { LiveQRCamera } from '@/components/staff/LiveQRCamera';
import { LivePortraitCamera } from '@/components/staff/LivePortraitCamera';
import { useCameraDevices, type CameraRole } from '@/hooks/useCameraDevices';
import { normalizePlate } from '@/utils/plate';
import { CameraSetupModal } from '@/components/staff/CameraSetupModal';
import { RejectModal } from '@/components/staff/RejectModal';
import { UserQrInfoModal, type UserQrInfo } from '@/components/staff/UserQrInfoModal';

type VehicleKind = 'car' | 'motorcycle';
type OperationMode = 'check-in' | 'check-out';

// Vehicle Type tòa nhà hỗ trợ (staff luôn có thể chọn cả 2). Đặt ở module scope để
// tham chiếu ổn định — tránh effect tự-nhận-diện chạy lại mỗi lần render và ghi
// đè lựa chọn loại xe thủ công của nhân viên.
const ALLOWED_TYPES = ['CAR', 'MOTORCYCLE'];

export function StaffOperationsPage() {
  const { buildingId, building } = useBuildingContext();
  const { gates } = useAssignedGates();
  const entryGateId = gates.find((g) => g.direction === 'in' || g.direction === 'both')?._id;

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

  // Gán thiết bị camera vật lý cho từng vai trò (hỗ trợ nhiều camera thực tế).
  const { devices, assignment, assign, requestAndRefresh } = useCameraDevices();
  const [cameraSettingsOpen, setCameraSettingsOpen] = useState(false);
  // Số thiết bị KHÁC NHAU đã gán — đủ 2+ thì mới có ý nghĩa "mở nhiều camera cùng lúc".
  const distinctDeviceCount = new Set(
    [assignment.plate, assignment.portrait, assignment.qr].filter(Boolean),
  ).size;
  // Chế độ nhiều camera: mở cả 3 cùng lúc để chụp đồng thời (quầy có nhiều camera).
  const [multiCamMode, setMultiCamMode] = useState(() => distinctDeviceCount >= 2);

  // Wizard tuần tự: mỗi bước chỉ 1 camera chạy.
  //  1: Identify Vehicle (biển số AI / QR) · 2: Capture Portrait · 3: Confirm & check-in
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [identifyMode, setIdentifyMode] = useState<'plate' | 'qr'>('plate');

  // Plate → account info (chỉ để hiển thị; khách vãng lai khi không có tài khoản)
  const [plateAccountInfo, setPlateAccountInfo] = useState<PlateInfo | null>(null);
  // Package floating: khi biển số có gói còn hạn, staff phải chọn 1 slot trống.
  const [freeSlots, setFreeSlots] = useState<{ _id: string; code: string; floor?: { name?: string; code?: string } | null }[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  // Reject (từ chối) check-in flow
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  // QR user scan: thông tin tài khoản + gói đang hoạt động
  const [userQrInfo, setUserQrInfo] = useState<UserQrInfo | null>(null);

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
      if (detected !== vehicleType) return `Warning: the license plate appears to be ${detected === 'car' ? 'car' : 'motorcycle'}, but you selected ${vehicleType === 'car' ? 'car' : 'motorcycle'}.`;
    }
    return null;
  }, [plateNumber, vehicleType]);

  const buildingSupportWarning = useMemo(() => {
    if (allowedTypes.length === 0) return null;
    const code = vehicleType === 'car' ? 'CAR' : 'MOTORCYCLE';
    if (!allowedTypes.includes(code))
      return `This building does not support vehicle type ${vehicleType === 'car' ? 'car' : 'motorcycle'}.`;
    return null;
  }, [allowedTypes, vehicleType]);

  // Tự động tra cứu chủ biển số
  useEffect(() => {
    const clean = plateNumber.trim().toUpperCase();
    if (clean.length >= 7) {
      let cancelled = false;
      staffApi
        .lookupPlate(clean)
        .then((res) => {
          if (!cancelled) setPlateAccountInfo((res as { data?: PlateInfo })?.data ?? null);
        })
        .catch(() => undefined);
      return () => { cancelled = true; };
    } else {
      setPlateAccountInfo(null);
    }
  }, [plateNumber]);

  // License Plate có gói còn hạn → tải slot trống của tòa nhà để staff gán chỗ.
  const hasActivePackage = Boolean(plateAccountInfo?.hasActivePackage);
  const hasActiveReservation = Boolean(plateAccountInfo?.hasActiveReservation);
  // Loại check-in quyết định luật ảnh:
  //  - 'package'/'reservation': chỉ cần quét (biển/QR) định danh — không bắt ảnh.
  //  - 'standard' (khách vãng lai / user thường): bắt buộc ảnh biển + chân dung.
  const checkInKind: 'package' | 'reservation' | 'standard' = hasActivePackage
    ? 'package'
    : hasActiveReservation
      ? 'reservation'
      : 'standard';
  // Load free slots cho cả package lẫn standard (khách vãng lai / user thường cũng phải chọn slot)
  const needsSlotSelection = hasActivePackage || checkInKind === 'standard';
  useEffect(() => {
    if (!needsSlotSelection || !buildingId) {
      setFreeSlots([]);
      setSelectedSlotId('');
      return;
    }
    let cancelled = false;
    staffApi
      .freeSlots(buildingId)
      .then((res) => {
        if (!cancelled) setFreeSlots((res as { data?: { items?: typeof freeSlots } })?.data?.items ?? []);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [needsSlotSelection, buildingId]);

  // Áp biển số đã nhận diện (AI/QR) → lookup chạy tự động qua effect theo plateNumber.
  const applyPlate = (plate: string, brand: string | null = null) => {
    const clean = normalizePlate(plate) || plate.trim().toUpperCase();
    setPlateNumber(clean);
    if (brand) setVehicleBrand(brand);
  };

  // Camera biển số: luôn lưu ảnh vừa chụp; chỉ áp số biển nếu AI đọc được.
  // KHÔNG tự sang bước sau — đợi lookup để biết loại (gói/đặt chỗ/thường) rồi mới rẽ.
  const handlePlateDetected = ({ plateNumber: plate, brand, plateImage: img }: PlateScanResult) => {
    setPlateImage(img);
    if (plate) applyPlate(plate, brand);
  };

  // Rời bước 1 → bước Capture Portrait. MỌI loại check-in đều cần ảnh chân dung
  // (đối chiếu người khi lấy xe). License Plate Photo bắt buộc thêm với khách vãng lai /
  // user thường (gói/đặt chỗ định danh bằng quét nên biển là optional).
  const proceedFromIdentify = () => {
    setStep(2);
  };

  // Bước 2: chụp chân dung từ camera chân dung → lưu ảnh → sang bước Confirm.
  const capturePortraitAndNext = () => {
    const img = portraitCamRef.current?.capture() ?? null;
    if (!img) {
      setOpMessage({ type: 'err', text: 'Portrait camera is not ready. Please try again.' });
      return;
    }
    setPortraitImage(img);
    setOpMessage(null);
    setStep(3);
  };

  // Camera 3: quét QR (token biển số PLT- hoặc ID tài khoản) → mở popup. Ảnh chân
  // dung do camera chân dung (Camera 1) chụp riêng lúc check-in.
  const handleResolveIdQr = async (code: string) => {
    try {
      const res = await staffApi.resolveQr(code, buildingId);
      const data = (res as {
        data?: {
          kind: 'plate' | 'user';
          plate?: { plateNumber: string; vehicleType?: string; brand?: string | null } | null;
          user?: { id: string; fullName: string; email: string; walletBalance?: number } | null;
          activePackages?: { id: string; name: string; code: string | null; plateNumber: string; endDate?: string }[];
        };
      })?.data;
      if (!data) {
        setOpMessage({ type: 'err', text: 'Could not recognize the QR code.' });
        return;
      }
      if (data.kind === 'plate' && data.plate?.plateNumber) {
        if (data.plate.vehicleType === 'motorcycle') setVehicleType('motorcycle');
        else if (data.plate.vehicleType) setVehicleType('car');
        applyPlate(data.plate.plateNumber, data.plate.brand ?? null);
        // Không tự sang bước — đợi lookup để biết loại; nhân viên bấm "Continue".
        setOpMessage({ type: 'ok', text: `Recognized license plate ${data.plate.plateNumber}. Click "Continue".` });
      } else if (data.user) {
        setUserQrInfo({
          fullName: data.user.fullName,
          email: data.user.email,
          walletBalance: data.user.walletBalance,
          activePackages: data.activePackages ?? [],
        });
        setOpMessage({ type: 'ok', text: `Recognized account: ${data.user.fullName}. Please scan or enter the license plate.` });
      } else {
        setOpMessage({ type: 'err', text: 'The QR code does not match any account or vehicle.' });
      }
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'QR lookup failed.' });
    }
  };

  const resetForm = () => {
    setPlateNumber('');
    setVehicleBrand(null);
    setPlateImage(null);
    setPortraitImage(null);
    setPlateAccountInfo(null);
    setFreeSlots([]);
    setSelectedSlotId('');
    setStep(1);
    setIdentifyMode('plate');
  };

  const onCheckIn = async () => {
    setOpMessage(null);
    // Package floating: bắt buộc chọn slot trống cho xe mua gói.
    if (hasActivePackage && !selectedSlotId) {
      setOpMessage({ type: 'err', text: 'This vehicle has a long-term package. Please select an available slot before check-in.' });
      return;
    }
    setLoading(true);
    const currentPlate = normalizePlate(plateNumber) || plateNumber.trim().toUpperCase();
    // Ensure BOTH images are captured at check-in: use the already-scanned frame
    // if present, otherwise grab a fresh frame from the live camera. This way the
    // checkout staff always sees a full plate + portrait set.
    const plateImg = plateImage ?? plateCamRef.current?.capture() ?? null;
    // Portrait Photo lấy từ camera chân dung riêng (Camera 1).
    const portraitImg = portraitImage ?? portraitCamRef.current?.capture() ?? null;
    try {
      await staffApi.checkIn({
        plateNumber: currentPlate,
        vehicleType: vehicleType === 'motorcycle' ? 'motorcycle' : 'car',
        building: buildingId || undefined,
        vehicleBrand: vehicleBrand || undefined,
        plateImage: plateImg,
        portraitImage: portraitImg,
        slot: selectedSlotId || undefined,
        gate: entryGateId || undefined,
      });
      setOpMessage({ type: 'ok', text: `Created parking session for plate ${currentPlate} successfully.` });
      resetForm();
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Check-in failed' });
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
        text: `Rejected check-in for plate ${plate}.${notified ? ' Notification sent to the customer.' : ' (The plate has no account, so no notification was sent.)'}`,
      });
      setRejectOpen(false);
      setRejectReason('');
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Rejection failed' });
    }
  };

  // Vehicle Type nhận diện/đang chọn có lệch với loại đã đăng ký không?
  const vehicleTypeMismatch = Boolean(
    plateAccountInfo?.registeredVehicleType && plateAccountInfo.registeredVehicleType !== vehicleType
  );


  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="grid gap-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Operations Shift</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">Vehicle Check-in</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {building ? `${building.code} · ${building.name}` : 'No Building Selected'}
            </p>
          </div>
          <Link
            to="/staff/parked"
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-md bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/80 lg:self-auto"
          >
            <Car size={14} /> Parked Vehicles
          </Link>
        </div>
      </section>

      {/* Check-in — chế độ Step-by-step (1 camera/bước) hoặc Multiple Cameras (mở cùng lúc) */}
      <section className={`mx-auto w-full space-y-4 ${multiCamMode ? 'max-w-6xl' : 'max-w-3xl'}`}>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Vehicle Check-in</CardTitle>
              <div className="flex items-center gap-2">
                {/* Toggle chế độ */}
                <div className="flex rounded-lg border border-border bg-muted p-0.5 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setMultiCamMode(false)}
                    className={`rounded-md px-2.5 py-1 transition ${!multiCamMode ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Step-by-step
                  </button>
                  <button
                    type="button"
                    onClick={() => setMultiCamMode(true)}
                    className={`rounded-md px-2.5 py-1 transition ${multiCamMode ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Multiple Cameras
                  </button>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => { setCameraSettingsOpen(true); void requestAndRefresh(); }}
                  className="gap-1.5 text-xs"
                  title="Assign cameras by role when multiple cameras are available"
                >
                  <Settings size={13} /> Camera Settings
                </Button>
              </div>
            </div>
            {/* Step indicator (chỉ ở chế độ tuần tự) */}
            {!multiCamMode && (
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold">
              {[
                { n: 1, label: 'Identify Vehicle' },
                { n: 2, label: 'Capture Portrait' },
                { n: 3, label: 'Confirm' },
              ].map((s, i) => (
                <div key={s.n} className="flex items-center gap-2">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${step >= s.n ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{s.n}</span>
                  <span className={step === s.n ? 'text-foreground' : 'text-muted-foreground'}>{s.label}</span>
                  {i < 2 && <span className="mx-1 hidden h-px w-5 bg-border sm:inline-block" />}
                </div>
              ))}
            </div>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            {/* ══ CHẾ ĐỘ NHIỀU CAMERA — mở cả 3 cùng lúc, chụp đồng thời ══ */}
            {multiCamMode && (
              <div className="space-y-5">
                <div className="grid gap-3 lg:grid-cols-3">
                  <LivePlateCamera ref={plateCamRef} onDetected={handlePlateDetected} busy={loading} deviceId={assignment.plate} />
                  <LivePortraitCamera ref={portraitCamRef} deviceId={assignment.portrait} />
                  <LiveQRCamera ref={qrCamRef} onResult={handleResolveIdQr} deviceId={assignment.qr} />
                </div>

                {distinctDeviceCount < 2 && (
                  <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-[11px] text-amber-300">
                    One webcam is being used for all 3 roles, so the frames are identical. Connect more cameras and assign each role in Camera Settings to capture plate and portrait at the same time.
                  </p>
                )}

                {/* License Plate + tài khoản */}
                <div className="grid gap-1.5">
                  <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">License Plate</label>
                  <Input
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    onBlur={(e) => { const n = normalizePlate(e.target.value); if (n) setPlateNumber(n); }}
                    placeholder="59G2-038.80"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !(!plateNumber.trim() || loading || !!buildingSupportWarning || (hasActivePackage && !selectedSlotId) || (checkInKind === 'standard' && !plateImage) || (checkInKind === 'standard' && freeSlots.length > 0 && !selectedSlotId))) onCheckIn(); }}
                  />
                  {vehicleBrand && (
                    <span className="inline-flex w-fit items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-300">
                      <Car size={11} /> Vehicle brand: {vehicleBrand}
                    </span>
                  )}
                  {plateNumber.trim().length >= 7 && plateAccountInfo?.hasAccount && (
                    <div className="mt-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs text-emerald-400">
                      Member: <strong className="text-foreground">{plateAccountInfo.user?.fullName}</strong> ({plateAccountInfo.user?.email})
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && plateAccountInfo && !plateAccountInfo.hasAccount && (
                    <div className="mt-1 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-300">
                      <strong className="text-foreground">Walk-in Customer</strong> (no account).
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && checkInKind === 'package' && (
                    <div className="mt-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300">
                      🅿️ Vehicle has a long-term package{plateAccountInfo?.activePackage?.name ? ` "${plateAccountInfo.activePackage.name}"` : ''} — select an available slot below.
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && checkInKind === 'reservation' && (
                    <div className="mt-1 rounded-lg border border-sky-500/30 bg-sky-500/10 p-2.5 text-xs text-sky-300">
                      📅 Vehicle has a reservation{plateAccountInfo?.activeReservation?.code ? ` (code ${plateAccountInfo.activeReservation.code})` : ''}.
                    </div>
                  )}
                </div>

                {/* Vehicle Type + cảnh báo */}
                <div className="grid gap-1.5">
                  <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Vehicle Type</label>
                  <div className="flex gap-2 p-1 rounded-lg bg-muted border border-border">
                    <button type="button" disabled={!allowedTypes.includes('CAR')} onClick={() => setVehicleType('car')}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-bold transition-all ${vehicleType === 'car' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground disabled:opacity-30'}`}>
                      <Car size={13} /> Car
                    </button>
                    <button type="button" disabled={!allowedTypes.includes('MOTORCYCLE')} onClick={() => setVehicleType('motorcycle')}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-bold transition-all ${vehicleType === 'motorcycle' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground disabled:opacity-30'}`}>
                      <Bike size={13} /> Motorcycle
                    </button>
                  </div>
                  {plateTypeWarning && <p className="text-[11px] text-amber-400 flex items-center gap-1"><AlertCircle size={11} /> {plateTypeWarning}</p>}
                  {buildingSupportWarning && <p className="text-[11px] text-rose-400 flex items-center gap-1"><AlertCircle size={11} /> {buildingSupportWarning}</p>}
                  {vehicleTypeMismatch && (
                    <p className="text-[11px] text-rose-300 flex items-center gap-1">
                      <AlertCircle size={12} /> Vehicle type does not match the registration (registered: <strong>{plateAccountInfo?.registeredVehicleType === 'car' ? 'Car' : 'Motorcycle'}</strong>).
                    </p>
                  )}
                </div>

                {/* Chọn ô đỗ — gói dài hạn và standard (walk-in / user thường) */}
                {needsSlotSelection && (
                  <div className={`rounded-xl border p-3 space-y-2 ${hasActivePackage ? 'border-amber-500/30 bg-amber-500/10' : 'border-sky-500/30 bg-sky-500/10'}`}>
                    <p className={`text-[11px] font-bold flex items-center gap-1 ${hasActivePackage ? 'text-amber-300' : 'text-sky-300'}`}>
                      <AlertCircle size={12} />
                      {hasActivePackage ? 'Vehicle has a long-term package - select an available slot:' : 'Select a parking slot for the customer:'}
                    </p>
                    <select value={selectedSlotId} onChange={(e) => setSelectedSlotId(e.target.value)}
                      className={`h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm font-semibold text-white outline-none ${hasActivePackage ? 'focus:border-amber-400/60' : 'focus:border-sky-400/60'}`}>
                      <option value="">-- Select an available slot --</option>
                      {freeSlots.map((s) => (
                        <option key={s._id} value={s._id}>{s.code}{s.floor?.name || s.floor?.code ? ` · ${s.floor?.name || s.floor?.code}` : ''}</option>
                      ))}
                    </select>
                    {freeSlots.length === 0 && (
                      <p className="text-[11px] text-slate-400">This building has no fixed slots. Vehicles park by shared capacity.</p>
                    )}
                  </div>
                )}

                {/* Warning ảnh còn thiếu (standard: cần cả biển số + chân dung từ camera) */}
                {checkInKind === 'standard' && !plateImage && (
                  <p className="text-[11px] text-rose-300 flex items-center gap-1">
                    <AlertCircle size={12} /> Please click <strong>"Capture &amp; Recognize"</strong> on the license plate camera before check-in.
                  </p>
                )}

                <p className="text-[11px] text-muted-foreground">The portrait is captured automatically from the portrait camera when you click Check-in.</p>

                <div className="flex gap-2">
                  <Button
                    onClick={onCheckIn}
                    disabled={
                      !plateNumber.trim() ||
                      loading ||
                      !!buildingSupportWarning ||
                      (hasActivePackage && !selectedSlotId) ||
                      (checkInKind === 'standard' && !plateImage) ||
                      (checkInKind === 'standard' && freeSlots.length > 0 && !selectedSlotId)
                    }
                    className="flex-1 h-11 gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60"
                  >
                    <ScanLine size={16} /> Check-in
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setRejectOpen(true)} disabled={loading || !plateNumber.trim()}
                    className="h-11 border-rose-500/40 text-rose-400 hover:bg-rose-500/10">
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {/* ── BƯỚC 1 — Identify Vehicle ── */}
            {!multiCamMode && step === 1 && (
              <div className="space-y-4">
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
                  <LivePlateCamera ref={plateCamRef} onDetected={handlePlateDetected} busy={loading} deviceId={assignment.plate} />
                ) : (
                  <LiveQRCamera ref={qrCamRef} onResult={handleResolveIdQr} deviceId={assignment.qr} />
                )}

                <div className="grid gap-1.5">
                  <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">License Plate (or manual entry)</label>
                  <Input
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    onBlur={(e) => {
                      const n = normalizePlate(e.target.value);
                      if (n) setPlateNumber(n);
                    }}
                    placeholder="59G2-038.80"
                    onKeyDown={(e) => { if (e.key === 'Enter' && plateNumber.trim().length >= 7 && !(checkInKind === 'standard' && !plateImage)) proceedFromIdentify(); }}
                  />
                  {vehicleBrand && (
                    <span className="inline-flex w-fit items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-300">
                      <Car size={11} /> Vehicle brand: {vehicleBrand}
                    </span>
                  )}
                  {plateNumber.trim().length >= 7 && plateAccountInfo?.hasAccount && (
                    <div className="mt-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <p className="text-xs text-emerald-400">
                        Member: <strong className="text-foreground">{plateAccountInfo.user?.fullName}</strong> ({plateAccountInfo.user?.email})
                      </p>
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && plateAccountInfo && !plateAccountInfo.hasAccount && (
                    <div className="mt-1 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <p className="text-xs text-amber-300">
                        License Plate <strong className="text-foreground">{plateNumber.toUpperCase()}</strong> — <strong>Walk-in Customer</strong> (no account).
                      </p>
                    </div>
                  )}
                  {/* Badge loại check-in đã nhận diện */}
                  {plateNumber.trim().length >= 7 && checkInKind === 'package' && (
                    <div className="mt-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300">
                      🅿️ Vehicle has a <strong>long-term package</strong>{plateAccountInfo?.activePackage?.name ? ` "${plateAccountInfo.activePackage.name}"` : ''} — capture portrait and select an available slot in the next step.
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && checkInKind === 'reservation' && (
                    <div className="mt-1 rounded-lg border border-sky-500/30 bg-sky-500/10 p-2.5 text-xs text-sky-300">
                      📅 Vehicle has a <strong>reservation</strong>{plateAccountInfo?.activeReservation?.code ? ` (code ${plateAccountInfo.activeReservation.code})` : ''} — capture portrait in the next step to confirm.
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && checkInKind === 'standard' && !plateImage && (
                    <div className="mt-1 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5 text-[11px] text-rose-300">
                      A <strong>license plate photo</strong> is required: click "Capture &amp; Recognize" on the plate camera.
                    </div>
                  )}
                </div>

                <Button
                  onClick={proceedFromIdentify}
                  disabled={plateNumber.trim().length < 7 || !!buildingSupportWarning || (checkInKind === 'standard' && !plateImage)}
                  className="w-full h-11 gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60"
                >
                  Continue <ArrowRight size={16} />
                </Button>
              </div>
            )}

            {/* ── BƯỚC 2 — Capture Portrait ── */}
            {!multiCamMode && step === 2 && (
              <div className="space-y-4">
                <LivePortraitCamera ref={portraitCamRef} deviceId={assignment.portrait} />
                {portraitImage && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-400">
                    <UserSquare size={14} /> Portrait photo captured. You can retake it if needed.
                  </div>
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-11 gap-1">
                    <ArrowLeft size={16} /> Back
                  </Button>
                  <Button onClick={capturePortraitAndNext} className="flex-1 h-11 gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110">
                    <UserSquare size={16} /> {portraitImage ? 'Retake & Continue' : 'Capture Portrait & Continue'}
                  </Button>
                </div>
              </div>
            )}

            {/* ── BƯỚC 3 — Confirm & check-in ── */}
            {!multiCamMode && step === 3 && (
              <div className="space-y-5">
                {/* Banner loại check-in đã nhận diện */}
                {checkInKind === 'package' && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300">
                    🅿️ Vehicle has a long-term package{plateAccountInfo?.activePackage?.name ? ` "${plateAccountInfo.activePackage.name}"` : ''} — select an available slot below, then check in.
                  </div>
                )}
                {checkInKind === 'reservation' && (
                  <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-2.5 text-xs text-sky-300">
                    📅 Vehicle has a reservation{plateAccountInfo?.activeReservation?.code ? ` (code ${plateAccountInfo.activeReservation.code})` : ''} — confirm to check in.
                  </div>
                )}

                {/* Ảnh đã chụp — chân dung bắt buộc cho mọi loại; biển bắt buộc với vãng lai/user thường */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      License Plate Photo{checkInKind !== 'standard' ? ' (optional)' : ''}
                    </p>
                    <div className="aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted/40 flex items-center justify-center">
                      {plateImage ? (
                        <img src={plateImage} alt="License Plate Photo" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon size={20} className="text-muted-foreground/40" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Portrait Photo</p>
                    <div className="aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted/40 flex items-center justify-center">
                      {portraitImage ? (
                        <img src={portraitImage} alt="Portrait Photo" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon size={20} className="text-muted-foreground/40" />
                      )}
                    </div>
                  </div>
                </div>

                {/* License Plate + tài khoản */}
                <div className="grid gap-1.5">
                  <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">License Plate</label>
                  <Input
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    onBlur={(e) => {
                      const n = normalizePlate(e.target.value);
                      if (n) setPlateNumber(n);
                    }}
                    placeholder="59G2-038.80"
                  />
                  {vehicleBrand && (
                    <span className="inline-flex w-fit items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-300">
                      <Car size={11} /> Vehicle brand: {vehicleBrand}
                    </span>
                  )}
                  {plateNumber.trim().length >= 7 && plateAccountInfo?.hasAccount && (
                    <div className="mt-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <p className="text-xs text-emerald-400">
                        Member: <strong className="text-foreground">{plateAccountInfo.user?.fullName}</strong> ({plateAccountInfo.user?.email})
                      </p>
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && plateAccountInfo && !plateAccountInfo.hasAccount && (
                    <div className="mt-1 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <p className="text-xs text-amber-300">
                        License Plate <strong className="text-foreground">{plateNumber.toUpperCase()}</strong> — <strong>Walk-in Customer</strong> (no account).
                      </p>
                    </div>
                  )}
                </div>

                {/* Vehicle Type + cảnh báo */}
                <div className="grid gap-1.5">
                  <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Vehicle Type</label>
                  <div className="flex gap-2 p-1 rounded-lg bg-muted border border-border">
                    <button
                      type="button"
                      disabled={!allowedTypes.includes('CAR')}
                      onClick={() => setVehicleType('car')}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-bold transition-all ${vehicleType === 'car' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground disabled:opacity-30'}`}
                    >
                      <Car size={13} /> Car
                    </button>
                    <button
                      type="button"
                      disabled={!allowedTypes.includes('MOTORCYCLE')}
                      onClick={() => setVehicleType('motorcycle')}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-bold transition-all ${vehicleType === 'motorcycle' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground disabled:opacity-30'}`}
                    >
                      <Bike size={13} /> Motorcycle
                    </button>
                  </div>
                  {plateTypeWarning && <p className="text-[11px] text-amber-400 flex items-center gap-1"><AlertCircle size={11} /> {plateTypeWarning}</p>}
                  {buildingSupportWarning && <p className="text-[11px] text-rose-400 flex items-center gap-1"><AlertCircle size={11} /> {buildingSupportWarning}</p>}
                  {vehicleTypeMismatch && (
                    <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-[11px] text-rose-300 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1">
                        <AlertCircle size={12} /> Vehicle type does not match the registration (registered: <strong>{plateAccountInfo?.registeredVehicleType === 'car' ? 'Car' : 'Motorcycle'}</strong>).
                      </span>
                      <button type="button" onClick={() => setRejectOpen(true)} className="shrink-0 rounded-md bg-rose-500 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-rose-400">
                        Reject
                      </button>
                    </div>
                  )}
                </div>

                {/* Chọn ô đỗ: bắt buộc với gói dài hạn và check-in thường (khách vãng lai / user) */}
                {needsSlotSelection && (
                  <div className={`rounded-xl border p-3 space-y-2 ${hasActivePackage ? 'border-amber-500/30 bg-amber-500/10' : 'border-sky-500/30 bg-sky-500/10'}`}>
                    <p className={`text-[11px] font-bold flex items-center gap-1 ${hasActivePackage ? 'text-amber-300' : 'text-sky-300'}`}>
                      <AlertCircle size={12} />
                      {hasActivePackage
                        ? `Vehicle has a long-term package${plateAccountInfo?.activePackage?.name ? ` "${plateAccountInfo.activePackage.name}"` : ''}${plateAccountInfo?.activePackage?.maxHoursPerDay ? ` · free ${plateAccountInfo.activePackage.maxHoursPerDay}h/day` : ''} - select an available slot:`
                        : 'Select a parking slot for the customer (required if the building has slots):'}
                    </p>
                    <select
                      value={selectedSlotId}
                      onChange={(e) => setSelectedSlotId(e.target.value)}
                      className={`h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm font-semibold text-white outline-none ${hasActivePackage ? 'focus:border-amber-400/60' : 'focus:border-sky-400/60'}`}
                    >
                      <option value="">-- Select an available slot --</option>
                      {freeSlots.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.code}{s.floor?.name || s.floor?.code ? ` · ${s.floor?.name || s.floor?.code}` : ''}
                        </option>
                      ))}
                    </select>
                    {freeSlots.length === 0 && (
                      <p className="text-[11px] text-slate-400">This building has no fixed slots. Vehicles will park by shared capacity.</p>
                    )}
                  </div>
                )}

                {/* Nhắc thiếu ảnh: chân dung bắt buộc mọi loại; biển bắt buộc với vãng lai/user thường */}
                {(!portraitImage || (checkInKind === 'standard' && !plateImage)) && (
                  <p className="text-[11px] text-rose-300 flex items-center gap-1">
                    <AlertCircle size={12} /> A <strong>portrait photo</strong> is required
                    {checkInKind === 'standard' ? <> and a <strong>license plate photo</strong></> : null} before check-in. Go back to the previous step to capture it.
                  </p>
                )}

                {/* Nút hành động */}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="h-11 gap-1">
                    <ArrowLeft size={16} /> Back
                  </Button>
                  <Button
                    onClick={onCheckIn}
                    disabled={!plateNumber.trim() || loading || !!buildingSupportWarning || !portraitImage || (hasActivePackage && !selectedSlotId) || (checkInKind === 'standard' && !plateImage) || (checkInKind === 'standard' && freeSlots.length > 0 && !selectedSlotId)}
                    className="flex-1 h-11 gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60"
                  >
                    <ScanLine size={16} /> Check-in
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRejectOpen(true)}
                    disabled={loading || !plateNumber.trim()}
                    className="h-11 border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {/* Phản hồi thao tác */}
            {opMessage && (
              <div className={`rounded-xl border p-4 text-sm ${opMessage.type === 'ok' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'}`}>
                {opMessage.text}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Note: gói & đặt chỗ tự nhận diện khi quét — không cần nhập code thủ công */}
        <div className="rounded-xl border border-border bg-card/50 p-4 text-xs text-muted-foreground">
          <p className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
            <ScanLine size={13} className="text-primary" /> Packages &amp; reservations are detected automatically
          </p>
          Vehicles with <strong>packages</strong> or <strong>reservations</strong> are matched automatically when scanning the plate / QR in step 1. No manual code entry is needed.
          Payment collection and check-out are handled by exit-gate staff in the{' '}
          <Link to="/staff/parked" className="font-semibold text-primary hover:underline">“Parked Vehicles”</Link>.
        </div>
      </section>

      <CameraSetupModal
        open={cameraSettingsOpen}
        onClose={() => setCameraSettingsOpen(false)}
        devices={devices}
        assignment={assignment}
        assign={assign}
        requestAndRefresh={requestAndRefresh}
      />

      <RejectModal
        open={rejectOpen}
        onClose={() => { setRejectOpen(false); setRejectReason(''); }}
        plateNumber={plateNumber}
        rejectReason={rejectReason}
        onReasonChange={setRejectReason}
        onConfirm={onReject}
      />

      <UserQrInfoModal
        info={userQrInfo}
        onClose={() => setUserQrInfo(null)}
      />
      {/* Camera Settings — gán thiết bị vật lý cho từng vai trò */}
      {cameraSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Devices</p>
                <h3 className="text-xl font-semibold text-foreground">Camera Settings</h3>
              </div>
              <button onClick={() => setCameraSettingsOpen(false)} className="text-muted-foreground hover:text-foreground transition">✕</button>
            </div>

            <p className="mb-4 text-xs text-muted-foreground">
              When multiple cameras are available (plate / portrait / QR), assign each role to a separate device to
              open them at the same time and capture the right image. On machines with one webcam, all roles share the same device.
            </p>

            <div className="space-y-3">
              {([
                { role: 'plate' as CameraRole, label: 'Camera 1 · License Plate' },
                { role: 'qr' as CameraRole, label: 'Camera 2 · QR' },
                { role: 'portrait' as CameraRole, label: 'Camera 3 · Portrait' },
              ]).map(({ role, label }) => (
                <div key={role} className="grid gap-1.5">
                  <label className="text-xs font-semibold text-foreground">{label}</label>
                  <select
                    value={assignment[role] ?? ''}
                    onChange={(e) => assign(role, e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/50"
                  >
                    <option value="">- Auto (default) -</option>
                    {devices.map((d, i) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Camera ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {devices.length === 0 && (
              <p className="mt-3 text-[11px] text-amber-400">
                No devices found. Click Refresh and grant camera permission in the browser.
              </p>
            )}

            <div className="mt-5 flex justify-between gap-2">
              <Button type="button" variant="secondary" onClick={() => void requestAndRefresh()} className="gap-1.5 text-xs">
                <Settings size={13} /> Refresh List
              </Button>
              <Button onClick={() => setCameraSettingsOpen(false)} className="bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 text-xs">
                Xong
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reject check-in */}
      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-card p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-400">Reject Check-in</p>
                <h3 className="text-xl font-semibold text-foreground">Rejection Reason</h3>
              </div>
              <button onClick={() => { setRejectOpen(false); setRejectReason(''); }} className="text-muted-foreground hover:text-foreground transition">✕</button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              License Plate <strong className="text-foreground font-mono">{normalizePlate(plateNumber) || plateNumber || '—'}</strong>. The system will send a notification with the reason to the customer account if the plate is registered.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Example: Registered as motorcycle but actually a car; vehicle information does not match..."
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

      {/* Modal: Account Information user từ QR scan */}
      {userQrInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Scanned Account</p>
                <h3 className="text-lg font-semibold text-foreground">{userQrInfo.fullName}</h3>
                <p className="text-xs text-muted-foreground">{userQrInfo.email}</p>
              </div>
              <button onClick={() => setUserQrInfo(null)} className="text-muted-foreground hover:text-foreground transition">✕</button>
            </div>

            {userQrInfo.walletBalance != null && (
              <div className="mb-4 rounded-xl border border-violet-500/20 bg-violet-500/8 px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Wallet Balance</span>
                <span className="font-mono font-bold text-violet-400">{userQrInfo.walletBalance.toLocaleString('vi-VN')} ₫</span>
              </div>
            )}

            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Active Long-term Packages
            </div>
            {userQrInfo.activePackages.length === 0 ? (
              <p className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                Customer has no active long-term packages.
              </p>
            ) : (
              <div className="space-y-2">
                {userQrInfo.activePackages.map((pkg) => (
                  <div key={pkg.id} className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-emerald-400">{pkg.name}</span>
                      {pkg.code && (
                        <span className="rounded-md border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-mono text-emerald-500">{pkg.code}</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      License Plate: <strong className="text-foreground font-mono">{pkg.plateNumber}</strong>
                      {pkg.endDate && (
                        <span className="ml-2 text-slate-500">
                          · Expired: {new Date(pkg.endDate).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <Button onClick={() => setUserQrInfo(null)} className="mt-5 w-full" variant="secondary">
              Close
            </Button>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
}
