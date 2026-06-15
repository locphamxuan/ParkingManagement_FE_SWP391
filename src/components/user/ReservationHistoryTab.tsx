import { useState, useEffect, useCallback } from 'react';
import {
  CalendarClock,
  MapPin,
  Clock,
  Timer,
  RefreshCw,
  XCircle,
  Building2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Car,
  RefreshCw as RefreshIcon,
} from 'lucide-react';
import { userApi } from '@/services/user/userApi';
import type { Reservation, LongTermSubscription } from '@/services/user/userApi';
import { fmtMoney, fmtTime } from '@/pages/user/reservationsHelper';
import {
  packageStatusLabel,
  packageStatusBadgeClass,
  PACKAGE_STATUS_TABS,
} from '@/utils/packageStatus';

// Status đặt-theo-giờ (mode 'hourly'). Mode 'package' dùng util packageStatus dùng chung.
const HOURLY_LABELS: Record<string, string> = {
  pending: 'Chờ thanh toán',
  confirmed: 'Đã đặt',
  checked_in: 'Đang sử dụng',
  completed: 'Hoàn thành',
  expired: 'Hết hạn',
  cancelled: 'Đã hủy',
};
const HOURLY_COLORS: Record<string, string> = {
  pending: 'border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
  confirmed: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
  checked_in: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]',
  completed: 'border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)]',
  expired: 'border-slate-500/30 bg-slate-500/10 text-slate-400',
  cancelled: 'border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.1)]',
};

