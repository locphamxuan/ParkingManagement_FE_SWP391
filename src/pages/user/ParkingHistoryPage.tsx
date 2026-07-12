import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, Car, Clock, History, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { userApi, type ParkingHistory } from '@/services/user/userApi';
import { StatusBadge } from '@/components/common/StatusBadge';

const fmtVnd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const fmtTime = (s?: string | null) =>
  s ? new Date(s).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : '—';
const fmtDuration = (minutes?: number | null) => {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  wallet: 'Wallet',
  qr: 'QR Code',
};

type FilterStatus = 'all' | 'active' | 'completed';

export default function ParkingHistoryPage() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [items, setItems] = useState<ParkingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load all hooks BEFORE any conditional return (Rules of Hooks)
  const load = useCallback((p = 1) => {
    setLoading(true);
    setError(null);
    userApi.parkingHistory
      .list({ page: p, limit: 20 })
      .then((res) => {
        // Backend returns { data: { items, pagination } }
        const raw = (res as { data?: { items?: ParkingHistory[]; pagination?: { totalPages?: number } } })?.data;
        // Normalize: backend ParkingSession uses entryTime/exitTime; map to checkIn/checkOut
        const normalized: ParkingHistory[] = (raw?.items ?? []).map(
          (item: ParkingHistory & { entryTime?: string | null; exitTime?: string | null }) => ({
            ...item,
            checkIn: item.checkIn ?? item.entryTime ?? null,
            checkOut: item.checkOut ?? item.exitTime ?? null,
          }),
        );
        setItems(normalized);
        setTotalPages(raw?.pagination?.totalPages ?? 1);
        setPage(p);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load parking history'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!session) return;
    load(1);
  }, [load, session]);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return items;
    return items.filter((s) => s.status === statusFilter);
  }, [items, statusFilter]);

  const totalFee = useMemo(
    () => filtered.filter((s) => s.status === 'completed').reduce((sum, s) => sum + (s.fee ?? 0), 0),
    [filtered],
  );

  const TABS: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: `All (${items.length})` },
    { value: 'active', label: `Active (${items.filter((s) => s.status === 'active').length})` },
    { value: 'completed', label: `Completed (${items.filter((s) => s.status === 'completed').length})` },
  ];

  // Guard: redirect after all hooks have been declared
  if (!session) return <Navigate to="/auth/login" replace />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/8 bg-slate-950/80 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={15} />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <History size={16} className="text-orange-400" />
              <h1 className="text-sm font-bold text-white">Parking History</h1>
            </div>
            <p className="text-[11px] text-slate-500">Direct parking sessions (walk-in/drive-in)</p>
          </div>
          <button
            type="button"
            onClick={() => load(1)}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 space-y-5">
        {/* Summary */}
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Total Sessions', value: String(items.length), color: 'border-orange-500/20 bg-orange-500/5' },
            { label: 'Active', value: String(items.filter((s) => s.status === 'active').length), color: 'border-emerald-500/20 bg-emerald-500/5' },
            { label: 'Total Spend', value: fmtVnd.format(totalFee), color: 'border-amber-500/20 bg-amber-500/5' },
          ].map((c) => (
            <div key={c.label} className={`rounded-2xl border ${c.color} p-4`}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{c.label}</p>
              <p className="mt-2 text-xl font-bold text-white">{loading ? '…' : c.value}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 rounded-xl border border-white/8 bg-white/5 p-1 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === tab.value
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading history...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md p-10 text-center shadow-inner">
            <Car size={32} className="mx-auto mb-3 text-slate-600 animate-pulse" />
            <p className="text-sm font-semibold text-slate-400">No parking history found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((session) => {
              const rawFloor = session.slot?.floor;
              const floorObj = typeof rawFloor === 'object' && rawFloor !== null ? rawFloor : null;
              const floorLabel = floorObj?.code ?? floorObj?.name;
              const slotCode = session.slot?.code;

              return (
                <div
                  key={session._id}
                  className="rounded-2xl border border-white/8 bg-white/3 p-4 transition-all hover:border-orange-500/20 hover:bg-white/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Plate & Building */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10">
                        <Car size={16} className="text-amber-400" />
                      </div>
                      <div>
                        <p className="font-mono text-sm font-black tracking-wide text-amber-300">
                          {session.plateNumber}
                        </p>
                        <p className="text-xs text-slate-400">{session.building?.name ?? '—'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={session.status} />
                      {session.status === 'completed' && (
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          Paid
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Detail row */}
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {/* Floor / Slot */}
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Slot</p>
                      <div className="mt-1 flex gap-1 flex-wrap">
                        {floorLabel ? (
                          <span className="rounded border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-400">
                            F.{floorLabel}
                          </span>
                        ) : null}
                        {slotCode ? (
                          <span className="rounded border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-bold text-violet-400">
                            {slotCode}
                          </span>
                        ) : null}
                        {!floorLabel && !slotCode && (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </div>
                    </div>

                    {/* Times */}
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Entry</p>
                      <p className="mt-1 text-xs text-slate-300">{fmtTime(session.checkIn)}</p>
                      {session.entryGate?.name && (
                        <p className="mt-0.5 text-[10px] text-slate-500">Gate: {session.entryGate.name}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Exit</p>
                      <p className="mt-1 text-xs text-slate-300">{fmtTime(session.checkOut)}</p>
                      {session.exitGate?.name && (
                        <p className="mt-0.5 text-[10px] text-slate-500">Gate: {session.exitGate.name}</p>
                      )}
                    </div>

                    {/* Fee */}
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Fee</p>
                      <p className={`mt-1 text-xs font-bold ${session.fee ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {session.fee != null ? fmtVnd.format(session.fee) : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Footer row */}
                  {(session.duration != null || session.paymentMethod) && (
                    <div className="mt-2 flex items-center gap-3 border-t border-white/5 pt-2">
                      {session.duration != null && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Clock size={10} /> {fmtDuration(session.duration)}
                        </span>
                      )}
                      {session.paymentMethod && (
                        <span className="text-[10px] text-slate-500">
                          {PAYMENT_LABELS[session.paymentMethod] ?? session.paymentMethod}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => load(page - 1)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
            >
              ← Prev
            </button>
            <span className="text-xs text-slate-400">
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => load(page + 1)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
