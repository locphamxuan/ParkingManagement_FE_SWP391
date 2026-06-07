import { useMemo, useState, useRef, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, LogOut, User, Edit, Save, X, ShieldAlert, Plus, AlertCircle, CheckCircle2, Car, Bike, Loader2, Star, QrCode, KeyRound } from 'lucide-react';
import { syncPlates } from '@/services/licensePlateService';
import { UserQRModal } from '@/components/shared/UserQRModal';
import { userApi } from '@/services/user/userApi';

// ─── Vietnamese license plate 4-step strict validation ───────────────────────
// Step 1: Not empty
// Step 2: Uppercase, trim, normalize separators (dấu cách → dấu gạch ngang)
// Step 3: Must match pattern: 2-digits + 1-letter + optional 1-letter + dash + 3-to-5 digits
//         e.g. 29A-12345 | 30AB-1234 | 51F-99999
//         Pattern: /^\d{2}[A-Z]{1,2}-\d{3,5}$/
// Step 4: Must not already exist in the list
const PLATE_REGEX = /^\d{2}[A-Z]{1,2}-\d{3,5}$/;

function normalizePlate(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '-').replace(/[.]/g, '-');
}

interface PlateValidationResult {
  ok: boolean;
  error?: string;
}

function validatePlate(raw: string, existingPlates: Array<{ plateNumber: string; vehicleType: 'car' | 'motorcycle' }>): PlateValidationResult {
  // Step 1: empty check
  if (!raw || raw.trim() === '') {
    return { ok: false, error: 'Vui lòng nhập biển số xe.' };
  }

  const plate = normalizePlate(raw);

  // Step 2: format check (regex)
  if (!PLATE_REGEX.test(plate)) {
    return {
      ok: false,
      error: 'Biển số không đúng định dạng. Ví dụ hợp lệ: 29A-12345, 30AB-1234, 51F-99999.',
    };
  }

  // Step 3: max length sanity (already covered by regex, but extra guard)
  if (plate.length > 10) {
    return { ok: false, error: 'Biển số không được vượt quá 10 ký tự.' };
  }

  // Step 4: duplicate check
  if (existingPlates.some((p) => p.plateNumber.toUpperCase() === plate)) {
    return { ok: false, error: `Biển số "${plate}" đã được thêm.` };
  }

  return { ok: true };
}
// ─────────────────────────────────────────────────────────────────────────────

const MAX_PLATES = 3;

