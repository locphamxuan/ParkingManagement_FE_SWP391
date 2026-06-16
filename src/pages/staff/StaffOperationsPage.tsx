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
import { LivePlateCamera, type PlateScanResult, type LiveCameraHandle } from '@/components/staff/LivePlateCamera';
import { LiveQRCamera } from '@/components/staff/LiveQRCamera';
import { LivePortraitCamera } from '@/components/staff/LivePortraitCamera';
import { useCameraDevices, type CameraRole } from '@/hooks/useCameraDevices';
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
  //  1: Nhận diện xe (biển số AI / QR) · 2: Chụp chân dung · 3: Xác nhận & check-in
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [identifyMode, setIdentifyMode] = useState<'plate' | 'qr'>('plate');

  // Plate → account info (chỉ để hiển thị; khách vãng lai khi không có tài khoản)
  const [plateAccountInfo, setPlateAccountInfo] = useState<PlateInfo | null>(null);
  // Gói floating: khi biển số có gói còn hạn, staff phải chọn 1 slot trống.
  const [freeSlots, setFreeSlots] = useState<{ _id: string; code: string; floor?: { name?: string; code?: string } | null }[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  // Reject (từ chối) check-in flow
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

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
          setPlateAccountInfo((res as { data?: PlateInfo })?.data ?? null);
        })
        .catch(() => undefined);
    } else {
      setPlateAccountInfo(null);
    }
  }, [plateNumber]);

  // Biển số có gói còn hạn → tải slot trống của tòa nhà để staff gán chỗ.
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
  useEffect(() => {
    if (!hasActivePackage || !buildingId) {
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
  }, [hasActivePackage, buildingId]);

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

  // Rời bước 1 → bước Chụp chân dung. MỌI loại check-in đều cần ảnh chân dung
  // (đối chiếu người khi lấy xe). Ảnh biển số bắt buộc thêm với khách vãng lai /
  // user thường (gói/đặt chỗ định danh bằng quét nên biển là tuỳ chọn).
  const proceedFromIdentify = () => {
    setStep(2);
  };

  // Bước 2: chụp chân dung từ camera chân dung → lưu ảnh → sang bước Xác nhận.
  const capturePortraitAndNext = () => {
    const img = portraitCamRef.current?.capture() ?? null;
    if (!img) {
      setOpMessage({ type: 'err', text: 'Camera chân dung chưa sẵn sàng. Vui lòng thử lại.' });
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
        applyPlate(data.plate.plateNumber, data.plate.brand ?? null);
        // Không tự sang bước — đợi lookup để biết loại; nhân viên bấm "Tiếp tục".
        setOpMessage({ type: 'ok', text: `Đã nhận diện biển số ${data.plate.plateNumber}. Bấm "Tiếp tục".` });
      } else if (data.user) {
        setOpMessage({ type: 'ok', text: `Đã nhận diện tài khoản: ${data.user.fullName} (${data.user.email}). Vui lòng quét/nhập biển số xe.` });
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
    setFreeSlots([]);
    setSelectedSlotId('');
    setStep(1);
    setIdentifyMode('plate');
  };

  const onCheckIn = async () => {
    setOpMessage(null);
    // Gói floating: bắt buộc chọn slot trống cho xe mua gói.
    if (hasActivePackage && !selectedSlotId) {
      setOpMessage({ type: 'err', text: 'Xe này có gói dài hạn — vui lòng chọn 1 chỗ đỗ trống trước khi check-in.' });
      return;
    }
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
        slot: hasActivePackage && selectedSlotId ? selectedSlotId : undefined,
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

      {/* Check-in — chế độ Tuần tự (1 camera/bước) hoặc Nhiều camera (mở cùng lúc) */}
      <section className={`mx-auto w-full space-y-4 ${multiCamMode ? 'max-w-6xl' : 'max-w-3xl'}`}>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Check-in xe vào</CardTitle>
              <div className="flex items-center gap-2">
                {/* Toggle chế độ */}
                <div className="flex rounded-lg border border-border bg-muted p-0.5 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setMultiCamMode(false)}
                    className={`rounded-md px-2.5 py-1 transition ${!multiCamMode ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Tuần tự
                  </button>
                  <button
                    type="button"
                    onClick={() => setMultiCamMode(true)}
                    className={`rounded-md px-2.5 py-1 transition ${multiCamMode ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Nhiều camera
                  </button>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => { setCameraSettingsOpen(true); void requestAndRefresh(); }}
                  className="gap-1.5 text-xs"
                  title="Gán camera cho từng vai trò (khi có nhiều camera)"
                >
                  <Settings size={13} /> Cài đặt camera
                </Button>
              </div>
            </div>
            {/* Step indicator (chỉ ở chế độ tuần tự) */}
            {!multiCamMode && (
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold">
              {[
                { n: 1, label: 'Nhận diện xe' },
                { n: 2, label: 'Chụp chân dung' },
                { n: 3, label: 'Xác nhận' },
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
                    Đang dùng chung 1 webcam cho cả 3 vai trò nên các khung giống nhau. Cắm thêm camera rồi vào “Cài đặt camera” gán riêng từng cái để chụp biển số &amp; chân dung đồng thời.
                  </p>
                )}

                {/* Biển số + tài khoản */}
                <div className="grid gap-1.5">
                  <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Biển số xe</label>
                  <Input
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    onBlur={(e) => { const n = normalizePlate(e.target.value); if (n) setPlateNumber(n); }}
                    placeholder="59G2-038.80"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !(!plateNumber.trim() || loading || !!buildingSupportWarning || (hasActivePackage && !selectedSlotId))) onCheckIn(); }}
                  />
                  {vehicleBrand && (
                    <span className="inline-flex w-fit items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-300">
                      <Car size={11} /> Hãng xe: {vehicleBrand}
                    </span>
                  )}
                  {plateNumber.trim().length >= 7 && plateAccountInfo?.hasAccount && (
                    <div className="mt-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs text-emerald-400">
                      Thành viên: <strong className="text-foreground">{plateAccountInfo.user?.fullName}</strong> ({plateAccountInfo.user?.email})
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && plateAccountInfo && !plateAccountInfo.hasAccount && (
                    <div className="mt-1 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-300">
                      <strong className="text-foreground">Khách vãng lai</strong> (chưa có tài khoản).
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && checkInKind === 'package' && (
                    <div className="mt-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300">
                      🅿️ Xe có gói dài hạn{plateAccountInfo?.activePackage?.name ? ` "${plateAccountInfo.activePackage.name}"` : ''} — chọn chỗ trống bên dưới.
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && checkInKind === 'reservation' && (
                    <div className="mt-1 rounded-lg border border-sky-500/30 bg-sky-500/10 p-2.5 text-xs text-sky-300">
                      📅 Xe có đặt chỗ{plateAccountInfo?.activeReservation?.code ? ` (mã ${plateAccountInfo.activeReservation.code})` : ''}.
                    </div>
                  )}
                </div>

                {/* Loại xe + cảnh báo */}
                <div className="grid gap-1.5">
                  <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Loại xe</label>
                  <div className="flex gap-2 p-1 rounded-lg bg-muted border border-border">
                    <button type="button" disabled={!allowedTypes.includes('CAR')} onClick={() => setVehicleType('car')}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-bold transition-all ${vehicleType === 'car' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground disabled:opacity-30'}`}>
                      <Car size={13} /> Ô tô
                    </button>
                    <button type="button" disabled={!allowedTypes.includes('MOTORCYCLE')} onClick={() => setVehicleType('motorcycle')}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-bold transition-all ${vehicleType === 'motorcycle' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground disabled:opacity-30'}`}>
                      <Bike size={13} /> Xe máy
                    </button>
                  </div>
                  {plateTypeWarning && <p className="text-[11px] text-amber-400 flex items-center gap-1"><AlertCircle size={11} /> {plateTypeWarning}</p>}
                  {buildingSupportWarning && <p className="text-[11px] text-rose-400 flex items-center gap-1"><AlertCircle size={11} /> {buildingSupportWarning}</p>}
                  {vehicleTypeMismatch && (
                    <p className="text-[11px] text-rose-300 flex items-center gap-1">
                      <AlertCircle size={12} /> Loại xe không khớp đăng ký (đã đăng ký: <strong>{plateAccountInfo?.registeredVehicleType === 'car' ? 'Ô tô' : 'Xe máy'}</strong>).
                    </p>
                  )}
                </div>

                {/* Gói: chọn chỗ trống */}
                {hasActivePackage && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
                    <p className="text-[11px] font-bold text-amber-300 flex items-center gap-1"><AlertCircle size={12} /> Chọn 1 chỗ đỗ trống:</p>
                    <select value={selectedSlotId} onChange={(e) => setSelectedSlotId(e.target.value)}
                      className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm font-semibold text-white outline-none focus:border-amber-400/60">
                      <option value="">-- Chọn chỗ đỗ trống --</option>
                      {freeSlots.map((s) => (
                        <option key={s._id} value={s._id}>{s.code}{s.floor?.name || s.floor?.code ? ` · ${s.floor?.name || s.floor?.code}` : ''}</option>
                      ))}
                    </select>
                    {freeSlots.length === 0 && <p className="text-[11px] text-rose-300">Hiện không còn chỗ trống.</p>}
                  </div>
                )}

                <p className="text-[11px] text-muted-foreground">Ảnh biển số &amp; chân dung được chụp đồng thời từ các camera khi bấm Check-in.</p>

                <div className="flex gap-2">
                  <Button
                    onClick={onCheckIn}
                    disabled={!plateNumber.trim() || loading || !!buildingSupportWarning || (hasActivePackage && !selectedSlotId)}
                    className="flex-1 h-11 gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60"
                  >
                    <ScanLine size={16} /> Check-in (xe vào)
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setRejectOpen(true)} disabled={loading || !plateNumber.trim()}
                    className="h-11 border-rose-500/40 text-rose-400 hover:bg-rose-500/10">
                    Từ chối
                  </Button>
                </div>
              </div>
            )}

            {/* ── BƯỚC 1 — Nhận diện xe ── */}
            {!multiCamMode && step === 1 && (
              <div className="space-y-4">
                <div className="flex gap-2 p-1 rounded-lg bg-muted border border-border">
                  <button
                    type="button"
                    onClick={() => setIdentifyMode('plate')}
                    className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md text-xs font-bold transition-all ${identifyMode === 'plate' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <ScanLine size={13} /> Quét biển số (AI)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdentifyMode('qr')}
                    className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md text-xs font-bold transition-all ${identifyMode === 'qr' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <QrCode size={13} /> Quét QR
                  </button>
                </div>

                {identifyMode === 'plate' ? (
                  <LivePlateCamera ref={plateCamRef} onDetected={handlePlateDetected} busy={loading} deviceId={assignment.plate} />
                ) : (
                  <LiveQRCamera ref={qrCamRef} onResult={handleResolveIdQr} deviceId={assignment.qr} />
                )}

                <div className="grid gap-1.5">
                  <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Biển số xe (hoặc nhập tay)</label>
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
                  {/* Badge loại check-in đã nhận diện */}
                  {plateNumber.trim().length >= 7 && checkInKind === 'package' && (
                    <div className="mt-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300">
                      🅿️ Xe có <strong>gói dài hạn</strong>{plateAccountInfo?.activePackage?.name ? ` "${plateAccountInfo.activePackage.name}"` : ''} — bước sau chụp chân dung &amp; chọn chỗ trống.
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && checkInKind === 'reservation' && (
                    <div className="mt-1 rounded-lg border border-sky-500/30 bg-sky-500/10 p-2.5 text-xs text-sky-300">
                      📅 Xe có <strong>đặt chỗ</strong>{plateAccountInfo?.activeReservation?.code ? ` (mã ${plateAccountInfo.activeReservation.code})` : ''} — bước sau chụp chân dung để xác nhận.
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && checkInKind === 'standard' && !plateImage && (
                    <div className="mt-1 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5 text-[11px] text-rose-300">
                      Cần <strong>ảnh biển số</strong>: bấm “Chụp &amp; nhận diện” ở camera biển số (bắt buộc với khách vãng lai / user thường).
                    </div>
                  )}
                </div>

                <Button
                  onClick={proceedFromIdentify}
                  disabled={plateNumber.trim().length < 7 || !!buildingSupportWarning || (checkInKind === 'standard' && !plateImage)}
                  className="w-full h-11 gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60"
                >
                  Tiếp tục <ArrowRight size={16} />
                </Button>
              </div>
            )}

            {/* ── BƯỚC 2 — Chụp chân dung ── */}
            {!multiCamMode && step === 2 && (
              <div className="space-y-4">
                <LivePortraitCamera ref={portraitCamRef} deviceId={assignment.portrait} />
                {portraitImage && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-400">
                    <UserSquare size={14} /> Đã có ảnh chân dung — có thể chụp lại nếu cần.
                  </div>
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-11 gap-1">
                    <ArrowLeft size={16} /> Quay lại
                  </Button>
                  <Button onClick={capturePortraitAndNext} className="flex-1 h-11 gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110">
                    <UserSquare size={16} /> {portraitImage ? 'Chụp lại & tiếp tục' : 'Chụp chân dung & tiếp tục'}
                  </Button>
                </div>
              </div>
            )}

            {/* ── BƯỚC 3 — Xác nhận & check-in ── */}
            {!multiCamMode && step === 3 && (
              <div className="space-y-5">
                {/* Banner loại check-in đã nhận diện */}
                {checkInKind === 'package' && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300">
                    🅿️ Xe có gói dài hạn{plateAccountInfo?.activePackage?.name ? ` "${plateAccountInfo.activePackage.name}"` : ''} — chọn chỗ trống bên dưới rồi check-in.
                  </div>
                )}
                {checkInKind === 'reservation' && (
                  <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-2.5 text-xs text-sky-300">
                    📅 Xe có đặt chỗ{plateAccountInfo?.activeReservation?.code ? ` (mã ${plateAccountInfo.activeReservation.code})` : ''} — xác nhận để cho vào.
                  </div>
                )}

                {/* Ảnh đã chụp — chân dung bắt buộc cho mọi loại; biển bắt buộc với vãng lai/user thường */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Ảnh biển số{checkInKind !== 'standard' ? ' (tuỳ chọn)' : ''}
                    </p>
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

                {/* Biển số + tài khoản */}
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

                {/* Loại xe + cảnh báo */}
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

                {/* Gói dài hạn: bắt buộc chọn chỗ đỗ trống */}
                {hasActivePackage && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
                    <p className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                      <AlertCircle size={12} /> Xe có gói dài hạn
                      {plateAccountInfo?.activePackage?.name ? ` "${plateAccountInfo.activePackage.name}"` : ''}
                      {plateAccountInfo?.activePackage?.maxHoursPerDay
                        ? ` · free ${plateAccountInfo.activePackage.maxHoursPerDay}h/ngày`
                        : ''} — chọn 1 chỗ đỗ trống:
                    </p>
                    <select
                      value={selectedSlotId}
                      onChange={(e) => setSelectedSlotId(e.target.value)}
                      className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm font-semibold text-white outline-none focus:border-amber-400/60"
                    >
                      <option value="">-- Chọn chỗ đỗ trống --</option>
                      {freeSlots.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.code}{s.floor?.name || s.floor?.code ? ` · ${s.floor?.name || s.floor?.code}` : ''}
                        </option>
                      ))}
                    </select>
                    {freeSlots.length === 0 && (
                      <p className="text-[11px] text-rose-300">Hiện không còn chỗ trống trong tòa nhà.</p>
                    )}
                  </div>
                )}

                {/* Nhắc thiếu ảnh: chân dung bắt buộc mọi loại; biển bắt buộc với vãng lai/user thường */}
                {(!portraitImage || (checkInKind === 'standard' && !plateImage)) && (
                  <p className="text-[11px] text-rose-300 flex items-center gap-1">
                    <AlertCircle size={12} /> Cần <strong>ảnh chân dung</strong>
                    {checkInKind === 'standard' ? <> và <strong>ảnh biển số</strong></> : null} mới check-in được (quay lại bước trước để chụp).
                  </p>
                )}

                {/* Nút hành động */}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="h-11 gap-1">
                    <ArrowLeft size={16} /> Quay lại
                  </Button>
                  <Button
                    onClick={onCheckIn}
                    disabled={!plateNumber.trim() || loading || !!buildingSupportWarning || !portraitImage || (hasActivePackage && !selectedSlotId) || (checkInKind === 'standard' && !plateImage)}
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

        {/* Ghi chú: gói & đặt chỗ tự nhận diện khi quét — không cần nhập mã thủ công */}
        <div className="rounded-xl border border-border bg-card/50 p-4 text-xs text-muted-foreground">
          <p className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
            <ScanLine size={13} className="text-primary" /> Gói &amp; đặt chỗ tự nhận diện
          </p>
          Xe <strong>mua gói</strong> hoặc <strong>đặt chỗ trước</strong> được hệ thống tự đối chiếu ngay khi quét biển số / QR ở bước 1 — không cần nhập mã thủ công.
          Việc thu phí &amp; cho xe ra do nhân viên cổng ra thực hiện ở tab{' '}
          <Link to="/staff/parked" className="font-semibold text-primary hover:underline">“Xe đang đỗ”</Link>.
        </div>
      </section>

      {/* Cài đặt camera — gán thiết bị vật lý cho từng vai trò */}
      {cameraSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Thiết bị</p>
                <h3 className="text-xl font-semibold text-foreground">Cài đặt camera</h3>
              </div>
              <button onClick={() => setCameraSettingsOpen(false)} className="text-muted-foreground hover:text-foreground transition">✕</button>
            </div>

            <p className="mb-4 text-xs text-muted-foreground">
              Khi có nhiều camera (biển số / chân dung / QR), gán mỗi vai trò vào một thiết bị riêng để
              mở đồng thời và chụp đúng hình. Trên máy 1 webcam thì các vai trò dùng chung 1 thiết bị.
            </p>

            <div className="space-y-3">
              {([
                { role: 'plate' as CameraRole, label: 'Camera 1 · Biển số' },
                { role: 'qr' as CameraRole, label: 'Camera 2 · QR' },
                { role: 'portrait' as CameraRole, label: 'Camera 3 · Chân dung' },
              ]).map(({ role, label }) => (
                <div key={role} className="grid gap-1.5">
                  <label className="text-xs font-semibold text-foreground">{label}</label>
                  <select
                    value={assignment[role] ?? ''}
                    onChange={(e) => assign(role, e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/50"
                  >
                    <option value="">— Tự động (mặc định) —</option>
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
                Chưa thấy thiết bị nào — bấm “Làm mới” và cấp quyền camera cho trình duyệt.
              </p>
            )}

            <div className="mt-5 flex justify-between gap-2">
              <Button type="button" variant="secondary" onClick={() => void requestAndRefresh()} className="gap-1.5 text-xs">
                <Settings size={13} /> Làm mới danh sách
              </Button>
              <Button onClick={() => setCameraSettingsOpen(false)} className="bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 text-xs">
                Xong
              </Button>
            </div>
          </motion.div>
        </div>
      )}

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

    </motion.div>
  );
}
