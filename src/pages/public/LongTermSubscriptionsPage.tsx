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
import { useBuildings, useLongTermPackages, useLongTermSubscriptions, useSubscribeToPackage, useCancelSubscription } from '@/hooks/user';
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
  const { cancel: cancelSub, isLoading: isCancelling } = useCancelSubscription();

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
                            Ô đỗ: <span className="font-bold text-slate-200">{item.slot.code}</span> (Tầng {item.slot.floor})
                          </p>
                        )}

                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => setCancellingSub(item)}
                            className="mt-3 w-full rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-rose-400 transition-all active:scale-95"
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
                <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-center">
                  <p className="text-xs font-semibold text-slate-500">Chọn gói để xem thông tin chi tiết</p>
                </div>
              )}
            </div>
          </div>
        </div>
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
    </main>
  );
}
