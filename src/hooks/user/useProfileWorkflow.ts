import { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useVehicles } from '@/hooks/user/useVehicles';
import { userApi } from '@/services/user/userApi';
import type { Vehicle, VehicleCategoryCode } from '@/services/vehicleService';
import {
  normalizePlate,
  isValidVietnamPlate,
  brandsForCategory,
  plateMatchesCategory,
  plateVehicleKind,
} from '@/utils/plate';

/**
 * State + business logic của trang Hồ sơ: thông tin cá nhân và phương tiện.
 *
 * Phương tiện được thao tác TRỰC TIẾP với API (thêm/xoá/đặt mặc định là gọi ngay),
 * không còn gom lại rồi "đồng bộ" lúc bấm Lưu như trước. Cách cũ phải so sánh danh
 * sách cũ–mới để đoán cần thêm/xoá gì, nên màn hình dễ hiển thị thứ chưa hề được
 * lưu; giờ mỗi thao tác thành công là dữ liệu server đã đổi thật.
 */

/** Giới hạn do backend đặt (MAX_VEHICLES_PER_USER) — hiển thị cho khớp. */
export const MAX_VEHICLES = 5;

interface PlateValidationResult {
  ok: boolean;
  error?: string;
}

function validatePlate(
  raw: string,
  existing: Vehicle[],
  category: string
): PlateValidationResult {
  if (!raw || raw.trim() === '') {
    return { ok: false, error: 'Please enter a license plate.' };
  }

  const plate = normalizePlate(raw);
  if (!isValidVietnamPlate(plate)) {
    return {
      ok: false,
      error: 'Invalid plate. Example: 30A-97022 (car) or 59G2-038.80 (motorcycle).',
    };
  }

  if (existing.some((v) => v.plateNumber.toUpperCase() === plate)) {
    return { ok: false, error: `Plate "${plate}" is already in your list.` };
  }

  // Sê-ri biển đã nói lên loại xe; khai lệch là sai bảng giá và sai ô đỗ.
  if (!plateMatchesCategory(plate, category)) {
    const expected = plateVehicleKind(plate) === 'motorcycle' ? 'a motorcycle' : 'a car';
    return {
      ok: false,
      error: `${plate} is ${expected} plate — it does not match the vehicle type you selected.`,
    };
  }

  return { ok: true };
}