export default function ProfilePage() {
  const navigate = useNavigate();
  const { session, logout, updateProfile, setDefaultLicensePlate } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
  });
  // License plate tag state (while editing)
  const [editPlates, setEditPlates] = useState<Array<{ _id?: string; plateNumber: string; vehicleType: 'car' | 'motorcycle'; isDefault?: boolean }>>([]);
  const [vehicleType, setVehicleType] = useState<'car' | 'motorcycle'>('car');
  const [plateInput, setPlateInput] = useState('');
  const [plateError, setPlateError] = useState<string | null>(null);
  const [plateSuccess, setPlateSuccess] = useState<string | null>(null);
  const plateInputRef = useRef<HTMLInputElement | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSettingDefaultId, setIsSettingDefaultId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

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

  useEffect(() => {
    // Initialize mock database if not already present
    if (!localStorage.getItem('pbms.allRegisteredPhones')) {
      localStorage.setItem('pbms.allRegisteredPhones', JSON.stringify(["0911111111", "0922222222"]));
    }
  }, []);

  if (!session || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleStartEdit = () => {
    setForm({
      fullName: user.fullName || '',
      phone: user.phone || '',
    });
    setEditPlates([...user.licensePlates]);
    setVehicleType('car');
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
      setPlateError(`Tối đa ${MAX_PLATES} biển số xe cho mỗi tài khoản.`);
      return;
    }

    const result = validatePlate(plateInput, editPlates);
    if (!result.ok) {
      setPlateError(result.error ?? 'Biển số không hợp lệ.');
      return;
    }

    const normalized = normalizePlate(plateInput);
    setEditPlates((prev) => [...prev, { plateNumber: normalized, vehicleType }]);
    setPlateInput('');
    setPlateSuccess(`Đã thêm biển số "${normalized}" (${vehicleType === 'car' ? 'Ô tô' : 'Xe máy'}) thành công!`);
    setTimeout(() => setPlateSuccess(null), 2500);
    plateInputRef.current?.focus();
  };

  const handleRemovePlate = (plateToRemove: string) => {
    setEditPlates((prev) => prev.filter((p) => p.plateNumber !== plateToRemove));
    setPlateError(null);
    setPlateSuccess(null);
  };

  const handleSetDefaultEditPlate = async (plate: typeof editPlates[0]) => {
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
        setPlateSuccess(`Đã đặt biển số "${plate.plateNumber}" làm mặc định! 🌟`);
        setTimeout(() => setPlateSuccess(null), 2500);
      } catch (err) {
        setPlateError(err instanceof Error ? err.message : 'Không thể thiết lập mặc định.');
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
    setProfileError(null);
    setApiError(null);

    const newPhone = form.phone.trim();
    const oldPhone = user.phone.trim();

    // Step 1: Format check
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(newPhone)) {
      setProfileError('Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 chữ số!');
      return;
    }

    // Step 2: Duplicate check
    const allRegisteredPhonesRaw = localStorage.getItem('pbms.allRegisteredPhones');
    let allRegisteredPhones: string[] = allRegisteredPhonesRaw
      ? JSON.parse(allRegisteredPhonesRaw)
      : ['0911111111', '0922222222'];

    if (newPhone !== oldPhone && allRegisteredPhones.includes(newPhone)) {
      setProfileError('Số điện thoại này đã được đăng ký bởi một tài khoản khác!');
      return;
    }

    // Step 3: Update simulated registry
    if (oldPhone) {
      allRegisteredPhones = allRegisteredPhones.filter((p) => p !== oldPhone);
    }
    allRegisteredPhones.push(newPhone);
    localStorage.setItem('pbms.allRegisteredPhones', JSON.stringify(allRegisteredPhones));

    setIsSaving(true);

    try {
      // Sync license plates with MongoDB backend
      // Current server-side plates (with _id) come from the session
      const currentServerPlates = (user.licensePlates || []).map((p) => ({
        _id: (p as any)._id as string | undefined,
        plateNumber: p.plateNumber,
        vehicleType: p.vehicleType,
      }));

      // Persist fullName / phone to the backend (PUT /users/profile).
      await userApi.profile.update({ fullName: form.fullName.trim(), phone: newPhone });

      // syncPlates handles add/remove API calls and returns the fresh plate list from server
      const freshPlates = await syncPlates(currentServerPlates, editPlates);

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
      setSuccessMessage('Cập nhật thông tin & biển số xe thành công!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lưu thông tin thất bại. Vui lòng thử lại.';
      setApiError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      setPwError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('Mật khẩu xác nhận không khớp.');
      return;
    }
    try {
      setPwSaving(true);
      await userApi.profile.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwSuccess('Đổi mật khẩu thành công!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Đổi mật khẩu thất bại. Kiểm tra lại mật khẩu hiện tại.');
    } finally {
      setPwSaving(false);
    }
  };

  const hasMissingInfo =
    user.role === 'user' &&
    (!user.phone || user.phone.trim() === '' || user.licensePlates.length === 0);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden selection:bg-orange-500 selection:text-white">
      {/* Background Cyber Glowing Accents */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.06),transparent_60%)] pointer-events-none blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05),transparent_60%)] pointer-events-none blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 relative z-10">

        {/* Sticky Glass Panel Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 18 }}
          className="mb-8 flex items-center justify-between gap-4 rounded-3xl border border-white/5 bg-slate-900/60 p-4 backdrop-blur-md shadow-2xl"
        >
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-white/5 bg-slate-950 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-orange-400 hover:border-orange-500/30 hover:shadow-[0_0_15px_rgba(249,115,22,0.2)] transition-all duration-300 hover:scale-105"
            onClick={() => navigate('/', { replace: true })}
          >
            <ArrowLeft size={14} className="stroke-[3]" />
            Về trang chủ
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all duration-300 hover:shadow-[0_0_15px_rgba(220,38,38,0.25)] hover:scale-105"
            onClick={handleLogout}
          >
            <LogOut size={14} className="stroke-[3]" />
            Đăng xuất
          </button>
        </motion.div>

        {/* Success Alert Banner */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-4 text-xs font-black uppercase tracking-wider font-mono text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)] backdrop-blur-md flex items-center gap-3"
            >
              <CheckCircle2 size={16} />
              {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Warning Alert Box when licensePlates is empty or phone missing */}
        <AnimatePresence>
          {hasMissingInfo && !isEditing && (
            <motion.div
              key="warning"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 shadow-lg shadow-amber-500/5 flex items-start gap-4"
            >
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                <ShieldAlert size={18} className="stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 font-mono">Thông tin chưa đầy đủ</h4>
                <p className="text-[11px] text-amber-200/80 mt-1 font-semibold leading-relaxed">
                  {!user.phone || user.phone.trim() === ''
                    ? 'Tài khoản của bạn chưa có số điện thoại.'
                    : ''}
                  {user.licensePlates.length === 0
                    ? ' Tài khoản chưa có biển số xe nào được liên kết.'
                    : ''}
                  {' '}Vui lòng bấm "Chỉnh sửa hồ sơ" để cập nhật để hệ thống PBMS có thể tự động nhận diện tại các cổng kiểm soát.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Section layout */}
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">

          {/* User profile info block */}
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 90, damping: 16 }}
            className="space-y-6 rounded-3xl border border-white/5 bg-slate-900/40 p-8 backdrop-blur-md shadow-2xl relative overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-400 font-mono">Hồ sơ người dùng</p>
                <h1 className="text-3xl font-black tracking-tight text-white">
                  Thông tin <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-blue-400 bg-clip-text text-transparent">tài khoản cá nhân</span>
                </h1>
              </div>

              {!isEditing && (
                <div className="flex gap-3 items-center self-start flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowQRModal(true)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(34,211,238,0.35)] inline-flex items-center gap-1.5 animate-fadeIn"
                  >
                    <QrCode size={13} className="stroke-[2.5]" />
                    My QR
                  </button>
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(249,115,22,0.35)] inline-flex items-center gap-1.5 animate-fadeIn"
                  >
                    <Edit size={13} className="stroke-[2.5]" />
                    Chỉnh sửa hồ sơ
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-5 rounded-3xl bg-slate-950/40 p-6 border border-white/5 animate-fadeIn">

                {/* Profile Error Box */}
                <AnimatePresence>
                  {profileError && (
                    <motion.div
                      key="profile-error"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="rounded-2xl border border-rose-500/25 bg-rose-950/20 p-4 text-xs font-black uppercase tracking-wider font-mono text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)] backdrop-blur-md flex items-center gap-3"
                    >
                      <AlertCircle size={16} />
                      {profileError}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* API / Network Error Box */}
                <AnimatePresence>
                  {apiError && (
                    <motion.div
                      key="api-error"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="rounded-2xl border border-rose-500/25 bg-rose-950/20 p-4 text-xs font-semibold font-mono text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.1)] backdrop-blur-md flex items-center gap-3"
                    >
                      <AlertCircle size={16} className="shrink-0" />
                      <span>Lỗi kết nối: {apiError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Họ tên</label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
                    required
                    className="block w-full rounded-xl border border-white/10 bg-slate-950/80 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] text-sm h-11 px-4 transition-all duration-300 outline-none"
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Số điện thoại</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                    className="block w-full rounded-xl border border-white/10 bg-slate-950/80 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] text-sm h-11 px-4 transition-all duration-300 outline-none"
                    placeholder="Ví dụ: 0901234567"
                  />
                </div>

                {/* ── License Plate Tag Manager ─────────────────── */}
                {user.role === 'user' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
                        Biển số xe liên kết
                      </label>
                      <span className={`text-[9px] font-black font-mono px-2 py-0.5 rounded-full ${editPlates.length >= MAX_PLATES
                        ? 'bg-rose-500/15 text-rose-400'
                        : 'bg-slate-800 text-slate-500'
                        }`}>
                        {editPlates.length}/{MAX_PLATES} biển số
                      </span>
                    </div>

                    {/* Current Plate Tags */}
                    <div className="min-h-[44px] flex flex-wrap gap-2 rounded-xl border border-white/10 bg-slate-950/80 p-2.5">
                      <AnimatePresence>
                        {editPlates.map((item) => (
                          <motion.span
                            key={item.plateNumber}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8, x: -8 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                            whileHover={{ scale: 1.05 }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-black text-xs tracking-wider shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] transition-all duration-300 border ${
                              item.isDefault
                                ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                : item.vehicleType === 'car'
                                  ? 'bg-blue-500/15 border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                                  : 'bg-purple-500/15 border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                            }`}
                          >
                            {item.isDefault ? (
                              <span className="text-xs animate-pulse">⭐</span>
                            ) : item.vehicleType === 'car' ? (
                              <Car size={11} className="text-blue-400" />
                            ) : (
                              <Bike size={11} className="text-purple-400" />
                            )}
                            <span>{item.plateNumber}</span>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded font-sans font-extrabold tracking-normal uppercase ${
                              item.isDefault
                                ? 'bg-amber-500/25 text-amber-300'
                                : item.vehicleType === 'car'
                                  ? 'bg-blue-500/25 text-blue-300'
                                  : 'bg-purple-500/25 text-purple-300'
                            }`}>
                              {item.isDefault ? 'Mặc định' : item.vehicleType === 'car' ? 'Ô tô' : 'Xe máy'}
                            </span>
                            {!item.isDefault && (
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.2 }}
                                onClick={() => handleSetDefaultEditPlate(item)}
                                className="ml-1.5 rounded p-0.5 transition-all duration-150 hover:bg-amber-500/10 text-slate-400 hover:text-amber-400 animate-fadeIn"
                                title="Đặt làm mặc định"
                              >
                                <span className="text-xs font-black">☆</span>
                              </motion.button>
                            )}
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.2 }}
                              onClick={() => handleRemovePlate(item.plateNumber)}
                              className={`ml-1 rounded p-0.5 transition-all duration-150 ${
                                item.isDefault
                                  ? 'text-amber-400/60 hover:text-rose-400 hover:bg-rose-500/10'
                                  : item.vehicleType === 'car'
                                    ? 'text-blue-400/60 hover:text-rose-400 hover:bg-rose-500/10'
                                    : 'text-purple-400/60 hover:text-rose-400 hover:bg-rose-500/10'
                              }`}
                              title={`Xóa biển số ${item.plateNumber}`}
                            >
                              <X size={11} className="stroke-[3]" />
                            </motion.button>
                          </motion.span>
                        ))}
                      </AnimatePresence>
                      {editPlates.length === 0 && (
                        <span className="text-[11px] text-slate-600 font-semibold italic self-center pl-1">Chưa có biển số nào…</span>
                      )}
                    </div>

                    {/* Add Plate Row */}
                    {editPlates.length < MAX_PLATES ? (
                      <div className="space-y-3 p-4 rounded-2xl border border-white/5 bg-slate-900/20 shadow-inner">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Loại xe:</span>
                          <div className="flex gap-1.5 p-1 rounded-xl bg-slate-950 border border-white/10 w-fit">
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setVehicleType('car')}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${
                                vehicleType === 'car'
                                  ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <Car size={12} />
                              Ô tô
                            </motion.button>
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setVehicleType('motorcycle')}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${
                                vehicleType === 'motorcycle'
                                  ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <Bike size={12} />
                              Xe máy
                            </motion.button>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <input
                            ref={plateInputRef}
                            type="text"
                            value={plateInput}
                            onChange={(e) => {
                              setPlateInput(e.target.value.toUpperCase());
                              setPlateError(null);
                            }}
                            onKeyDown={handlePlateKeyDown}
                            className={`flex-1 rounded-xl border bg-slate-950/80 text-white placeholder-slate-600 text-sm h-10 px-4 transition-all duration-300 outline-none font-mono tracking-wider ${
                              vehicleType === 'car'
                                ? 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                                : 'focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 focus:shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                            }`}
                            placeholder="Ví dụ: 29A-12345"
                            maxLength={12}
                            autoComplete="off"
                            spellCheck={false}
                          />
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleAddPlate}
                            className={`px-4 h-10 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 inline-flex items-center gap-1.5 shrink-0 ${
                              vehicleType === 'car'
                                ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]'
                                : 'bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.15)]'
                            }`}
                          >
                            <Plus size={14} className="stroke-[3]" />
                            Thêm
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-2.5">
                        <AlertCircle size={14} className="text-rose-400 shrink-0" />
                        <span className="text-[11px] text-rose-300 font-semibold">Đã đạt giới hạn tối đa {MAX_PLATES} biển số xe. Xóa một biển số để thêm biển mới.</span>
                      </div>
                    )}

                    {/* Validation error */}
                    <AnimatePresence>
                      {plateError && (
                        <motion.div
                          key="plate-error"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-950/20 px-3.5 py-2.5 text-[11px] font-semibold text-rose-400"
                        >
                          <AlertCircle size={13} className="shrink-0" />
                          {plateError}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Success feedback */}
                    <AnimatePresence>
                      {plateSuccess && (
                        <motion.div
                          key="plate-success"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-950/20 px-3.5 py-2.5 text-[11px] font-semibold text-emerald-400"
                        >
                          <CheckCircle2 size={13} className="shrink-0" />
                          {plateSuccess}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <p className="text-[9px] text-slate-500 font-semibold leading-relaxed">
                      * Định dạng hợp lệ: 2 số + 1-2 chữ cái + dấu gạch ngang + 3-5 số. Ví dụ: <span className="font-mono text-slate-400">29A-12345</span>, <span className="font-mono text-slate-400">30AB-1234</span>. Nhấn <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[8px]">Enter</kbd> hoặc nút Thêm để xác nhận.
                    </p>
                  </div>
                )}
                {/* ── End License Plate Tag Manager ────────────── */}

                <div className="flex gap-3 pt-3 border-t border-white/5">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(249,115,22,0.35)] inline-flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isSaving ? (
                      <><Loader2 size={13} className="animate-spin stroke-[2.5]" />Đang lưu...</>
                    ) : (
                      <><Save size={13} className="stroke-[2.5]" />Lưu thay đổi</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 hover:border-white/20 inline-flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <X size={13} className="stroke-[2.5]" />
                    Hủy
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid gap-4 rounded-3xl bg-slate-950/40 p-6 border border-white/5 animate-fadeIn">
                {[
                  { label: 'Tên', value: user.fullName },
                  { label: 'Email', value: user.email },
                  { label: 'Số điện thoại', value: user.phone },
                  ...(user.role === 'user' ? [{
                    label: 'Biển số xe đã liên kết',
                    value:
                      user.licensePlates.length > 0 ? (
                        <div className="flex flex-wrap gap-2.5 mt-1.5">
                          {user.licensePlates.map((item) => (
                            <div
                              key={item.plateNumber}
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono font-black text-xs tracking-wider shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] animate-fadeIn border ${item.isDefault
                                ? 'border border-amber-500/40 bg-amber-500/10 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                                : item.vehicleType === 'car'
                                  ? 'bg-blue-500/5 border border-blue-500/20 text-blue-400/80'
                                  : 'bg-purple-500/5 border border-purple-500/20 text-purple-400/80'
                                }`}
                            >
                              {item.isDefault ? (
                                <span className="text-xs">⭐</span>
                              ) : item.vehicleType === 'car' ? (
                                <Car size={11} />
                              ) : (
                                <Bike size={11} />
                              )}
                              <span>{item.plateNumber}</span>
                              <span className={`text-[8px] px-1.5 py-0.2 rounded font-sans font-extrabold tracking-normal uppercase ${item.isDefault
                                ? 'bg-amber-500/20 text-amber-300'
                                : item.vehicleType === 'car'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'bg-purple-500/20 text-purple-300'
                                }`}>
                                {item.isDefault
                                  ? 'Mặc định'
                                  : item.vehicleType === 'car'
                                    ? 'Ô tô'
                                    : 'Xe máy'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-amber-400 font-bold text-xs flex items-center gap-1.5 mt-1 animate-pulse">
                          <ShieldAlert size={14} /> Chưa liên kết biển số xe
                        </span>
                      ),
                    isCustom: true,
                  }] : []),
                  { label: 'Vai trò', value: user.role, uppercase: true },
                ].map((field, idx) => (
                  <motion.div
                    key={field.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.06 }}
                    className="grid gap-1.5 rounded-2xl border border-white/5 bg-slate-950/70 p-5 shadow-inner transition-all duration-300 hover:border-orange-500/15"
                  >
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 font-mono">{field.label}</p>
                    {field.isCustom ? (
                      <div>{field.value}</div>
                    ) : (
                      <p className={`text-base font-black text-slate-200 ${field.uppercase ? 'uppercase font-mono text-orange-400 text-sm' : ''}`}>
                        {field.value || '— Chưa cập nhật —'}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>

          {/* Sidebar right aside detail block */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 90, damping: 16, delay: 0.1 }}
            className="rounded-3xl border border-white/5 bg-slate-900/20 p-8 backdrop-blur-md shadow-2xl flex flex-col gap-6 justify-between animate-fadeIn"
          >
            <div className="space-y-6">

              {/* Account Quick Header card */}
              <div className="flex items-center gap-4 rounded-3xl bg-slate-950/60 border border-white/5 p-5 shadow-md">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-slate-950 shadow-[0_0_15px_rgba(249,115,22,0.25)]">
                  <User size={24} className="stroke-[2.5]" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 font-mono">Tài khoản</p>
                  <p className="text-lg font-black text-white leading-tight mt-0.5">{user.fullName || 'Người dùng mới'}</p>
                </div>
              </div>

              {/* Quick Details List */}
              <div className="space-y-4 rounded-3xl bg-slate-950/40 border border-white/5 p-6 shadow-md">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono">Chi tiết nhanh</h2>
                <div className="grid gap-3 text-xs text-slate-400">
                  <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                    <p className="text-[10px] font-black uppercase text-slate-500 font-mono">Email</p>
                    <p className="mt-1 text-slate-200 font-bold">{user.email || 'Chưa cập nhật'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                    <p className="text-[10px] font-black uppercase text-slate-500 font-mono">Số điện thoại</p>
                    <p className="mt-1 text-slate-200 font-bold">{user.phone || '— Chưa cập nhật —'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                    <p className="text-[10px] font-black uppercase text-slate-500 font-mono">Vai trò</p>
                    <p className="mt-1 font-mono uppercase text-orange-400 font-black">{user.role || 'user'}</p>
                  </div>
                  {user.role === 'user' && (
                    <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                      <p className="text-[10px] font-black uppercase text-slate-500 font-mono">Biển số đã liên kết</p>
                      <p className={`mt-1 font-mono font-black text-sm ${user.licensePlates.length > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {user.licensePlates.length > 0 ? `${user.licensePlates.length}/${MAX_PLATES} biển số` : 'Chưa có'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Plate count visual indicator */}
              {user.role === 'user' && (
                <div className="rounded-3xl bg-slate-950/40 border border-white/5 p-6 shadow-md space-y-3">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono">Dung lượng biển số</h2>
                  <div className="flex gap-2">
                    {Array.from({ length: MAX_PLATES }).map((_, idx) => {
                      const hasPl = idx < user.licensePlates.length;
                      return (
                        <div
                          key={idx}
                          className={`flex-1 h-2 rounded-full transition-all duration-500 ${hasPl
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]'
                            : 'bg-slate-800'
                            }`}
                        />
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-slate-500 font-semibold">
                    {user.licensePlates.length === 0
                      ? 'Chưa có biển số nào được liên kết.'
                      : user.licensePlates.length < MAX_PLATES
                        ? `Còn ${MAX_PLATES - user.licensePlates.length} slot trống.`
                        : 'Đã đạt giới hạn tối đa.'}
                  </p>
                </div>
              )}

            </div>

          </motion.aside>
        </div>
      </div>

      {/* Password Change Section */}
      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8 relative z-10">
        <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound size={16} className="text-orange-400" />
            <h3 className="text-sm font-bold text-white">Đổi mật khẩu</h3>
          </div>
          <form onSubmit={handleChangePassword} className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Mật khẩu hiện tại
              </label>
              <input
                type="password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                placeholder="••••••••"
                className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                placeholder="Tối thiểu 6 ký tự"
                className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="Nhập lại mật khẩu mới"
                className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20"
              />
            </div>
            <div className="sm:col-span-3 flex items-center gap-3 flex-wrap">
              <button
                type="submit"
                disabled={pwSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2 text-xs font-black uppercase tracking-wider text-slate-950 hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {pwSaving ? <Loader2 size={12} className="animate-spin" /> : <KeyRound size={12} />}
                {pwSaving ? 'Đang lưu...' : 'Đổi mật khẩu'}
              </button>
              {pwError && (
                <p className="flex items-center gap-1 text-xs text-rose-400">
                  <AlertCircle size={12} /> {pwError}
                </p>
              )}
              {pwSuccess && (
                <p className="flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle2 size={12} /> {pwSuccess}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* QR Modal */}
      <UserQRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        userId={session?.userId || ''}
        fullName={user?.fullName}
      />
    </main>
  );
}
