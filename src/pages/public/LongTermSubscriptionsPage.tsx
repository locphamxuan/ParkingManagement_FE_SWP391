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
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { listUserBuildingViews, type UserBuildingView } from '@/pages/User/mockBuildingsData';
import {
  createLongTermSubscription,
  listLongTermPackages,
  listUserLongTermPayments,
  listUserLongTermSubscriptions,
  type LongTermPaymentMethod,
  type UserLongTermPackage,
  type UserLongTermPayment,
  type UserLongTermSubscription,
} from '@/pages/User/mockLongTermSubscriptionsData';
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

  const [buildings, setBuildings] = useState<UserBuildingView[]>([]);
  const [packages, setPackages] = useState<UserLongTermPackage[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserLongTermSubscription[]>([]);
  const [payments, setPayments] = useState<UserLongTermPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [selectedPlate, setSelectedPlate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<LongTermPaymentMethod>('wallet');
  const [startDate, setStartDate] = useState(todayDateInputValue());
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const user = useMemo(() => {
    if (!session) return null;
    return {
      userId: session.userId,
      fullName: session.displayName,
      licensePlates: session.licensePlates || [],
    };
  }, [session]);

  useEffect(() => {
    let ignore = false;

    async function loadBaseData() {
      setIsLoading(true);
      const buildingRows = await listUserBuildingViews();
      if (ignore) return;
      setBuildings(buildingRows);

      const firstBuildingId = buildingRows[0]?.building._id || '';
      setSelectedBuildingId(firstBuildingId);
      setIsLoading(false);
    }

    loadBaseData();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadPackages() {
      if (!selectedBuildingId) {
        setPackages([]);
        setSelectedPackageId('');
        return;
      }

      const packageRows = await listLongTermPackages(selectedBuildingId);
      if (ignore) return;

      setPackages(packageRows);
      setSelectedPackageId((current) =>
        packageRows.some((item) => item._id === current) ? current : packageRows[0]?._id || '',
      );
    }

    loadPackages();
    return () => {
      ignore = true;
    };
  }, [selectedBuildingId]);

  const refreshUserData = async () => {
    if (!user?.userId) return;
    const [subscriptionRows, paymentRows] = await Promise.all([
      listUserLongTermSubscriptions(user.userId),
      listUserLongTermPayments(user.userId),
    ]);
    setSubscriptions(subscriptionRows);
    setPayments(paymentRows);
  };

  useEffect(() => {
    if (!user?.userId) return;
    refreshUserData();
  }, [user?.userId]);

  const selectedBuilding = useMemo(
    () => buildings.find((item) => item.building._id === selectedBuildingId) || null,
    [buildings, selectedBuildingId],
  );

  const selectedPackage = useMemo(
    () => packages.find((item) => item._id === selectedPackageId) || null,
    [packages, selectedPackageId],
  );

  const compatiblePlates = useMemo(() => {
    if (!selectedPackage) return user?.licensePlates || [];
    if (selectedPackage.vehicleType === 'all') return user?.licensePlates || [];
    return (user?.licensePlates || []).filter(
      (plate) => plate.vehicleType === selectedPackage.vehicleType,
    );
  }, [selectedPackage, user?.licensePlates]);

  useEffect(() => {
    setSelectedPlate((current) =>
      compatiblePlates.some((plate) => plate.plateNumber === current)
        ? current
        : compatiblePlates[0]?.plateNumber || '',
    );
  }, [compatiblePlates]);

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

    const plate = user.licensePlates.find((item) => item.plateNumber === selectedPlate);
    if (!plate) {
      setMessage({ type: 'error', text: 'Biển số xe không hợp lệ.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createLongTermSubscription({
        userId: user.userId,
        buildingId: selectedBuilding.building._id,
        buildingName: selectedBuilding.building.name,
        packageId: selectedPackage._id,
        plateNumber: selectedPlate,
        vehicleType: plate.vehicleType,
        paymentMethod,
        startDate,
      });

      await refreshUserData();
      setMessage({
        type: 'success',
        text: `Đăng ký thành công ${created.packageName} cho biển số ${created.plateNumber}.`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Không thể đăng ký gói dài hạn.',
      });
    } finally {
      setIsSubmitting(false);
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
                    ...buildings.map((row) => ({
                      value: row.building._id,
                      label: row.building.name,
                    })),
                  ]}
                  placeholder="-- Chọn tòa nhà --"
                />
              </div>

              <div className="block">
                <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Gói dài hạn</span>
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
                disabled={isSubmitting || isLoading}
                className="h-11 w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-sm font-black uppercase tracking-wider text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Đăng ký gói'}
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
                {subscriptions.length > 0 ? (
                  subscriptions.map((item) => (
                    <div key={item._id} className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                      <p className="text-xs font-black text-orange-300">{item.packageName}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-300">
                        {item.plateNumber} • {item.packageCode}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {formatDate(item.startDate)} - {formatDate(item.endDate)}
                      </p>
                      <p className="mt-1 text-[11px] font-black text-cyan-300">
                        {formatMoney(item.price)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-center text-xs font-semibold text-slate-500">
                    {isLoading ? 'Đang tải...' : 'Chưa có đăng ký gói dài hạn.'}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/55 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
                  <ReceiptText size={16} className="text-emerald-300" />
                  Lịch sử thanh toán
                </h2>
                <span className="rounded-full bg-slate-950 px-2 py-1 text-[11px] font-bold text-slate-400">
                  {payments.length}
                </span>
              </div>

              <div className="space-y-3">
                {payments.length > 0 ? (
                  payments.map((item) => (
                    <div key={item.id} className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                      <p className="flex items-center gap-2 text-xs font-black text-white">
                        <CreditCard size={13} className="text-orange-300" />
                        {formatMoney(item.amount)}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-slate-400">{item.note}</p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {item.method === 'wallet' ? 'Ví PBMS' : 'QR Banking'} •{' '}
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-center text-xs font-semibold text-slate-500">
                    {isLoading ? 'Đang tải...' : 'Chưa có thanh toán gói dài hạn.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