export function useProfileWorkflow() {
  const navigate = useNavigate();
  const { session, logout, updateProfile } = useAuth();
  const {
    vehicles,
    categories,
    qrTtlDays,
    isLoading: vehiclesLoading,
    isLoaded: vehiclesLoaded,
    add,
    update,
    remove,
    setDefault,
    refreshQr,
  } = useVehicles();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '' });

  // Form thêm/sửa xe. `editingVehicleId` khác null nghĩa là đang sửa xe đã có —
  // dùng chung một form để hai đường không bao giờ lệch nhau về danh sách trường.
  const [category, setCategory] = useState<VehicleCategoryCode>('car');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [plateInput, setPlateInput] = useState('');
  const [plateError, setPlateError] = useState<string | null>(null);
  const [plateSuccess, setPlateSuccess] = useState<string | null>(null);
  const [isSavingVehicle, setIsSavingVehicle] = useState(false);
  const plateInputRef = useRef<HTMLInputElement | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrVehicle, setQrVehicle] = useState<Vehicle | null>(null);

  // Dropdown loại xe lấy thẳng từ backend — thêm loại mới ở BE là FE có ngay,
  // không phải sửa danh sách cứng ở đây.
  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.code, label: c.label })),
    [categories]
  );

  const vehicleBrandOptions = useMemo(() => {
    const list = brandsForCategory(category);
    return [
      { value: '', label: '— Select brand (optional) —' },
      ...list.map((b) => ({ value: b, label: b })),
    ];
  }, [category]);

  const user = useMemo(() => {
    if (!session) return null;
    return {
      fullName: session.displayName,
      email: session.email,
      phone: session.phone || '',
      role: session.role,
    };
  }, [session]);

  const flashSuccess = (message: string) => {
    setPlateSuccess(message);
    setTimeout(() => setPlateSuccess(null), 2500);
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleStartEdit = () => {
    if (!user) return;
    setForm({ fullName: user.fullName || '', phone: user.phone || '' });
    setProfileError(null);
    setIsEditing(true);
    setSuccessMessage(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPlateError(null);
    setPlateSuccess(null);
    setPlateInput('');
    setProfileError(null);
  };

  const resetVehicleForm = () => {
    setVehicleBrand('');
    setCustomBrand('');
    setEditingVehicleId(null);
  };

  /** Chuỗi rỗng gửi thành null để người dùng xoá được hãng cũ, không lưu chuỗi trắng. */
  const brandValue = () =>
    (vehicleBrand === 'Other' ? customBrand.trim() : vehicleBrand.trim()) || null;

  /** Thêm xe — gọi API ngay, không chờ bấm Lưu. */
  const handleAddVehicle = async () => {
    setPlateError(null);
    setPlateSuccess(null);

    if (vehicles.length >= MAX_VEHICLES) {
      setPlateError(`Each account can register up to ${MAX_VEHICLES} vehicles.`);
      return;
    }

    const result = validatePlate(plateInput, vehicles, category);
    if (!result.ok) {
      setPlateError(result.error ?? 'Invalid license plate.');
      return;
    }

    const brand = brandValue();
    setIsSavingVehicle(true);
    try {
      const created = await add({ plateNumber: normalizePlate(plateInput), category, brand });
      setPlateInput('');
      resetVehicleForm();
      flashSuccess(`Added ${created.plateNumber}${brand ? ` · ${brand}` : ''}.`);
      plateInputRef.current?.focus();
    } catch (err) {
      setPlateError(err instanceof Error ? err.message : 'Could not add the vehicle.');
    } finally {
      setIsSavingVehicle(false);
    }
  };

  /** Nạp xe đang có vào form để sửa. Biển số không sửa được — backend chỉ nhận mô tả. */
  const handleStartEditVehicle = (vehicle: Vehicle) => {
    setPlateError(null);
    setPlateSuccess(null);
    setEditingVehicleId(vehicle._id);
    setCategory(vehicle.category);
    const known = brandsForCategory(vehicle.category).includes(vehicle.brand ?? '');
    setVehicleBrand(vehicle.brand ? (known ? vehicle.brand : 'Other') : '');
    setCustomBrand(vehicle.brand && !known ? vehicle.brand : '');
  };

  const handleCancelEditVehicle = () => {
    resetVehicleForm();
    setPlateError(null);
  };

  const handleSaveVehicleEdit = async () => {
    if (!editingVehicleId) return;
    setPlateError(null);
    setPlateSuccess(null);

    // Đổi thể loại cũng phải khớp sê-ri biển như lúc thêm mới, nếu không thì chỉ
    // cần thêm xe đúng rồi sửa lại là lách được.
    const editing = vehicles.find((v) => v._id === editingVehicleId);
    if (editing && !plateMatchesCategory(editing.plateNumber, category)) {
      const expected = plateVehicleKind(editing.plateNumber) === 'motorcycle' ? 'a motorcycle' : 'a car';
      setPlateError(
        `${editing.plateNumber} is ${expected} plate — it does not match the vehicle type you selected.`
      );
      return;
    }

    setIsSavingVehicle(true);
    try {
      const updated = await update(editingVehicleId, { category, brand: brandValue() });
      resetVehicleForm();
      flashSuccess(`Updated ${updated.plateNumber}.`);
    } catch (err) {
      // Backend chặn đổi thể loại khi xe đang gửi hoặc còn gói — hiện nguyên văn lý do.
      setPlateError(err instanceof Error ? err.message : 'Could not update the vehicle.');
    } finally {
      setIsSavingVehicle(false);
    }
  };

  const handleRemoveVehicle = async (vehicleId: string) => {
    setPlateError(null);
    try {
      await remove(vehicleId);
      if (editingVehicleId === vehicleId) resetVehicleForm();
      flashSuccess('Vehicle removed.');
    } catch (err) {
      // Backend chặn xoá khi xe đang gửi hoặc còn gói — hiện nguyên văn lý do.
      setPlateError(err instanceof Error ? err.message : 'Could not remove the vehicle.');
    }
  };

  const handleSetDefaultVehicle = async (vehicle: Vehicle) => {
    setPlateError(null);
    try {
      await setDefault(vehicle._id);
      flashSuccess(`${vehicle.plateNumber} is now your default vehicle.`);
    } catch (err) {
      setPlateError(err instanceof Error ? err.message : 'Could not set the default vehicle.');
    }
  };

  const handleRefreshQr = async (vehicleId: string) => {
    const updated = await refreshQr(vehicleId);
    setQrVehicle(updated);
    return updated;
  };

  const handlePlateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editingVehicleId) void handleSaveVehicleEdit();
      else void handleAddVehicle();
    }
    if (e.key === 'Escape') {
      if (editingVehicleId) handleCancelEditVehicle();
      else setPlateInput('');
      setPlateError(null);
    }
  };

  /** Lưu hồ sơ — chỉ còn họ tên và số điện thoại; phương tiện đã lưu ngay khi thao tác. */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileError(null);
    setApiError(null);

    const newPhone = form.phone.trim();

    // Chỉ kiểm tra định dạng; trùng số điện thoại do BE trả 409 PHONE_TAKEN.
    if (!/^0[0-9]{9}$/.test(newPhone)) {
      setProfileError('Số điện thoại phải bắt đầu bằng 0 và có đúng 10 chữ số.');
      return;
    }

    setIsSaving(true);
    try {
      await userApi.profile.update({ fullName: form.fullName.trim(), phone: newPhone });
      updateProfile({ fullName: form.fullName.trim(), phone: newPhone });

      setIsEditing(false);
      setSuccessMessage('Đã cập nhật hồ sơ.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Không lưu được hồ sơ, vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  // Chỉ kết luận "thiếu xe" sau khi API trả về, tránh cảnh báo nhấp nháy lúc đang tải.
  const hasMissingInfo =
    !!user &&
    user.role === 'user' &&
    (!user.phone || user.phone.trim() === '' || (vehiclesLoaded && vehicles.length === 0));

  return {
    session,
    user,
    isEditing,
    form,
    setForm,
    vehicles,
    vehiclesLoading,
    vehiclesLoaded,
    qrTtlDays,
    category,
    setCategory,
    categoryOptions,
    vehicleBrand,
    setVehicleBrand,
    customBrand,
    setCustomBrand,
    editingVehicleId,
    plateInput,
    setPlateInput,
    plateError,
    setPlateError,
    plateSuccess,
    plateInputRef,
    vehicleBrandOptions,
    isSavingVehicle,
    successMessage,
    profileError,
    isSaving,
    apiError,
    showQRModal,
    setShowQRModal,
    qrVehicle,
    setQrVehicle,
    hasMissingInfo,
    handleLogout,
    handleStartEdit,
    handleCancel,
    handleAddVehicle,
    handleStartEditVehicle,
    handleCancelEditVehicle,
    handleSaveVehicleEdit,
    handleRemoveVehicle,
    handleSetDefaultVehicle,
    handleRefreshQr,
    handlePlateKeyDown,
    handleSave,
  };
}

export type ProfileWorkflow = ReturnType<typeof useProfileWorkflow>;
