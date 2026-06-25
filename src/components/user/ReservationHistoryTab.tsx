import { useState, useEffect, useCallback } from 'react';
import {
  CalendarClock,
  Clock,
  RefreshCw,
  XCircle,
  Building2,
  Car,
} from 'lucide-react';
import { userApi } from '@/services/user/userApi';
import type { Reservation } from '@/services/user/userApi';
import { fmtMoney, fmtTime } from '@/pages/user/reservationsHelper';

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

function StatusBadge({ status }: { status: string }) {
  const label = HOURLY_LABELS[status] || status;
  const color = HOURLY_COLORS[status] || 'border-slate-500/30 bg-slate-500/10 text-slate-400';
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${color}`}>
      {label}
    </span>
  );
}

const cancelCutoffPassed = (r: { startTime?: string; cancellationCutoffHours?: number }): boolean => {
  const cutoff = Number(r?.cancellationCutoffHours ?? 0);
  if (cutoff <= 0 || !r?.startTime) return false;
  return Date.now() > new Date(r.startTime).getTime() - cutoff * 60 * 60 * 1000;
};

const FILTER_TABS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'confirmed', label: 'Đã đặt' },
  { value: 'checked_in', label: 'Đang sử dụng' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
  { value: 'expired', label: 'Hết hạn' },
];

export function ReservationHistoryTab() {
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const load = useCallback(
    (p = 1, status = statusFilter) => {
      setLoading(true);
      setError(null);
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
    },
    [statusFilter]
  );

  useEffect(() => {
    load(1, statusFilter);
  }, [load, statusFilter]);

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div className="flex items-center gap-1.5 rounded-xl bg-white/[0.02] border border-white/5 p-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
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

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-400">Đang tải dữ liệu...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
          <CalendarClock size={32} className="mx-auto mb-3 text-slate-600 animate-pulse" />
          <p className="text-sm font-semibold text-slate-400">Bạn chưa có lịch sử đặt chỗ nào.</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
          {items.map((r) => {
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
                      cancelCutoffPassed(r) ? (
                        <span
                          title={`Phải hủy trước giờ đặt ít nhất ${r.cancellationCutoffHours} giờ`}
                          className="rounded-lg border border-slate-500/30 bg-slate-500/10 px-2.5 py-1 text-[11px] font-bold text-slate-400"
                        >
                          Quá hạn hủy
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={cancellingId === r._id}
                          onClick={() => handleCancel(r._id)}
                          className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50 transition-all disabled:opacity-50"
                        >
                          <XCircle size={12} />
                          {cancellingId === r._id ? 'Đang hủy...' : 'Hủy'}
                        </button>
                      )
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
    </div>
  );
}