function StatusBadge({ status, mode = 'hourly' }: { status: string; mode?: 'hourly' | 'package' }) {
  const label = mode === 'package' ? packageStatusLabel(status) : HOURLY_LABELS[status] || status;
  const color =
    mode === 'package'
      ? packageStatusBadgeClass(status)
      : HOURLY_COLORS[status] || 'border-slate-500/30 bg-slate-500/10 text-slate-400';
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${color}`}
    >
      {label}
    </span>
  );
}

export function ReservationHistoryTab() {
  const [activeMode, setActiveMode] = useState<'hourly' | 'package'>('hourly');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [cancellingSub, setCancellingSub] = useState<LongTermSubscription | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('change_vehicle');
  const [cancelNote, setCancelNote] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const load = useCallback(
    (p = 1, mode = activeMode, status = statusFilter) => {
      setLoading(true);
      setError(null);
      if (mode === 'hourly') {
        userApi.reservations
          .list({ page: p, limit: 10, status: status === 'all' ? undefined : status })
          .then((res) => {
            const raw = (res as any)?.data;
            setItems(raw?.items ?? []);
            setTotalPages(raw?.pagination?.totalPages ?? 1);
            setPage(p);
          })
          .catch((err) => setError(err instanceof Error ? err.message : 'Tải lịch sử thất bại'))
          .finally(() => setLoading(false));
      } else {
        // Tab value = đúng status API của gói (active/expired/cancelled); 'all' = không lọc.
        const apiStatus = status === 'all' ? undefined : status;

        userApi.longTermSubscriptions
          .list({ page: p, limit: 10, status: apiStatus })
          .then((res) => {
            const raw = (res as any)?.data;
            setItems(raw?.items ?? []);
            setTotalPages(raw?.pagination?.totalPages ?? 1);
            setPage(p);
          })
          .catch((err) => setError(err instanceof Error ? err.message : 'Tải danh sách đăng ký gói thất bại'))
          .finally(() => setLoading(false));
      }
    },
    [activeMode, statusFilter]
  );

  useEffect(() => {
    load(1, activeMode, statusFilter);
  }, [load, activeMode, statusFilter]);

  const handleCancel = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn hủy đặt chỗ này?')) return;
    setCancellingId(id);
    try {
      await userApi.reservations.cancel(id);
      setItems((prev) => prev.map((r) => (r._id === id ? { ...r, status: 'cancelled' } : r)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Hủy đặt chỗ thất bại');
    } finally {
      setCancellingId(null);
    }
  };

  const handleModeChange = (mode: 'hourly' | 'package') => {
    setActiveMode(mode);
    setStatusFilter('all');
    setItems([]);
    setPage(1);
    setTotalPages(1);
  };

  const filterTabs =
    activeMode === 'hourly'
      ? [
          { value: 'all', label: 'Tất cả' },
          { value: 'confirmed', label: 'Đã đặt' },
          { value: 'checked_in', label: 'Đang sử dụng' },
          { value: 'completed', label: 'Hoàn thành' },
          { value: 'cancelled', label: 'Đã hủy' },
          { value: 'expired', label: 'Hết hạn' },
        ]
      : PACKAGE_STATUS_TABS;

  const fmtDateOnly = (iso: string | undefined | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('vi-VN');
  };

  return (
    <div className="space-y-4">
      {/* Mode Switcher */}
      <div className="flex justify-center border-b border-white/5 pb-4">
        <div className="inline-flex rounded-xl bg-white/[0.02] p-1 border border-white/5 shadow-inner">
          <button
            type="button"
            onClick={() => handleModeChange('hourly')}
            className={`rounded-lg px-6 py-2 text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              activeMode === 'hourly'
                ? 'bg-orange-500 text-slate-950 shadow-[0_0_12px_rgba(249,115,22,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Đặt theo giờ
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('package')}
            className={`rounded-lg px-6 py-2 text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              activeMode === 'package'
                ? 'bg-orange-500 text-slate-950 shadow-[0_0_12px_rgba(249,115,22,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Đăng ký gói dài hạn
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div className="flex items-center gap-1.5 rounded-xl bg-white/[0.02] border border-white/5 p-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setStatusFilter(tab.value);
                load(1, activeMode, tab.value);
              }}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                statusFilter === tab.value
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => load(page)}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-all hover:bg-white/10"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Làm mới
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-400">Đang tải dữ liệu...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
          <CalendarClock size={32} className="mx-auto mb-3 text-slate-600 animate-pulse" />
          <p className="text-sm font-semibold text-slate-400">
            {activeMode === 'hourly'
              ? 'Bạn chưa có lịch sử đặt chỗ nào.'
              : 'Bạn chưa có đăng ký gói dài hạn nào.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
          {items.map((item) => {
            if (activeMode === 'hourly') {
              const r = item as Reservation;
              let statusColorClass = 'border-slate-500/20';
              if (r.status === 'completed') statusColorClass = 'border-l-blue-500/80';
              else if (r.status === 'cancelled') statusColorClass = 'border-l-rose-500/80';
              else if (r.status === 'checked_in') statusColorClass = 'border-l-cyan-500/80';
              else if (r.status === 'confirmed') statusColorClass = 'border-l-emerald-500/80';
              else if (r.status === 'pending') statusColorClass = 'border-l-amber-500/80';

              return (
                <div
                  key={r._id}
                  className={`relative rounded-2xl border-l-[3px] border-y border-r border-white/[0.05] bg-white/[0.01] p-4 transition-all duration-300 hover:border-r-white/10 hover:border-y-white/10 hover:bg-white/[0.03] hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] group ${statusColorClass}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-black text-orange-400 tracking-wider flex items-center gap-1">
                          <span className="text-slate-500 text-[10px]">ID:</span>
                          {r.code}
                        </span>
                        <span className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 text-xs font-bold text-amber-400 tracking-wide flex items-center gap-1 shadow-sm">
                          <Car size={12} className="opacity-80" />
                          {r.plateNumber}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs font-medium text-slate-400 flex items-center gap-1">
                        <Building2 size={12} className="text-slate-500" />
                        {(r.building as any)?.name ?? '—'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={r.status} />
                      {(r.status === 'pending' || r.status === 'confirmed') && (
                        <button
                          type="button"
                          disabled={cancellingId === r._id}
                          onClick={() => handleCancel(r._id)}
                          className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50 transition-all disabled:opacity-50"
                        >
                          <XCircle size={12} />
                          {cancellingId === r._id ? 'Đang hủy...' : 'Hủy'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5 border-t border-white/[0.03] pt-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Vị trí đỗ</p>
                      <p className="mt-1 text-sm font-bold text-slate-200">{(r.slot as any)?.code ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Bắt đầu</p>
                      <p className="mt-1 text-xs font-medium text-slate-300">{fmtTime(r.startTime)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Kết thúc</p>
                      <p className="mt-1 text-xs font-medium text-slate-300">{r.endTime ? fmtTime(r.endTime) : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tiền cọc</p>
                      <p className={`mt-1 text-sm font-black ${r.fee ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {fmtMoney(r.fee)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Còn lại phải trả
                      </p>
                      <p className="mt-1 text-sm font-black text-orange-400">
                        {fmtMoney(
                          r.parkingSession
                            ? r.parkingSession.fee
                            : r.estimatedFee && r.fee
                              ? r.estimatedFee - r.fee
                              : 0
                        )}
                      </p>
                    </div>
                  </div>

                  {r.parkingSession && (
                    <div className="mt-4 rounded-xl border border-white/[0.04] bg-white/[0.01] p-3 shadow-inner">
                      <div className="flex items-center gap-1.5 border-b border-white/[0.04] pb-2 mb-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <h5 className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                          Phiên gửi xe thực tế
                        </h5>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-xs">
                        <div>
                          <span className="text-slate-500 text-[10px] block">Giờ vào:</span>
                          <span className="text-slate-300 font-medium">{fmtTime(r.parkingSession.entryTime)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Giờ ra:</span>
                          <span className="text-slate-300 font-medium">
                            {r.parkingSession.exitTime ? fmtTime(r.parkingSession.exitTime) : '—'}
                          </span>
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className="text-slate-500 text-[10px] block">Thanh toán thêm:</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`font-black ${
                                r.parkingSession.fee > 0 ? 'text-amber-400 font-extrabold' : 'text-emerald-400'
                              }`}
                            >
                              {fmtMoney(r.parkingSession.fee)}
                            </span>
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                                r.parkingSession.paymentStatus === 'paid'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {r.parkingSession.paymentStatus === 'paid' ? 'Đã trả' : 'Chưa trả'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {r.createdAt && (
                    <div className="mt-3 flex items-center justify-between border-t border-white/[0.03] pt-3 text-[10px] text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock size={10} className="text-slate-600" />
                        <span>Đặt lúc: {fmtTime(r.createdAt)}</span>
                      </div>
                      {r.updatedAt && r.updatedAt !== r.createdAt && (
                        <span>Cập nhật: {fmtTime(r.updatedAt)}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            } else {
              const sub = item as LongTermSubscription;
              let statusColorClass = 'border-slate-500/20';
              if (sub.status === 'active') statusColorClass = 'border-l-emerald-500/80';
              else if (sub.status === 'cancelled') statusColorClass = 'border-l-rose-500/80';
              else if (sub.status === 'expired') statusColorClass = 'border-l-slate-500/80';
              else if (sub.status === 'pending') statusColorClass = 'border-l-amber-500/80';

              return (
                <div
                  key={sub._id}
                  className={`relative rounded-2xl border-l-[3px] border-y border-r border-white/[0.05] bg-white/[0.01] p-4 transition-all duration-300 hover:border-r-white/10 hover:border-y-white/10 hover:bg-white/[0.03] hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] group ${statusColorClass}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-black text-orange-400 tracking-wider flex items-center gap-1">
                          <span className="text-slate-500 text-[10px]">GÓI:</span>
                          {sub.package?.name ?? 'Gói không xác định'}
                        </span>
                        <span className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 text-xs font-bold text-amber-400 tracking-wide flex items-center gap-1 shadow-sm">
                          <Car size={12} className="opacity-80" />
                          {sub.plateNumber ?? sub.linkedPlates?.join(', ') ?? '—'}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs font-medium text-slate-400 flex items-center gap-1">
                        <Building2 size={12} className="text-slate-500" />
                        {(sub.building as any)?.name ?? (sub.building as any) ?? '—'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={sub.status} mode="package" />
                      {(() => {
                        const now = new Date();
                        const startDate = new Date(sub.startDate);
                        const diffMs = now.getTime() - startDate.getTime();
                        const diffDays = diffMs / (1000 * 60 * 60 * 24);
                        const isPendingOrActive = sub.status === 'active' || sub.status === 'pending';
                        const canCancel = isPendingOrActive && (now <= startDate || diffDays <= 3);
                        return canCancel ? (
                          <button
                            type="button"
                            onClick={() => setCancellingSub(sub)}
                            className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50 transition-all"
                          >
                            Hủy
                          </button>
                        ) : null;
                      })()}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-white/[0.03] pt-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Ngày bắt đầu</p>
                      <p className="mt-1 text-xs font-medium text-slate-300">{fmtDateOnly(sub.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Ngày kết thúc</p>
                      <p className="mt-1 text-xs font-medium text-slate-300">{fmtDateOnly(sub.endDate)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Giá gói</p>
                      <p className="mt-1 text-sm font-black text-emerald-400">
                        {fmtMoney(sub.price ?? sub.package?.price)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Mã gói</p>
                      <p className="mt-1 text-xs font-semibold text-slate-300">{sub.package?.code ?? '—'}</p>
                    </div>
                  </div>

                  {sub.createdAt && (
                    <div className="mt-3 flex items-center justify-between border-t border-white/[0.03] pt-3 text-[10px] text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock size={10} className="text-slate-600" />
                        <span>Đăng ký lúc: {fmtTime(sub.createdAt)}</span>
                      </div>
                      {sub.updatedAt && sub.updatedAt !== sub.createdAt && (
                        <span>Cập nhật: {fmtTime(sub.updatedAt)}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            }
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-white/5 mt-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => load(page - 1)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:text-white disabled:opacity-40"
          >
            ← Trước
          </button>
          <span className="text-xs text-slate-400">
            Trang {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => load(page + 1)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:text-white disabled:opacity-40"
          >
            Sau →
          </button>
        </div>
      )}

      {cancellingSub && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-6 text-left">
            <div>
              <h3 className="text-lg font-black text-white">Xác nhận hủy gói dài hạn</h3>
              <p className="text-xs text-slate-400 mt-1">
                Gói: {cancellingSub.package?.name ?? 'Gói không xác định'} ({cancellingSub.package?.code ?? '—'})
              </p>
            </div>

            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 space-y-2 text-xs font-semibold text-rose-300">
              <p>
                Gói dài hạn này sẽ được hủy. Bạn sẽ được hoàn lại 95% giá gói (tương đương{' '}
                <span className="font-black text-rose-400">
                  {fmtMoney((cancellingSub.price ?? cancellingSub.package?.price ?? 0) * 0.95)}
                </span>
                ) vào ví cá nhân.
              </p>
              <p className="text-[10px] text-rose-300/80 italic">
                (*) Hệ thống khấu trừ 5% phí hủy gói, bao gồm: phí dịch vụ tiện ích, phí quản lý hệ thống và chi phí vận
                hành bãi đỗ.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase text-slate-400 block mb-2">Lý do hủy</span>
                <div className="space-y-2">
                  {[
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
                        name="cancelReasonTab"
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
                  setCancelReason('change_vehicle');
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
                  setIsCancelling(true);
                  try {
                    await userApi.longTermSubscriptions.cancel(cancellingSub._id, { cancelReason, cancelNote });
                    setSuccessMessage(
                      'Hủy gói dài hạn thành công! Số tiền hoàn lại (95%) đã được cộng vào ví tài khoản.'
                    );
                    load(page, activeMode, statusFilter);
                    setCancellingSub(null);
                    setCancelReason('change_vehicle');
                    setCancelNote('');
                  } catch (err) {
                    setCancelError(err instanceof Error ? err.message : 'Lỗi khi hủy gói dài hạn.');
                  } finally {
                    setIsCancelling(false);
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-black uppercase tracking-wider text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCancelling ? 'Đang xử lý...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
