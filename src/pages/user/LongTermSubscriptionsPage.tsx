import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  Loader2,
  ReceiptText,
  RefreshCw,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBuildings, useLongTermPackages, useLongTermSubscriptions, useSubscribeToPackage, useCancelSubscription, useRenewSubscription } from '@/hooks/user';
import type { LongTermPackage, LongTermPaymentMethod, LongTermSubscription, ParkingSlot, FloorAvailability } from '@/services/user/userApi';
import { userApi } from '@/services/user/userApi';
import { CustomSelect } from '@/components/ui/select';

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

function formatMoney(value: number): string {
  return currency.format(value);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN');
}

function todayDateInputValue(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = `${today.getMonth() + 1}`.padStart(2, '0');
  const d = `${today.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Modal Component for Package Selection
interface PackageSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  package: LongTermPackage | null;
  buildings: any[];
  userPlates: any[];
  onSubmit: (data: {
    buildingId: string;
    plateNumber: string;
    startDate: string;
    slotId?: string;
    paymentMethod: LongTermPaymentMethod;
  }) => Promise<void>;
  isSubmitting: boolean;
}

function PackageSelectModal({
  isOpen,
  onClose,
  package: pkg,
  buildings,
  userPlates,
  onSubmit,
  isSubmitting,
}: PackageSelectModalProps) {
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [selectedPlate, setSelectedPlate] = useState('');
  const [startDate, setStartDate] = useState(todayDateInputValue());
  const [paymentMethod, setPaymentMethod] = useState<LongTermPaymentMethod>('wallet');
  const [error, setError] = useState<string | null>(null);

  // ── Chọn slot cố định (chỉ khi gói cho phép) ──────────────────────────────
  const pkgBuildingId = pkg
    ? (typeof pkg.building === 'object' ? pkg.building._id : pkg.building)
    : '';
  const [floors, setFloors] = useState<FloorAvailability[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState('');
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (isOpen && buildings.length > 0 && !selectedBuildingId) {
      setSelectedBuildingId(buildings[0]._id);
    }
  }, [isOpen, buildings]);

  useEffect(() => {
    if (isOpen && userPlates.length > 0 && !selectedPlate) {
      setSelectedPlate(userPlates[0].plateNumber);
    }
  }, [isOpen, userPlates]);

  // Tải danh sách tầng của tòa nhà thuộc gói (khi mở modal & gói cho slot cố định).
  useEffect(() => {
    if (!isOpen || !pkg?.allowDedicatedSlot || !pkgBuildingId) return;
    let cancelled = false;
    userApi.buildings
      .floors(pkgBuildingId)
      .then((res) => {
        if (cancelled) return;
        const fl = res.data?.floors ?? [];
        setFloors(fl);
        setSelectedFloorId((cur) => cur || (fl[0]?._id ?? ''));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isOpen, pkg?.allowDedicatedSlot, pkgBuildingId]);

  // Tải ô đỗ theo tầng đã chọn (kèm owner/selectable từ BE).
  useEffect(() => {
    if (!isOpen || !pkg?.allowDedicatedSlot || !pkgBuildingId || !selectedFloorId) return;
    let cancelled = false;
    setLoadingSlots(true);
    setSelectedSlotId('');
    userApi.buildings
      .slots(pkgBuildingId, selectedFloorId)
      .then((res) => {
        if (!cancelled) setSlots(res.data?.slots ?? []);
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setLoadingSlots(false));
    return () => {
      cancelled = true;
    };
  }, [isOpen, pkg?.allowDedicatedSlot, pkgBuildingId, selectedFloorId]);

  const handleSubmit = async () => {
    setError(null);

    if (!selectedBuildingId) {
      setError('Vui lòng chọn tòa nhà');
      return;
    }
    if (!selectedPlate) {
      setError('Vui lòng chọn biển số xe');
      return;
    }

    try {
      await onSubmit({
        buildingId: selectedBuildingId,
        plateNumber: selectedPlate,
        startDate,
        slotId: selectedSlotId || undefined,
        paymentMethod,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi đăng ký');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{pkg?.name}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-white/10"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Tòa nhà
            </label>
            <CustomSelect
              value={selectedBuildingId}
              onChange={setSelectedBuildingId}
              options={[
                { value: '', label: '-- Chọn tòa nhà --' },
                ...buildings.map((b) => ({
                  value: b._id,
                  label: b.name,
                })),
              ]}
              placeholder="Chọn tòa nhà"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Biển số xe
            </label>
            <CustomSelect
              value={selectedPlate}
              onChange={setSelectedPlate}
              options={[
                { value: '', label: '-- Chọn biển số --' },
                ...userPlates.map((p) => ({
                  value: p.plateNumber,
                  label: `${p.plateNumber} (${p.vehicleType === 'car' ? 'Ô tô' : 'Xe máy'})`,
                })),
              ]}
              placeholder="Chọn biển số"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Ngày bắt đầu
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm font-semibold text-white outline-none focus:border-orange-400/60"
            />
          </div>

          {/* Chọn chỗ đỗ cố định (chỉ với gói cho phép) */}
          {pkg?.allowDedicatedSlot && (
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-3 space-y-2.5">
              <p className="text-xs font-black uppercase tracking-wider text-cyan-300">Chọn chỗ đỗ cố định</p>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Tầng</label>
                <CustomSelect
                  value={selectedFloorId}
                  onChange={setSelectedFloorId}
                  options={floors.map((f) => ({ value: f._id, label: f.name || f.code }))}
                  placeholder="Chọn tầng"
                />
              </div>
              {loadingSlots ? (
                <p className="text-[11px] text-slate-400">Đang tải chỗ đỗ...</p>
              ) : slots.length === 0 ? (
                <p className="text-[11px] text-slate-500">Tầng này chưa có chỗ đỗ.</p>
              ) : (
                <div className="grid grid-cols-4 gap-1.5 max-h-44 overflow-y-auto pr-1">
                  {slots.map((s) => {
                    const taken = s.selectable === false;
                    const picked = selectedSlotId === s._id;
                    return (
                      <button
                        key={s._id}
                        type="button"
                        disabled={taken}
                        title={s.owner ? `Đã có chủ: ${s.owner.plateNumber}${s.owner.accountName ? ` · ${s.owner.accountName}` : ''}` : undefined}
                        onClick={() => setSelectedSlotId(picked ? '' : s._id)}
                        className={`rounded-lg border px-1 py-1.5 text-[11px] font-bold transition-all ${
                          picked
                            ? 'border-orange-400 bg-orange-500/20 text-orange-200'
                            : taken
                            ? 'cursor-not-allowed border-rose-500/20 bg-rose-500/5 text-rose-300/70'
                            : 'border-white/10 bg-slate-950 text-slate-200 hover:border-cyan-400/40'
                        }`}
                      >
                        <span className="block truncate">{s.code}</span>
                        {taken && s.owner ? (
                          <span className="block truncate text-[9px] font-semibold text-rose-300/70">{s.owner.plateNumber}</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
              {selectedSlotId && (
                <p className="text-[11px] font-bold text-orange-300">
                  Đã chọn ô: {slots.find((x) => x._id === selectedSlotId)?.code}
                  {floors.find((f) => f._id === selectedFloorId)?.name
                    ? ` · ${floors.find((f) => f._id === selectedFloorId)?.name}`
                    : ''}
                </p>
              )}
              <p className="text-[10px] text-slate-500">
                Ô đỏ = đã có chủ (không chọn được). Bỏ trống = không giữ chỗ cố định.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Phương thức thanh toán
            </label>
            <CustomSelect
              value={paymentMethod}
              onChange={(val) => setPaymentMethod(val as LongTermPaymentMethod)}
              options={[{ value: 'wallet', label: 'Ví PBMS' }]}
              placeholder="Chọn phương thức"
            />
            <p className="mt-1 text-[10px] text-slate-500">Phí gói được trừ trực tiếp từ ví PBMS.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-white/10 bg-slate-950 py-2.5 font-semibold text-slate-300 hover:bg-slate-900"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-400 py-2.5 font-bold text-slate-950 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="inline animate-spin mr-2" />
                  Đang xử lý...
                </>
              ) : (
                'Đăng ký'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Package Card Component
interface PackageCardProps {
  package: LongTermPackage;
  onSelect: (pkg: LongTermPackage) => void;
  isLoading?: boolean;
}

function PackageCard({ package: pkg, onSelect, isLoading }: PackageCardProps) {
  const isPopular = pkg.durationDays === 30; // Highlight monthly package

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl border p-6 transition-all ${
        isPopular
          ? 'border-orange-400/50 bg-gradient-to-br from-orange-500/10 to-amber-500/10'
          : 'border-white/10 bg-slate-900/60 hover:bg-slate-900/80'
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-4 inline-block rounded-full border border-orange-400/50 bg-gradient-to-r from-orange-500 to-amber-400 px-3 py-1 text-xs font-bold text-slate-950">
          Phổ biến nhất
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">{pkg.name}</h3>
        <p className="text-xs text-slate-400 mt-1">{pkg.code}</p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-orange-300">
            {formatMoney(pkg.price).replace('₫', '')}
          </span>
          <span className="text-sm font-semibold text-slate-400">₫</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {pkg.durationDays} ngày
        </p>
        {typeof pkg.maxHoursPerDay === 'number' && pkg.maxHoursPerDay > 0 && (
          <p className="mt-1 text-[11px] font-semibold text-cyan-300">
            Miễn phí {pkg.maxHoursPerDay}h/ngày · vượt tính theo giờ
          </p>
        )}
      </div>

      {/* Benefits */}
      <div className="mb-6 space-y-2">
        {(pkg.benefits || []).slice(0, 4).map((benefit, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <Check size={16} className="mt-0.5 shrink-0 text-emerald-400" />
            <span className="text-xs text-slate-300">{benefit}</span>
          </div>
        ))}
        {(pkg.benefits || []).length > 4 && (
          <p className="text-xs text-slate-400">
            + {(pkg.benefits || []).length - 4} ưu đãi khác
          </p>
        )}
      </div>

      {/* Subscribe Button */}
      <button
        onClick={() => onSelect(pkg)}
        disabled={isLoading}
        className={`w-full rounded-lg py-3 font-bold uppercase tracking-wider transition-all ${
          isPopular
            ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:shadow-lg hover:shadow-orange-500/30'
            : 'border border-white/20 bg-slate-950 text-orange-300 hover:border-orange-400/50 hover:bg-slate-900'
        } disabled:opacity-50`}
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="inline animate-spin mr-2" />
            Đang xử lý...
          </>
        ) : (
          'Đăng ký'
        )}
      </button>
    </motion.div>
  );
}

export default function LongTermSubscriptionsPage() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const { items: buildings, isLoading: isLoadingBuildings } = useBuildings();

  const [selectedPackageForModal, setSelectedPackageForModal] = useState<LongTermPackage | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // API Hooks for packages and subscriptions
  const {
    items: packages,
    isLoading: isLoadingPackages,
    error: packagesError,
  } = useLongTermPackages();

  const {
    items: subscriptions,
    isLoading: isLoadingSubscriptions,
    error: subscriptionsError,
    refresh: refreshSubscriptions,
  } = useLongTermSubscriptions();

  const { subscribe, isLoading: isSubmitting } = useSubscribeToPackage();
  const { cancel: cancelSub, isLoading: isCancelling } = useCancelSubscription();
  const { renew, isLoading: isRenewing } = useRenewSubscription();

  // Gói đang được chọn để xem chi tiết ở panel "Thông tin gói" (= gói mở modal).
  const selectedPackage = selectedPackageForModal;

  const handleRenew = async (item: LongTermSubscription) => {
    if (!window.confirm(`Gia hạn gói "${item.package.name}" cho biển ${item.plateNumber}? Phí sẽ trừ từ ví.`)) return;
    setMessage(null);
    try {
      await renew(item._id);
      await refreshSubscriptions();
      setMessage({ type: 'success', text: 'Gia hạn thành công.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gia hạn thất bại' });
    }
  };

  const [cancellingSub, setCancellingSub] = useState<LongTermSubscription | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('change_slot');
  const [cancelNote, setCancelNote] = useState<string>('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  const user = useMemo(() => {
    if (!session) return null;
    return {
      userId: session.userId,
      fullName: session.displayName,
      licensePlates: session.licensePlates || [],
    };
  }, [session]);

  // Reset message after some time
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSelectPackage = (pkg: LongTermPackage) => {
    setSelectedPackageForModal(pkg);
  };

  const handleModalSubmit = async (data: {
    buildingId: string;
    plateNumber: string;
    startDate: string;
    slotId?: string;
    paymentMethod: LongTermPaymentMethod;
  }) => {
    setMessage(null);

    if (!selectedPackageForModal) {
      setMessage({ type: 'error', text: 'Gói không được chọn' });
      return;
    }

    try {
      await subscribe({
        packageId: selectedPackageForModal._id,
        linkedPlates: [data.plateNumber],
        slotId: data.slotId,
        startDate: data.startDate,
      });

      await refreshSubscriptions();
      setMessage({
        type: 'success',
        text: `Đăng ký thành công ${selectedPackageForModal.name} cho biển số ${data.plateNumber}${data.slotId ? ' (kèm chỗ đỗ cố định)' : ''}.`,
      });
      setSelectedPackageForModal(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi khi đăng ký gói';
      setMessage({ type: 'error', text: errorMsg });
    }
  };

  // Sort packages by durationDays
  const sortedPackages = useMemo(() => {
    return [...packages].sort((a, b) => a.durationDays - b.durationDays);
  }, [packages]);

  // Filter to show week, month, and year packages (or first 3)
  const displayPackages = useMemo(() => {
    if (sortedPackages.length === 0) return [];
    
    // Try to find packages with 7, 30, and 365 days
    const week = sortedPackages.find(p => p.durationDays <= 7);
    const month = sortedPackages.find(p => p.durationDays >= 25 && p.durationDays <= 35);
    const year = sortedPackages.find(p => p.durationDays >= 360);

    if (week && month && year) {
      return [week, month, year];
    }

    // Fallback: return first 3 packages
    return sortedPackages.slice(0, 3);
  }, [sortedPackages]);

  // Guard sau khi đã gọi hết hooks (rules-of-hooks: không return sớm trước hook).
  if (!session || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-wider text-orange-300 hover:border-orange-400/50"
          >
            <ArrowLeft size={14} />
            Trang chủ
          </button>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-300">FR-USR-05</p>
          <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">
            Đăng ký gói dài hạn
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-400">
            Chọn gói phù hợp với nhu cầu của bạn
          </p>
        </motion.div>

        {/* Message */}
        {message ? (
          <div
            className={`mb-6 flex items-center gap-2 rounded-2xl border p-4 text-sm font-semibold ${
              message.type === 'success'
                ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                : 'border-rose-400/30 bg-rose-500/10 text-rose-300'
            }`}
          >
            <CheckCircle2 size={18} />
            {message.text}
          </div>
        ) : null}

        {/* Loading State */}
        {isLoadingPackages ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-12 text-center">
            <Loader2 size={32} className="animate-spin mx-auto text-orange-300 mb-4" />
            <p className="text-slate-400">Đang tải các gói...</p>
          </div>
        ) : packagesError ? (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6 text-center">
            <p className="text-rose-300 font-semibold">Lỗi: {packagesError.message}</p>
          </div>
        ) : displayPackages.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-12 text-center">
            <p className="text-slate-400">Không có gói nào khả dụng</p>
          </div>
        ) : (
          <>
            {/* Package Cards Grid */}
            <div className="grid gap-6 md:grid-cols-3 mb-12">
              {displayPackages.map((pkg) => (
                <PackageCard
                  key={pkg._id}
                  package={pkg}
                  onSelect={handleSelectPackage}
                  isLoading={isSubmitting}
                />
              ))}
            </div>

            {/* Current Subscriptions */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
              <h2 className="text-lg font-bold text-white mb-4">
                Gói đang sử dụng ({subscriptions.length})
              </h2>

              {isLoadingSubscriptions ? (
                <div className="rounded-lg border border-white/10 bg-slate-950/60 p-4 text-center">
                  <Loader2 size={16} className="animate-spin mx-auto text-orange-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-400">Đang tải...</p>
                </div>
              ) : null}

            </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/55 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
                  <Building2 size={16} className="text-cyan-300" />
                  Gói đang đăng ký
                </h2>
                <span className="rounded-full bg-slate-950 px-2 py-1 text-[11px] font-bold text-slate-400">
                  {subscriptions.length}
                </span>
              </div>

              <div className="space-y-3">
                {isLoadingSubscriptions ? (
                  <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-center">
                    <Loader2 size={16} className="animate-spin mx-auto text-orange-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-400">Đang tải dữ liệu...</p>
                  </div>
                ) : subscriptionsError ? (
                  <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-center">
                    <p className="text-xs font-semibold text-rose-300">{subscriptionsError.message}</p>
                  </div>
                ) : subscriptions.length > 0 ? (
                  subscriptions.map((item) => {
                    const now = new Date();
                    const startDate = new Date(item.startDate);
                    const diffMs = now.getTime() - startDate.getTime();
                    const diffDays = diffMs / (1000 * 60 * 60 * 24);
                    const isPendingOrActive = item.status === 'active' || item.status === 'pending';
                    const canCancel = isPendingOrActive && (now <= startDate || diffDays <= 3);

                    return (
                      <div key={item._id} className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-black text-orange-300">{item.package.name}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                            item.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : item.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : item.status === 'cancelled'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}>
                            {item.status === 'active' ? 'Hoạt động' : item.status === 'pending' ? 'Chờ kích hoạt' : item.status === 'cancelled' ? 'Đã hủy' : 'Hết hạn'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-slate-300">
                          {item.plateNumber ?? item.linkedPlates?.join(', ') ?? '—'} • {item.package.code}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {formatDate(item.startDate)} - {formatDate(item.endDate)}
                        </p>
                        <p className="mt-1 text-[11px] font-black text-cyan-300">
                          {formatMoney(item.price ?? item.package.price)}
                        </p>

                        {/* Dedicated Slot info if exists */}
                        {item.slot && (
                          <p className="mt-1 text-[10px] text-slate-400">
                            Ô đỗ: <span className="font-bold text-slate-200">{item.slot.code}</span>
                            {item.slot.floor && typeof item.slot.floor === 'object' && (item.slot.floor.name || item.slot.floor.code) ? (
                              <span> · {item.slot.floor.name || item.slot.floor.code}</span>
                            ) : null}
                            {item.slotReleased ? <span className="text-rose-300"> (đã thu hồi)</span> : null}
                          </p>
                        )}
                        {typeof item.package.maxHoursPerDay === 'number' && item.package.maxHoursPerDay > 0 && (
                          <p className="mt-1 text-[10px] text-slate-400">
                            Giờ miễn phí: <span className="font-bold text-slate-200">{item.package.maxHoursPerDay}h/ngày</span>
                          </p>
                        )}
                        {item.status === 'expired' && (
                          <p className="mt-2 text-[10px] text-amber-400/90 leading-relaxed border-t border-white/5 pt-1.5">
                            Gói đã hết hạn — đang tính phí theo giờ. Gia hạn để giữ chỗ cố định.
                          </p>
                        )}

                        {/* Gia hạn: cho gói đang hoạt động, hoặc vừa hết hạn còn giữ slot (grace). */}
                        {(item.status === 'active' || (item.status === 'expired' && item.slot && !item.slotReleased)) && (
                          <button
                            type="button"
                            disabled={isRenewing}
                            onClick={() => handleRenew(item)}
                            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-emerald-300 transition-all active:scale-95 disabled:opacity-60"
                          >
                            <RefreshCw size={12} /> {isRenewing ? 'Đang gia hạn...' : 'Gia hạn'}
                          </button>
                        )}

                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => setCancellingSub(item)}
                            className="mt-2 w-full rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-rose-400 transition-all active:scale-95"
                          >
                            Hủy gói
                          </button>
                        )}

                        {isPendingOrActive && !canCancel && (
                          <p className="mt-2 text-[10px] text-slate-400/80 italic leading-relaxed border-t border-white/5 pt-1.5">
                            Quá thời hạn tự hủy (3 ngày). Vui lòng liên hệ Admin để hỗ trợ.
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-center text-xs font-semibold text-slate-500">
                    Chưa có đăng ký gói dài hạn.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/55 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
                  <ReceiptText size={16} className="text-emerald-300" />
                  Thông tin gói
                </h2>
              </div>

              {selectedPackage ? (
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 space-y-2">
                  <p className="text-sm font-black text-emerald-300">{selectedPackage.name}</p>
                  <p className="text-xs font-semibold text-slate-300">
                    Mã: <span className="text-white">{selectedPackage.code}</span>
                  </p>
                  <p className="text-xs font-semibold text-slate-300">
                    Thời hạn: <span className="text-white">{selectedPackage.durationDays} ngày</span>
                  </p>
                  <p className="text-xs font-semibold text-slate-300">
                    Giá: <span className="text-orange-300 font-black">{formatMoney(selectedPackage.price)}</span>
                  </p>
                  {selectedPackage.maxVehicles && (
                    <p className="text-xs font-semibold text-slate-300">
                      Số phương tiện: <span className="text-white">{selectedPackage.maxVehicles}</span>
                    </p>
                  )}
                  {selectedPackage.description && (
                    <p className="text-xs text-slate-400 mt-2">{selectedPackage.description}</p>
                  )}
                  <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-bold text-cyan-300">
                    <CheckCircle2 size={11} /> Có chỗ đỗ dành riêng
                  </p>
                  {(selectedPackage.benefits?.length ?? 0) > 0 && (
                    <div className="mt-2 border-t border-white/10 pt-2">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">Ưu đãi</p>
                      <ul className="space-y-1">
                        {selectedPackage.benefits!.map((b, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                            <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-400" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="rounded-lg border border-white/10 bg-slate-950/60 p-4 text-center text-xs font-semibold text-slate-500">
                  Chưa có gói đang sử dụng
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>

      {cancellingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-lg font-black text-white">Xác nhận hủy gói dài hạn</h3>
              <p className="text-xs text-slate-400 mt-1">Gói: {cancellingSub.package.name} ({cancellingSub.package.code})</p>
            </div>

            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 space-y-2 text-xs font-semibold text-rose-300">
              <p>
                Gói dài hạn này sẽ được hủy. Bạn sẽ được hoàn lại 95% giá gói (tương đương{' '}
                <span className="font-black text-rose-400">
                  {formatMoney((cancellingSub.price ?? cancellingSub.package.price) * 0.95)}
                </span>
                ) vào ví cá nhân.
              </p>
              <p className="text-[10px] text-rose-300/80 italic">
                (*) Hệ thống khấu trừ 5% phí hủy gói, bao gồm: phí dịch vụ tiện ích, phí quản lý hệ thống và chi phí vận hành bãi đỗ.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase text-slate-400 block mb-2">Lý do hủy</span>
                <div className="space-y-2">
                  {[
                    { value: 'change_slot', label: '🚗 Đổi sang chỗ đỗ khác' },
                    { value: 'change_vehicle', label: '🔄 Thay đổi phương tiện / biển số xe' },
                    { value: 'no_longer_needed', label: '🏢 Không còn nhu cầu đỗ xe ở đây' },
                    { value: 'pricing_issue', label: '💸 Giá gói không còn phù hợp' },
                    { value: 'other', label: '⚠️ Lý do khác' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                        cancelReason === opt.value
                          ? 'border-orange-500/50 bg-orange-500/5 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.05)]'
                          : 'border-white/5 bg-slate-950/40 text-slate-400 hover:bg-slate-950/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cancelReason"
                        value={opt.value}
                        checked={cancelReason === opt.value}
                        onChange={(e) => {
                          setCancelReason(e.target.value);
                          if (e.target.value !== 'other') {
                            setCancelNote('');
                          }
                        }}
                        className="accent-orange-500"
                      />
                      <span className="text-xs font-bold">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold uppercase text-slate-400 block mb-1">
                  Ghi chú chi tiết {cancelReason === 'other' && <span className="text-rose-400">*</span>}
                </span>
                <textarea
                  value={cancelNote}
                  onChange={(e) => setCancelNote(e.target.value)}
                  placeholder={
                    cancelReason === 'other'
                      ? 'Vui lòng nhập lý do hủy chi tiết tại đây (bắt buộc)...'
                      : 'Nhập ghi chú thêm nếu có...'
                  }
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-orange-400/60 placeholder-slate-600 resize-none"
                />
              </div>
            </div>

            {cancelError && (
              <p className="text-xs font-bold text-rose-400 bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-xl">
                {cancelError}
              </p>
            )}

            <div className="flex items-center gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setCancellingSub(null);
                  setCancelReason('change_slot');
                  setCancelNote('');
                  setCancelError(null);
                }}
                disabled={isCancelling}
                className="px-4 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-white transition-all active:scale-95 disabled:opacity-50"
              >
                Quay lại
              </button>
              <button
                type="button"
                disabled={isCancelling || (cancelReason === 'other' && !cancelNote.trim())}
                onClick={async () => {
                  setCancelError(null);
                  try {
                    await cancelSub(cancellingSub._id, cancelReason, cancelNote);
                    await refreshSubscriptions();
                    setMessage({
                      type: 'success',
                      text: 'Hủy gói dài hạn thành công! Số tiền hoàn lại (95%) đã được cộng vào ví tài khoản.',
                    });
                    setCancellingSub(null);
                    setCancelReason('change_slot');
                    setCancelNote('');
                  } catch (err) {
                    setCancelError(err instanceof Error ? err.message : 'Lỗi khi hủy gói dài hạn.');
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-black uppercase tracking-wider text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCancelling ? (
                  <>
                    <Loader2 size={12} className="animate-spin animate-spin-reverse mr-2" />
                    Đang xử lý...
                  </>
                ) : (
                  'Xác nhận hủy'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <PackageSelectModal
        isOpen={!!selectedPackageForModal}
        onClose={() => setSelectedPackageForModal(null)}
        package={selectedPackageForModal}
        buildings={buildings}
        userPlates={user.licensePlates}
        onSubmit={handleModalSubmit}
        isSubmitting={isSubmitting}
      />
    </main>
  );
}
