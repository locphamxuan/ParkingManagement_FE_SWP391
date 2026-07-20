import { useEffect, useMemo, useRef, useState } from 'react';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { staffApi, type PlateInfo } from '@/services/staff/staffApi';
import { useAssignedGates } from '@/hooks/staff/useAssignedGates';
import { type PlateScanResult, type LiveCameraHandle } from '@/components/staff/LivePlateCamera';
import { useCameraDevices } from '@/hooks/useCameraDevices';
import { normalizePlate } from '@/utils/plate';
import type { UserQrInfo } from '@/components/staff/UserQrInfoModal';
import type { VehicleKind } from '@/components/staff/checkin/VehicleTypeSelector';

type OperationMode = 'check-in' | 'check-out';

// Vehicle Type tòa nhà hỗ trợ (staff luôn có thể chọn cả 2). Đặt ở module scope để
// tham chiếu ổn định — tránh effect tự-nhận-diện chạy lại mỗi lần render và ghi
// đè lựa chọn loại xe thủ công của nhân viên.
const ALLOWED_TYPES = ['CAR', 'MOTORCYCLE'];

function detectTypeFromPlate(plate: string): VehicleKind {
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
}

/**
 * Toàn bộ state + business logic của luồng check-in tại quầy (nhận diện xe,
 * tra cứu tài khoản/gói/đặt chỗ, chọn slot, chụp ảnh, check-in/reject).
 * Tách khỏi StaffOperationsPage để page chỉ còn lo phần hiển thị theo từng bước.
 */
export function useCheckInWorkflow() {
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
  // Slot cố định của gói (nếu user đã chọn lúc mua) → staff KHÔNG cần chọn slot,
  // BE tự dùng slot này khi check-in.
  const packageFixedSlot = plateAccountInfo?.activePackage?.slot ?? null;
  // Loại check-in quyết định luật ảnh:
  //  - 'package': chỉ cần quét (biển/QR) định danh — không bắt ảnh.
  //  - 'standard' (khách vãng lai / user thường): bắt buộc ảnh biển + chân dung.
  const checkInKind: 'package' | 'standard' = hasActivePackage ? 'package' : 'standard';
  // Load free slots cho package (floating) lẫn standard. Gói có slot cố định thì KHÔNG
  // cần chọn (BE tự gán slot cố định).
  const needsSlotSelection = (hasActivePackage && !packageFixedSlot) || checkInKind === 'standard';
  // Đối tượng của lượt check-in — PHẢI khớp resolveCustomerUsageType ở BE (checkIn.service)
  // để /free-slots lọc & xếp hạng đúng dãy/zone (thiếu tham số này BE trả về TOÀN BỘ
  // slot trống của tòa nhà, không lọc theo zone manager đã cấu hình).
  const checkInUsageType = hasActivePackage
    ? 'subscriber'
    : plateAccountInfo?.hasAccount
      ? 'registered'
      : 'walk_in';
  useEffect(() => {
    if (!needsSlotSelection || !buildingId) {
      setFreeSlots([]);
      setSelectedSlotId('');
      return;
    }
    let cancelled = false;
    staffApi
      .freeSlots(buildingId, { usageType: checkInUsageType, vehicleType })
      .then((res) => {
        if (!cancelled) setFreeSlots((res as { data?: { items?: typeof freeSlots } })?.data?.items ?? []);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [needsSlotSelection, buildingId, checkInUsageType, vehicleType]);

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
    // Gói floating (không slot cố định): bắt buộc chọn slot trống cho xe mua gói.
    // Gói có slot cố định → BE tự gán, không cần chọn.
    if (hasActivePackage && !packageFixedSlot && !selectedSlotId) {
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

  return {
    building,
    buildingId,
    loading,
    plateNumber,
    setPlateNumber,
    vehicleBrand,
    vehicleType,
    setVehicleType,
    opMessage,
    plateImage,
    portraitImage,
    plateCamRef,
    qrCamRef,
    portraitCamRef,
    devices,
    assignment,
    assign,
    requestAndRefresh,
    cameraSettingsOpen,
    setCameraSettingsOpen,
    distinctDeviceCount,
    multiCamMode,
    setMultiCamMode,
    step,
    setStep,
    identifyMode,
    setIdentifyMode,
    plateAccountInfo,
    freeSlots,
    selectedSlotId,
    setSelectedSlotId,
    rejectOpen,
    setRejectOpen,
    rejectReason,
    setRejectReason,
    userQrInfo,
    setUserQrInfo,
    allowedTypes,
    plateTypeWarning,
    buildingSupportWarning,
    hasActivePackage,
    packageFixedSlot,
    checkInKind,
    needsSlotSelection,
    vehicleTypeMismatch,
    handlePlateDetected,
    proceedFromIdentify,
    capturePortraitAndNext,
    handleResolveIdQr,
    onCheckIn,
    onReject,
  };
}

export type CheckInWorkflow = ReturnType<typeof useCheckInWorkflow>;
