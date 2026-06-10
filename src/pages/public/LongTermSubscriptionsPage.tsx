import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBuildings, useLongTermPackages, useLongTermSubscriptions, useSubscribeToPackage } from '@/hooks/user';
import type { LongTermPackage, LongTermPaymentMethod, LongTermSubscription } from '@/services/user/userApi';
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

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Phương thức thanh toán
            </label>
            <CustomSelect
              value={paymentMethod}
              onChange={(val) => setPaymentMethod(val as LongTermPaymentMethod)}
              options={[
                { value: 'wallet', label: 'Ví PBMS' },
                { value: 'qr', label: 'QR Banking (PayOS)' },
              ]}
              placeholder="Chọn phương thức"
            />
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
    refresh: refreshSubscriptions,
  } = useLongTermSubscriptions();

  const { subscribe, isLoading: isSubmitting } = useSubscribeToPackage();

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

  if (!session || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  const handleSelectPackage = (pkg: LongTermPackage) => {
    setSelectedPackageForModal(pkg);
  };

  const handleModalSubmit = async (data: {
    buildingId: string;
    plateNumber: string;
    startDate: string;
    paymentMethod: LongTermPaymentMethod;
  }) => {
    setMessage(null);

    if (!selectedPackageForModal) {
      setMessage({ type: 'error', text: 'Gói không được chọn' });
      return;
    }

    try {
      const result = await subscribe({
        packageId: selectedPackageForModal._id,
        linkedPlates: [data.plateNumber],
        paymentMethod: data.paymentMethod,
      });

      // If result has checkoutUrl and paymentMethod is 'qr', redirect to PayOS
      if (data.paymentMethod === 'qr' && result && (result as any).checkoutUrl) {
        window.location.href = (result as any).checkoutUrl;
      } else {
        await refreshSubscriptions();
        setMessage({
          type: 'success',
          text: `Đăng ký thành công ${selectedPackageForModal.name} cho biển số ${data.plateNumber}.`,
        });
        setSelectedPackageForModal(null);
      }
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
              ) : subscriptions.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {subscriptions.map((sub) => (
                    <div
                      key={sub._id}
                      className="rounded-lg border border-white/10 bg-slate-950/60 p-4"
                    >
                      <p className="text-sm font-bold text-orange-300">{sub.package.name}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-300">
                        {sub.plateNumber} • {sub.package.code}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {formatDate(sub.startDate)} - {formatDate(sub.endDate)}
                      </p>
                      <p className="mt-2 text-xs font-bold text-cyan-300">
                        {formatMoney(sub.price ?? sub.package.price)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-white/10 bg-slate-950/60 p-4 text-center text-xs font-semibold text-slate-500">
                  Chưa có gói đang sử dụng
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      <PackageSelectModal
        isOpen={selectedPackageForModal !== null}
        onClose={() => setSelectedPackageForModal(null)}
        package={selectedPackageForModal}
        buildings={buildings}
        userPlates={user?.licensePlates || []}
        onSubmit={handleModalSubmit}
        isSubmitting={isSubmitting}
      />
    </main>
  );
}
