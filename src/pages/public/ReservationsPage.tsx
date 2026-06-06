import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  DollarSign,
  MapPin,
  User,
  WalletCards,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { userApi, type Building, type ReservationEstimate } from '@/services/user/userApi';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const fmtMoney = (n: number | undefined | null) => (n != null ? money.format(n) : '—');

function toLocalDatetimeValue(date: Date): string {
  const off = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - off).toISOString().slice(0, 16);
}

export default function ReservationsPage() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(true);

  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [vehicleTypes, setVehicleTypes] = useState<{ _id: string; code: string; name: string }[]>([]);
  const [selectedVehicleTypeId, setSelectedVehicleTypeId] = useState('');
  const [selectedPlate, setSelectedPlate] = useState('');
  const [startTime, setStartTime] = useState(() => toLocalDatetimeValue(new Date(Date.now() + 30 * 60_000)));
  const [endTime, setEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [estimate, setEstimate] = useState<ReservationEstimate | null>(null);
  const [estimating, setEstimating] = useState(false);

  useEffect(() => {
    setIsLoadingBuildings(true);
    userApi.buildings
      .list({ limit: 100 })
      .then((res) => {
        const list = (res as { data?: { items?: Building[] } })?.data?.items ?? [];
        setBuildings(list);
        if (list.length > 0 && !selectedBuildingId) setSelectedBuildingId(list[0]._id);
      })
      .catch(() => undefined)
      .finally(() => setIsLoadingBuildings(false));
  }, []);

  useEffect(() => {
    if (!selectedBuildingId) return;
    userApi.buildings
      .vehicleTypes(selectedBuildingId)
      .then((res) => {
        const vts = (res as { data?: { items?: { _id: string; code: string; name: string }[] } })?.data?.items ?? [];
        setVehicleTypes(vts);
        if (vts.length > 0) setSelectedVehicleTypeId(vts[0]._id);
        else setSelectedVehicleTypeId('');
      })
      .catch(() => undefined);
  }, [selectedBuildingId]);

  useEffect(() => {
    const plates = session?.licensePlates || [];
    const def = plates.find((p: { isDefault?: boolean }) => p.isDefault) || plates[0];
    if (def && !selectedPlate) setSelectedPlate((def as { plateNumber: string }).plateNumber);
  }, [session?.licensePlates]);

  // Estimate the fee + 15% deposit whenever the booking window is fully specified.
  useEffect(() => {
    if (!selectedBuildingId || !selectedVehicleTypeId || !startTime || !endTime) {
      setEstimate(null);
      return;
    }
    if (new Date(endTime) <= new Date(startTime)) {
      setEstimate(null);
      return;
    }
    let cancelled = false;
    setEstimating(true);
    userApi.reservations
      .estimate({
        buildingId: selectedBuildingId,
        vehicleTypeId: selectedVehicleTypeId,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      })
      .then((res) => {
        if (cancelled) return;
        setEstimate((res as { data?: ReservationEstimate })?.data ?? null);
      })
      .catch(() => {
        if (!cancelled) setEstimate(null);
      })
      .finally(() => {
        if (!cancelled) setEstimating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedBuildingId, selectedVehicleTypeId, startTime, endTime]);

  if (!session) return <Navigate to="/auth/login" replace />;

  const licensePlates = session.licensePlates || [];

  const handleCreateReservation = async () => {
    setFormMessage(null);
    if (!selectedBuildingId || !selectedPlate || !startTime) {
      setFormMessage({ type: 'err', text: 'Vui lòng điền đầy đủ thông tin đặt chỗ.' });
      return;
    }
    // Backend requires an explicit checkout time to compute the 15% deposit.
    if (!endTime) {
      setFormMessage({ type: 'err', text: 'Vui lòng chọn thời gian kết thúc (giờ lấy xe).' });
      return;
    }
    if (new Date(endTime) <= new Date(startTime)) {
      setFormMessage({ type: 'err', text: 'Thời gian kết thúc phải sau thời gian bắt đầu.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await userApi.reservations.create({
        buildingId: selectedBuildingId,
        plateNumber: selectedPlate,
        vehicleTypeId: selectedVehicleTypeId || undefined,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      });
      const deposit = (res as { data?: { depositAmount?: number } })?.data?.depositAmount;
      setFormMessage({
        type: 'ok',
        text: deposit != null
          ? `Đặt chỗ thành công! Đã trừ tiền cọc ${fmtMoney(deposit)} (15%). Phần còn lại sẽ thu khi bạn rời bãi.`
          : 'Đặt chỗ thành công!',
      });
      setEndTime('');
      setEstimate(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Đặt chỗ thất bại.';
      setFormMessage({ type: 'err', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedBuilding = buildings.find((b) => b._id === selectedBuildingId);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070b16] text-slate-100">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(148,163,184,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.035)_1px,transparent_1px),linear-gradient(135deg,rgba(249,115,22,0.12),transparent_32%,rgba(34,211,238,0.08)_72%,transparent)] bg-[size:44px_44px,44px_44px,100%_100%]"
      />
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">

        {/* Nav */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-2xl backdrop-blur-xl"
        >
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2 text-xs font-black uppercase tracking-wider text-orange-300 transition hover:border-orange-400/40 hover:bg-orange-500/10"
          >
            <ArrowLeft size={14} /> Trang chủ
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/wallet')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-300 transition hover:border-emerald-400/40 hover:bg-emerald-500/10"
            >
              <WalletCards size={14} /> Ví
            </button>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2 text-xs font-black uppercase tracking-wider text-orange-300 transition hover:border-orange-400/40 hover:bg-orange-500/10"
            >
              <User size={14} /> Hồ sơ
            </button>
          </div>
        </motion.div>

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-300">Đặt chỗ trước</p>
          <h1 className="mt-1 text-2xl font-black text-white">Đặt chỗ mới</h1>
        </div>

        {/* Form */}
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-3xl border border-orange-300/20 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl"
          >
            <h2 className="mb-5 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-orange-200">
              <CalendarClock size={16} /> Thông tin đặt chỗ
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Tòa nhà */}
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Tòa nhà
                </label>
                {isLoadingBuildings ? (
                  <p className="text-sm text-slate-500">Đang tải...</p>
                ) : (
                  <select
                    value={selectedBuildingId}
                    onChange={(e) => setSelectedBuildingId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-400/50"
                  >
                    {buildings.map((b) => (
                      <option key={b._id} value={b._id}>{b.code} — {b.name}</option>
                    ))}
                  </select>
                )}
                {selectedBuilding?.address?.fullAddress && (
                  <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <MapPin size={11} /> {selectedBuilding.address.fullAddress}
                  </p>
                )}
                {selectedBuilding?.pricing?.hourlyRate != null && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    Giá: {fmtMoney(selectedBuilding.pricing.hourlyRate)}/giờ
                  </p>
                )}
              </div>

              {/* Loại xe */}
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Loại xe
                </label>
                <select
                  value={selectedVehicleTypeId}
                  onChange={(e) => setSelectedVehicleTypeId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-400/50"
                >
                  {vehicleTypes.map((vt) => (
                    <option key={vt._id} value={vt._id}>{vt.code} — {vt.name}</option>
                  ))}
                  {vehicleTypes.length === 0 && <option value="">Chưa có loại xe</option>}
                </select>
              </div>

              {/* Biển số */}
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Biển số xe
                </label>
                {licensePlates.length > 0 ? (
                  <select
                    value={selectedPlate}
                    onChange={(e) => setSelectedPlate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-400/50"
                  >
                    {licensePlates.map((p: { plateNumber: string; _id?: string }) => (
                      <option key={p._id ?? p.plateNumber} value={p.plateNumber}>{p.plateNumber}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={selectedPlate}
                    onChange={(e) => setSelectedPlate(e.target.value.toUpperCase())}
                    placeholder="Nhập biển số xe"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-400/50 placeholder-slate-500"
                  />
                )}
              </div>

              {/* Thời gian bắt đầu */}
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Thời gian bắt đầu <span className="text-rose-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  min={toLocalDatetimeValue(new Date())}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-400/50 [color-scheme:dark]"
                />
              </div>

              {/* Thời gian kết thúc (bắt buộc) */}
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Thời gian lấy xe (kết thúc) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  min={startTime || toLocalDatetimeValue(new Date())}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-400/50 [color-scheme:dark]"
                />
                <p className="mt-1 text-[11px] text-slate-600">
                  Phí tính theo thời gian thực (tối thiểu ~30 phút). Đặt cọc trước 15%, phần còn lại tự động thu khi bạn rời bãi.
                </p>
              </div>
            </div>

            {/* Tóm tắt chi phí — đặt cọc 15% */}
            {endTime && new Date(endTime) > new Date(startTime) && (
              <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-4">
                <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-200">
                  <DollarSign size={14} /> Tạm tính chi phí
                </p>
                {estimating ? (
                  <p className="text-sm text-slate-400">Đang tính phí...</p>
                ) : estimate ? (
                  <>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="rounded-xl border border-white/10 bg-slate-950/55 p-3">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tổng phí dự kiến</p>
                        <p className="mt-1 text-base font-black text-white">{fmtMoney(estimate.estimatedFee)}</p>
                      </div>
                      <div className="rounded-xl border border-orange-400/20 bg-orange-500/10 p-3">
                        <p className="text-[10px] font-black uppercase tracking-wider text-orange-300">Đặt cọc ngay (15%)</p>
                        <p className="mt-1 text-base font-black text-orange-200">{fmtMoney(estimate.depositAmount)}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-slate-950/55 p-3">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Còn lại khi rời bãi</p>
                        <p className="mt-1 text-base font-black text-emerald-300">{fmtMoney(estimate.remainingFee)}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">
                      {estimate.durationMinutes != null && (
                        <>Thời lượng: <span className="font-bold text-slate-200">{estimate.durationMinutes} phút</span> · </>
                      )}
                      Đơn giá {fmtMoney(estimate.hourlyRate)}/giờ, tính theo thời gian thực.
                      {estimate.minimumApplied ? ' (đã áp phí tối thiểu)' : ''}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Chưa thể tính phí cho khoảng thời gian này.</p>
                )}
              </div>
            )}

            {formMessage && (
              <div className={`mt-4 flex items-center gap-2 rounded-2xl border p-3 text-sm ${formMessage.type === 'ok' ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300' : 'border-rose-400/25 bg-rose-500/10 text-rose-300'}`}>
                {formMessage.type === 'ok' && <CheckCircle2 size={15} />}
                {formMessage.text}
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={handleCreateReservation}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-2.5 text-sm font-black text-slate-950 shadow-[0_8px_24px_rgba(249,115,22,0.22)] transition hover:brightness-110 disabled:opacity-60"
              >
                <CalendarClock size={15} />
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt chỗ'}
              </button>
            </div>
          </motion.div>
      </div>
    </main>
  );
}

