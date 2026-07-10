import { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { syncPlates, listPlates, type PlateRecord } from '@/services/licensePlateService';
import { userApi } from '@/services/user/userApi';
import { normalizePlate, isValidVietnamPlate, brandsForVehicleType } from '@/utils/plate';

// ─── Vietnamese license plate validation (shared util — canonical 59G2-038.80) ─
// Series must be letter+digit (59G2) or two letters (30LD); a bare single letter
// like `59G` is rejected. Number group is 4–5 digits (5-digit → NNN.NN).
interface PlateValidationResult {
  ok: boolean;
  error?: string;
}

function validatePlate(raw: string, existingPlates: Array<{ plateNumber: string; vehicleType: 'car' | 'motorcycle' }>): PlateValidationResult {
  // Step 1: empty check
  if (!raw || raw.trim() === '') {
    return { ok: false, error: 'Please enter a license plate.' };
  }

  // Step 2: normalize to canonical VN form + format check
  const plate = normalizePlate(raw);
  if (!isValidVietnamPlate(plate)) {
    return {
      ok: false,
      error: 'Invalid license plate format. Example: 59G2-03880 or 59G2-038.80.',
    };
  }

  // Step 3: duplicate check
  if (existingPlates.some((p) => p.plateNumber.toUpperCase() === plate)) {
    return { ok: false, error: `License plate "${plate}" has already been added.` };
  }

  return { ok: true };
}
// ─────────────────────────────────────────────────────────────────────────────

export const MAX_PLATES = 3;

export interface EditPlate {
  _id?: string;
  plateNumber: string;
  vehicleType: 'car' | 'motorcycle';
  brand?: string | null;
  isDefault?: boolean;
}

/**
 * Toàn bộ state + business logic của trang Profile (thông tin cá nhân, quản lý
 * biển số xe liên kết). Tách khỏi ProfilePage để page chỉ còn lo phần hiển thị.
 */
export function useProfileWorkflow() {
  const navigate = useNavigate();
  const { session, logout, updateProfile, setDefaultLicensePlate } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
  });
  // License plate tag state (while editing)
  const [editPlates, setEditPlates] = useState<EditPlate[]>([]);
  const [vehicleType, setVehicleType] = useState<'car' | 'motorcycle'>('car');
  const [vehicleBrand, setVehicleBrand] = useState<string>('');
  const [customBrand, setCustomBrand] = useState<string>('');
  const [plateInput, setPlateInput] = useState('');
  const [plateError, setPlateError] = useState<string | null>(null);
  const [plateSuccess, setPlateSuccess] = useState<string | null>(null);
  const plateInputRef = useRef<HTMLInputElement | null>(null);

  const vehicleBrandOptions = useMemo(() => {
    const list = brandsForVehicleType(vehicleType);
    return [
      { value: '', label: '— Select vehicle brand (optional) —' },
      ...list.map((b) => ({ value: b, label: b })),
    ];
  }, [vehicleType]);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  // Server plates carry the per-plate QR token (PLT-...) used by the plate-QR modal.
  const [serverPlates, setServerPlates] = useState<PlateRecord[]>([]);
  const [plateQrTarget, setPlateQrTarget] = useState<{ qrToken: string; plateNumber: string; brand?: string | null } | null>(null);

  const user = useMemo(() => {
    if (!session) return null;
    return {
      fullName: session.displayName,
      email: session.email,
      phone: session.phone || '',
      licensePlates: session.licensePlates || [],
      role: session.role,
    };
  }, [session]);

  // Fetch plates (with their PLT- QR tokens) so each plate can show its scannable QR.
  useEffect(() => {
    listPlates().then(setServerPlates).catch(() => undefined);
  }, []);

  const plateQrToken = (plateNumber: string): string | null =>
    serverPlates.find((p) => p.plateNumber.toUpperCase() === plateNumber.toUpperCase())?.qrCode ?? null;

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleStartEdit = () => {
    if (!user) return;
    setForm({
      fullName: user.fullName || '',
      phone: user.phone || '',
    });
    setEditPlates([...user.licensePlates]);
    setVehicleType('car');
    setVehicleBrand('');
    setCustomBrand('');
    setPlateInput('');
    setPlateError(null);
    setPlateSuccess(null);
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

  // Add a plate tag via the 4-step validation
  const handleAddPlate = () => {
    setPlateError(null);
    setPlateSuccess(null);

    if (editPlates.length >= MAX_PLATES) {
      setPlateError(`Maximum of ${MAX_PLATES} license plates per account.`);
      return;
    }

    const result = validatePlate(plateInput, editPlates);
    if (!result.ok) {
      setPlateError(result.error ?? 'Invalid license plate.');
      return;
    }

    const normalized = normalizePlate(plateInput);
    const brand = (vehicleBrand === 'Other' ? customBrand.trim() : vehicleBrand.trim()) || null;
    setEditPlates((prev) => [...prev, { plateNumber: normalized, vehicleType, brand }]);
    setPlateInput('');
    setVehicleBrand('');
    setCustomBrand('');
    setPlateSuccess(`Added "${normalized}" (${vehicleType === 'car' ? 'Car' : 'Motorcycle'}${brand ? ` · ${brand}` : ''}) — click SAVE CHANGES to update the system.`);
    setTimeout(() => setPlateSuccess(null), 2500);
    plateInputRef.current?.focus();
  };

  const handleRemovePlate = (plateToRemove: string) => {
    setEditPlates((prev) => prev.filter((p) => p.plateNumber !== plateToRemove));
    setPlateError(null);
    setPlateSuccess(null);
  };

  const handleSetDefaultEditPlate = async (plate: EditPlate) => {
    // 1. Cập nhật state editPlates ngay lập tức để hiển thị trên giao diện
    setEditPlates((prev) =>
      prev.map((p) => ({
        ...p,
        isDefault: p.plateNumber === plate.plateNumber,
      }))
    );

    // 2. Nếu đã có _id trên Backend, gọi API setDefaultLicensePlate để lưu thay đổi
    if (plate._id) {
      try {
        await setDefaultLicensePlate(plate._id);
        setPlateSuccess(`Set "${plate.plateNumber}" as default plate! 🌟`);
        setTimeout(() => setPlateSuccess(null), 2500);
      } catch (err) {
        setPlateError(err instanceof Error ? err.message : 'Failed to set default plate.');
      }
    }
  };

  const handlePlateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPlate();
    }
    if (e.key === 'Escape') {
      setPlateInput('');
      setPlateError(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileError(null);
    setApiError(null);

    const newPhone = form.phone.trim();

    // Format check (BE kiểm tra trùng SĐT khi PUT /users/profile → 409 PHONE_TAKEN).
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(newPhone)) {
      setProfileError('Phone number must start with 0 and contain exactly 10 digits!');
      return;
    }

    setIsSaving(true);

    try {
      // Sync license plates with MongoDB backend
      // Current server-side plates (with _id) come from the session
      const currentServerPlates = (user.licensePlates || []).map((p) => ({
        _id: p._id,
        plateNumber: p.plateNumber,
        vehicleType: p.vehicleType,
        brand: p.brand ?? null,
      }));

      // Sync license plates FIRST so a profile-update failure can't block them.
      // syncPlates now throws if any add/remove fails (instead of silently swallowing),
      // so a plate that "looks added" but didn't persist surfaces a clear error here.
      const freshPlates = await syncPlates(currentServerPlates, editPlates);
      setServerPlates(freshPlates); // refresh per-plate QR tokens

      // Persist fullName / phone to the backend (PUT /users/profile).
      await userApi.profile.update({ fullName: form.fullName.trim(), phone: newPhone });

      // Tìm kiếm biển số xe có isDefault === true từ danh sách đã chỉnh sửa
      const defaultPlateInEdit = editPlates.find((ep) => ep.isDefault === true);

      // Nếu có biển số mặc định, đối chiếu với freshPlates để lấy _id thật từ server MongoDB và kích hoạt API setDefaultLicensePlate
      if (defaultPlateInEdit) {
        const matchingFresh = freshPlates.find(
          (fp) => fp.plateNumber.toUpperCase() === defaultPlateInEdit.plateNumber.toUpperCase()
        );
        if (matchingFresh && matchingFresh._id) {
          await setDefaultLicensePlate(matchingFresh._id);
        }
      }

      // Map to the session format (with _id preserved and isDefault status copied from editPlates)
      const sessionPlates = freshPlates.map((p) => {
        const matchingEdit = editPlates.find(
          (ep) => ep.plateNumber.toUpperCase() === p.plateNumber.toUpperCase()
        );
        return {
          _id: p._id,
          plateNumber: p.plateNumber,
          vehicleType: (p.vehicleType === 'motorcycle' ? 'motorcycle' : 'car') as 'car' | 'motorcycle',
          brand: (p.brand ?? matchingEdit?.brand) ?? null,
          isDefault: matchingEdit?.isDefault === true,
        };
      });

      updateProfile({
        fullName: form.fullName.trim(),
        phone: newPhone,
        licensePlates: sessionPlates,
      });

      // Nếu có biển số xe mặc định, gọi API setDefaultLicensePlate để đồng bộ database MongoDB
      const defaultPlate = sessionPlates.find((p) => p.isDefault);
      if (defaultPlate && defaultPlate._id) {
        await setDefaultLicensePlate(defaultPlate._id);
      }

      setIsEditing(false);
      setSuccessMessage('Profile & license plates updated successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save profile. Please try again.';
      setApiError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const hasMissingInfo =
    !!user &&
    user.role === 'user' &&
    (!user.phone || user.phone.trim() === '' || user.licensePlates.length === 0);

  return {
    session,
    user,
    isEditing,
    form,
    setForm,
    editPlates,
    vehicleType,
    setVehicleType,
    vehicleBrand,
    setVehicleBrand,
    customBrand,
    setCustomBrand,
    plateInput,
    setPlateInput,
    plateError,
    setPlateError,
    plateSuccess,
    plateInputRef,
    vehicleBrandOptions,
    successMessage,
    profileError,
    isSaving,
    apiError,
    showQRModal,
    setShowQRModal,
    plateQrTarget,
    setPlateQrTarget,
    plateQrToken,
    hasMissingInfo,
    handleLogout,
    handleStartEdit,
    handleCancel,
    handleAddPlate,
    handleRemovePlate,
    handleSetDefaultEditPlate,
    handlePlateKeyDown,
    handleSave,
  };
}

export type ProfileWorkflow = ReturnType<typeof useProfileWorkflow>;
