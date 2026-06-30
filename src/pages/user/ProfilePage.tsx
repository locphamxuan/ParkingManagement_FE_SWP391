import { useMemo, useState, useRef, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, LogOut, User, Edit, Save, X, ShieldAlert, Plus, AlertCircle, CheckCircle2, Car, Bike, Loader2, QrCode } from 'lucide-react';
import { syncPlates, listPlates, type PlateRecord } from '@/services/licensePlateService';
import { UserQRModal } from '@/components/modals/UserQRModal';
import { PlateQRModal } from '@/components/modals/PlateQRModal';
import { PasswordChangeSection } from '@/components/user/PasswordChangeSection';
import { userApi } from '@/services/user/userApi';
import { CustomSelect } from '@/components/ui/select';
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
  const [editPlates, setEditPlates] = useState<Array<{ _id?: string; plateNumber: string; vehicleType: 'car' | 'motorcycle'; brand?: string | null; isDefault?: boolean }>>([]);
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
            Back to Home
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all duration-300 hover:shadow-[0_0_15px_rgba(220,38,38,0.25)] hover:scale-105"
            onClick={handleLogout}
          >
            <LogOut size={14} className="stroke-[3]" />
            Logout
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
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 font-mono">Incomplete Profile Information</h4>
                <p className="text-[11px] text-amber-200/80 mt-1 font-semibold leading-relaxed">
                  {!user.phone || user.phone.trim() === ''
                    ? 'Your account has no phone number.'
                    : ''}
                  {user.licensePlates.length === 0
                    ? ' No license plate is linked to your account.'
                    : ''}
                  {' '}Please click "Edit Profile" to update, so the PBMS system can automatically recognize you at control gates.
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
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-400 font-mono">User Profile</p>
                <h1 className="text-3xl font-black tracking-tight text-white">
                  Personal <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-blue-400 bg-clip-text text-transparent">Account Information</span>
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
                    Edit Profile
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
                      <span>Connection error: {apiError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Full Name</label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
                    required
                    className="block w-full rounded-xl border border-white/10 bg-slate-950/80 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] text-sm h-11 px-4 transition-all duration-300 outline-none"
                    placeholder="John Doe"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Phone Number</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                    className="block w-full rounded-xl border border-white/10 bg-slate-950/80 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] text-sm h-11 px-4 transition-all duration-300 outline-none"
                    placeholder="Example: 0901234567"
                  />
                </div>

                {/* ── License Plate Tag Manager ─────────────────── */}
                {user.role === 'user' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
                        Linked License Plates
                      </label>
                      <span className={`text-[9px] font-black font-mono px-2 py-0.5 rounded-full ${editPlates.length >= MAX_PLATES
                        ? 'bg-rose-500/15 text-rose-400'
                        : 'bg-slate-800 text-slate-500'
                        }`}>
                        {editPlates.length}/{MAX_PLATES} plates
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
                              {item.isDefault ? 'Default' : item.vehicleType === 'car' ? 'Car' : 'Motorcycle'}
                            </span>
                            {item.brand && (
                              <span className="text-[8px] px-1.5 py-0.5 rounded font-sans font-extrabold tracking-normal uppercase bg-slate-700/50 text-slate-300">
                                {item.brand}
                              </span>
                            )}
                            {!item.isDefault && (
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.2 }}
                                onClick={() => handleSetDefaultEditPlate(item)}
                                className="ml-1.5 rounded p-0.5 transition-all duration-150 hover:bg-amber-500/10 text-slate-400 hover:text-amber-400 animate-fadeIn"
                                title="Set as default"
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
                              title={`Remove plate ${item.plateNumber}`}
                            >
                              <X size={11} className="stroke-[3]" />
                            </motion.button>
                          </motion.span>
                        ))}
                      </AnimatePresence>
                      {editPlates.length === 0 && (
                        <span className="text-[11px] text-slate-600 font-semibold italic self-center pl-1">No license plates added yet...</span>
                      )}
                    </div>

                    {/* Add Plate Row */}
                    {editPlates.length < MAX_PLATES ? (
                      <div className="space-y-3 p-4 rounded-2xl border border-white/5 bg-slate-900/20 shadow-inner">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Vehicle Type:</span>
                          <div className="flex gap-1.5 p-1 rounded-xl bg-slate-950 border border-white/10 w-fit">
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => { setVehicleType('car'); setVehicleBrand(''); setCustomBrand(''); }}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${
                                vehicleType === 'car'
                                  ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <Car size={12} />
                              Car
                            </motion.button>
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => { setVehicleType('motorcycle'); setVehicleBrand(''); setCustomBrand(''); }}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${
                                vehicleType === 'motorcycle'
                                  ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <Bike size={12} />
                              Motorcycle
                            </motion.button>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono shrink-0">Brand:</span>
                          <CustomSelect
                            value={vehicleBrand}
                            onChange={(val) => {
                              setVehicleBrand(val);
                              if (val !== 'Other') setCustomBrand('');
                            }}
                            options={vehicleBrandOptions}
                            placeholder="— Select brand (optional) —"
                            className="flex-1 h-10 text-xs sm:text-sm font-semibold"
                          />
                        </div>

                        {/* Custom brand input — shown when user picks "Other" */}
                        {vehicleBrand === 'Other' && (
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono shrink-0">Enter Brand:</span>
                            <input
                              type="text"
                              value={customBrand}
                              onChange={(e) => setCustomBrand(e.target.value)}
                              maxLength={50}
                              placeholder="Enter your vehicle brand"
                              className="flex-1 rounded-xl border border-white/10 bg-slate-950/80 text-white placeholder-slate-600 text-sm h-10 px-3 outline-none transition-all duration-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                              autoComplete="off"
                            />
                          </div>
                        )}

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
                            placeholder="Example: 59G2-038.80"
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
                            Add
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-2.5">
                        <AlertCircle size={14} className="text-rose-400 shrink-0" />
                        <span className="text-[11px] text-rose-300 font-semibold">Maximum limit of {MAX_PLATES} license plates reached. Remove one to add a new one.</span>
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
                      * Format: 2 digits + series (e.g. <span className="font-mono text-slate-400">G2</span> or <span className="font-mono text-slate-400">LD</span>) + hyphen + 4-5 digits. Example: <span className="font-mono text-slate-400">59G2-03880</span>, <span className="font-mono text-slate-400">59G2-038.80</span>. Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[8px]">Enter</kbd> or click Add to confirm.
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
                      <><Loader2 size={13} className="animate-spin stroke-[2.5]" />Saving...</>
                    ) : (
                      <><Save size={13} className="stroke-[2.5]" />Save Changes</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 hover:border-white/20 inline-flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <X size={13} className="stroke-[2.5]" />
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid gap-4 rounded-3xl bg-slate-950/40 p-6 border border-white/5 animate-fadeIn">
                {[
                  { label: 'Name', value: user.fullName },
                  { label: 'Email', value: user.email },
                  { label: 'Phone Number', value: user.phone },
                  ...(user.role === 'user' ? [{
                    label: 'Linked License Plates',
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
                                  ? 'Default'
                                  : item.vehicleType === 'car'
                                    ? 'Car'
                                    : 'Motorcycle'}
                              </span>
                              {plateQrToken(item.plateNumber) && (
                                <button
                                  type="button"
                                  onClick={() => setPlateQrTarget({
                                    qrToken: plateQrToken(item.plateNumber)!,
                                    plateNumber: item.plateNumber,
                                    brand: (item as { brand?: string | null }).brand ?? null,
                                  })}
                                  className="ml-1 rounded p-0.5 text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
                                  title="View vehicle QR code"
                                >
                                  <QrCode size={12} className="stroke-[2.5]" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-amber-400 font-bold text-xs flex items-center gap-1.5 mt-1 animate-pulse">
                          <ShieldAlert size={14} /> No linked license plates
                        </span>
                      ),
                    isCustom: true,
                  }] : []),
                  { label: 'Role', value: user.role, uppercase: true },
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
                        {field.value || '— Not updated —'}
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
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 font-mono">Account</p>
                  <p className="text-lg font-black text-white leading-tight mt-0.5">{user.fullName || 'New User'}</p>
                </div>
              </div>

              {/* Quick Details List */}
              <div className="space-y-4 rounded-3xl bg-slate-950/40 border border-white/5 p-6 shadow-md">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono">Quick Details</h2>
                <div className="grid gap-3 text-xs text-slate-400">
                  <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                    <p className="text-[10px] font-black uppercase text-slate-500 font-mono">Email</p>
                    <p className="mt-1 text-slate-200 font-bold">{user.email || 'Not updated'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                    <p className="text-[10px] font-black uppercase text-slate-500 font-mono">Phone Number</p>
                    <p className="mt-1 text-slate-200 font-bold">{user.phone || '— Not updated —'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                    <p className="text-[10px] font-black uppercase text-slate-500 font-mono">Role</p>
                    <p className="mt-1 font-mono uppercase text-orange-400 font-black">{user.role || 'user'}</p>
                  </div>
                  {user.role === 'user' && (
                    <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                      <p className="text-[10px] font-black uppercase text-slate-500 font-mono">Linked Plates</p>
                      <p className={`mt-1 font-mono font-black text-sm ${user.licensePlates.length > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {user.licensePlates.length > 0 ? `${user.licensePlates.length}/${MAX_PLATES} plates` : 'None'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Plate count visual indicator */}
              {user.role === 'user' && (
                <div className="rounded-3xl bg-slate-950/40 border border-white/5 p-6 shadow-md space-y-3">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono">License Plate Slots</h2>
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
                      ? 'No license plates linked yet.'
                      : user.licensePlates.length < MAX_PLATES
                        ? `${MAX_PLATES - user.licensePlates.length} empty slots remaining.`
                        : 'Maximum limit reached.'}
                  </p>
                </div>
              )}

            </div>

          </motion.aside>
        </div>
      </div>

      <PasswordChangeSection />

      {/* QR Modal */}
      <UserQRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        userId={session?.userId || ''}
        fullName={user?.fullName}
      />

      <PlateQRModal
        isOpen={!!plateQrTarget}
        onClose={() => setPlateQrTarget(null)}
        qrToken={plateQrTarget?.qrToken || ''}
        plateNumber={plateQrTarget?.plateNumber || ''}
        brand={plateQrTarget?.brand}
      />
    </main>
  );
}
