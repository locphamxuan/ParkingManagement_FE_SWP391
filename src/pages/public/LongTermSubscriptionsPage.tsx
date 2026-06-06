import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  CalendarRange,
  CheckCircle2,
  CreditCard,
  ReceiptText,
  User,
  Loader2,
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

export default function LongTermSubscriptionsPage() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const { items: buildings, isLoading: isLoadingBuildings } = useBuildings();

  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [selectedPlate, setSelectedPlate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [startDate, setStartDate] = useState(todayDateInputValue());
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // API Hooks for packages and subscriptions
  const {
    items: packages,
    isLoading: isLoadingPackages,
    error: packagesError,
  } = useLongTermPackages(selectedBuildingId ? { buildingId: selectedBuildingId } : undefined);

  const {
    items: subscriptions,
    isLoading: isLoadingSubscriptions,
    error: subscriptionsError,
    refresh: refreshSubscriptions,
  } = useLongTermSubscriptions();

  const { subscribe, isLoading: isSubmitting, error: subscribeError } = useSubscribeToPackage();

  const user = useMemo(() => {
    if (!session) return null;
    return {
      userId: session.userId,
      fullName: session.displayName,
      licensePlates: session.licensePlates || [],
    };
  }, [session]);

  useEffect(() => {
    if (buildings.length > 0 && !selectedBuildingId) {
      setSelectedBuildingId(buildings[0]._id);
    }
  }, [buildings, selectedBuildingId]);

  const selectedBuilding = useMemo(
    () => buildings.find((item) => item._id === selectedBuildingId) || null,
    [buildings, selectedBuildingId],
  );

  const selectedPackage = useMemo(
    () => packages.find((item) => item._id === selectedPackageId) || null,
    [packages, selectedPackageId],
  );

  const compatiblePlates = useMemo(() => {
    return (user?.licensePlates || []).filter((plate) => {
      if (!selectedPackage) return true;
      // If package has maxVehicles, check if plate fits
      return true; // Simplified for now
    });
  }, [selectedPackage, user?.licensePlates]);

  useEffect(() => {
    setSelectedPlate((current) =>
      compatiblePlates.some((plate) => plate.plateNumber === current)
        ? current
        : compatiblePlates[0]?.plateNumber || '',
    );
  }, [compatiblePlates]);

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (!selectedBuilding || !selectedPackage) {
      setMessage({ type: 'error', text: 'Vui lòng chọn tòa nhà và gói đăng ký.' });
      return;
    }
    if (!selectedPlate) {
      setMessage({ type: 'error', text: 'Vui lòng chọn biển số xe để đăng ký gói.' });
      return;
    }

    try {
      await subscribe({
        packageId: selectedPackage._id,
        linkedPlates: [selectedPlate],
        paymentMethod: paymentMethod as 'wallet' | 'card' | 'cash',
      });

      await refreshSubscriptions();
      setMessage({
        type: 'success',
        text: `Đăng ký thành công ${selectedPackage.name} cho biển số ${selectedPlate}.`,
      });

      // Reset form
      setSelectedPackageId('');
      setSelectedPlate('');
      setStartDate(todayDateInputValue());
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Không thể đăng ký gói dài hạn.';
      setMessage({ type: 'error', text: errorMsg });
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 p-4"
        >
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-wider text-orange-300"
          >
            <ArrowLeft size={14} />
            Trang chủ
          </button>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-wider text-orange-300"
          >
            <User size={14} />
            Hồ sơ
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-3xl border border-white/10 bg-slate-900/50 p-6"
        >
          <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-300">FR-USR-05</p>
          <h1 className="mt-2 text-2xl font-black text-white md:text-3xl">
            Đăng ký gói dài hạn
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-400">
            Chọn gói, thanh toán và đăng ký biển số xe theo tòa nhà.
          </p>
        </motion.div>

        {message ? (
          <div
            className={`mb-4 flex items-center gap-2 rounded-2xl border p-3 text-sm font-semibold ${
              message.type === 'success'
                ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                : 'border-rose-400/30 bg-rose-500/10 text-rose-300'
            }`}
          >
            <CheckCircle2 size={16} />
            {message.text}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-white/10 bg-slate-900/55 p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <CalendarRange size={18} className="text-orange-300" />
              <h2 className="text-sm font-black uppercase tracking-wider text-white">Form đăng ký</h2>
            </div>

            <div className="space-y-4">
              <div className="block">
                <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Tòa nhà</span>
                <CustomSelect
                  value={selectedBuildingId}
                  onChange={setSelectedBuildingId}
                  options={[
                    { value: '', label: '-- Chọn tòa nhà --' },
                    ...buildings.map((building) => ({
                      value: building._id,
                      label: building.name,
                    })),
                  ]}
                  placeholder="-- Chọn tòa nhà --"
                />
              </div>

              <div className="block">
                <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Gói dài hạn</span>
                {isLoadingPackages ? (
                  <div className="h-11 flex items-center justify-center rounded-xl border border-white/10 bg-slate-950 text-slate-400 text-xs">
                    <Loader2 size={14} className="animate-spin mr-2" />
                    Đang tải...
                  </div>
                ) : packagesError ? (
                  <div className="h-11 flex items-center justify-center rounded-xl border border-rose-400/30 bg-rose-500/10 text-rose-300 text-xs">
                    Lỗi: {packagesError.message}
                  </div>
                ) : (
                  <CustomSelect
                    value={selectedPackageId}
                    onChange={setSelectedPackageId}
                    options={[
                      { value: '', label: '-- Chọn gói --' },
                      ...packages.map((item) => ({
                        value: item._id,
                        label: `${item.name} (${item.durationDays} ngày) - ${formatMoney(item.price)}`,
                      })),
                    ]}
                    placeholder="-- Chọn gói --"
                  />
                )}
              </div>

              <div className="block">
                <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Biển số đăng ký</span>
                <CustomSelect
                  value={selectedPlate}
                  onChange={setSelectedPlate}
                  options={[
                    { value: '', label: '-- Chọn biển số --' },
                    ...compatiblePlates.map((plate) => ({
                      value: plate.plateNumber,
                      label: `${plate.plateNumber} (${plate.vehicleType === 'car' ? 'Ô tô' : 'Xe máy'})`,
                    })),
                  ]}
                  placeholder="-- Chọn biển số --"
                />
              </div>

              <label className="block">
                <span className="text-xs font-bold uppercase text-slate-400">Ngày bắt đầu</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-semibold text-white outline-none focus:border-orange-400/60"
                />
              </label>

              <div className="block">
                <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Phương thức thanh toán</span>
                <CustomSelect
                  value={paymentMethod}
                  onChange={(val) => setPaymentMethod(val as LongTermPaymentMethod)}
                  options={[
                    { value: 'wallet', label: 'Ví PBMS' },
                    { value: 'qr', label: 'QR Banking' },
                  ]}
                  placeholder="Chọn phương thức thanh toán"
                />
              </div>

              {selectedPackage ? (
                <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-xs font-semibold text-slate-300">
                  <p className="font-black text-white">{selectedPackage.name}</p>
                  <p className="mt-1">Mã gói: {selectedPackage.code}</p>
                  <p className="mt-1">Thời hạn: {selectedPackage.durationDays} ngày</p>
                  <p className="mt-1 text-orange-300">Chi phí: {formatMoney(selectedPackage.price)}</p>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting || isLoadingPackages || isLoadingBuildings}
                className="h-11 w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-sm font-black uppercase tracking-wider text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="inline animate-spin mr-2" />
                    Đang xử lý...
                  </>
                ) : (
                  'Đăng ký gói'
                )}
              </button>
            </div>
          </form>

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
                  subscriptions.map((item) => (
                    <div key={item._id} className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                      <p className="text-xs font-black text-orange-300">{item.package.name}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-300">
                        {item.plateNumber ?? item.linkedPlates?.join(', ') ?? '—'} • {item.package.code}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {formatDate(item.startDate)} - {formatDate(item.endDate)}
                      </p>
                      <p className="mt-1 text-[11px] font-black text-cyan-300">
                        {formatMoney(item.price ?? item.package.price)}
                      </p>
                    </div>
                  ))
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
                  {selectedPackage.allowDedicatedSlot && (
                    <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-bold text-cyan-300">
                      <CheckCircle2 size={11} /> Có chỗ đỗ dành riêng
                    </p>
                  )}
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
                <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-center">
                  <p className="text-xs font-semibold text-slate-500">Chọn gói để xem thông tin chi tiết</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
