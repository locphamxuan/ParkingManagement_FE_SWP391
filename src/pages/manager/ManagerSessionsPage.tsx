import { useCallback, useEffect, useMemo, useState } from 'react';
import { Car, Clock, RefreshCcw, Users, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type ParkingSession } from '@/services/manager/managerApi';
import { resolveErrorMessage } from '@/utils/apiErrors';

type MemberFilter = 'all' | 'member' | 'walk-in' | 'long-term';

const fmtTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString('vi-VN') : '—';

const fmtMoney = (n: number | null | undefined) =>
  n != null ? `${n.toLocaleString('vi-VN')} đ` : '—';

const fmtDuration = (from: string | null | undefined) => {
  if (!from) return '—';
  const mins = Math.max(0, Math.floor((Date.now() - new Date(from).getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h} h ${m} m` : `${m} m`;
};

function StatChip({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
        <Icon size={15} />
      </span>
      <div>
        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-base font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function SnapshotImg({ src, label }: { src?: string | null; label: string }) {
  return (
    <div>
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
        {src ? (
          <img src={src} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="text-[10px] text-muted-foreground/60">None</span>
        )}
      </div>
      <p className="mt-0.5 text-center text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

export function ManagerSessionsPage() {
  const { buildingId } = useBuildingContext();
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [memberFilter, setMemberFilter] = useState<MemberFilter>('all');

  // Modal chi tiết: fetch riêng vì list đã lược ảnh base64 cho nhẹ payload.
  const [selected, setSelected] = useState<ParkingSession | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!buildingId) return;
    try {
      const res = await managerApi.sessions.listActive(buildingId);
      setSessions((res.data.items ?? []).filter((s) => s.status === 'active'));
      setError(null);
    } catch (err) {
      setError(resolveErrorMessage(err, 'Failed to load parked sessions.'));
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return sessions.filter((s) => {
      if (memberFilter === 'member' && !(s.isMember ?? s.user)) return false;
      if (memberFilter === 'walk-in' && (s.isMember ?? s.user)) return false;
      if (memberFilter === 'long-term' && !s.isLongTerm) return false;
      if (!term) return true;
      return (
        s.plateNumber.toLowerCase().includes(term) ||
        (s.user?.fullName ?? '').toLowerCase().includes(term) ||
        (s.user?.email ?? '').toLowerCase().includes(term) ||
        (s.slot?.code ?? '').toLowerCase().includes(term)
      );
    });
  }, [sessions, searchTerm, memberFilter]);

  const memberCount = useMemo(
    () => sessions.filter((s) => Boolean(s.isMember ?? s.user)).length,
    [sessions],
  );
  const totalFee = useMemo(
    () => sessions.reduce((sum, s) => sum + (s.currentFee ?? s.fee ?? 0), 0),
    [sessions],
  );

  const openDetail = async (session: ParkingSession) => {
    setSelected(session);
    setDetailLoading(true);
    try {
      const res = await managerApi.sessions.detail(buildingId, session._id);
      const full = res.data;
      if (full?._id) {
        setSelected((prev) => (prev && prev._id === session._id ? { ...prev, ...full } : prev));
      }
    } catch {
      /* ảnh/chi tiết bổ sung là phụ trợ — card đã có dữ liệu chính */
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header + stats */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Live Monitoring</p>
          <h2 className="mt-0.5 text-xl font-bold text-foreground">Parked Sessions</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            All vehicles currently parked in this building. Use Refresh to pull the latest data.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <StatChip label="Parked" value={loading ? '–' : sessions.length} icon={Car} />
          <StatChip label="Members" value={loading ? '–' : memberCount} icon={Users} />
          <StatChip label="Walk-in" value={loading ? '–' : sessions.length - memberCount} icon={Clock} />
          <StatChip label="Amount Due" value={loading ? '–' : fmtMoney(totalFee)} icon={Wallet} />
          <Button variant="secondary" onClick={() => { setLoading(true); void refresh(); }} className="h-11 gap-2">
            <RefreshCcw size={14} /> Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by plate, owner, slot..."
          className="h-10 max-w-xs"
        />
        <div className="flex gap-1 rounded-lg border border-border bg-muted p-1">
          {([
            { value: 'all', label: 'All' },
            { value: 'member', label: 'Member' },
            { value: 'walk-in', label: 'Walk-in' },
            { value: 'long-term', label: 'Package' },
          ] as { value: MemberFilter; label: string }[]).map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setMemberFilter(f.value)}
              className={`h-8 rounded-md px-3 text-xs font-bold transition-all ${
                memberFilter === f.value
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">{error}</div>
      )}

      {/* Session cards */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card py-12 text-center">
          <Car size={28} className="mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {sessions.length === 0 ? 'No vehicles are currently parked.' : 'No sessions match the current filters.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((s) => {
            const isMember = Boolean(s.isMember ?? s.user) || s.isLongTerm;
            return (
              <button
                key={s._id}
                type="button"
                onClick={() => void openDetail(s)}
                title="Click to view full session details"
                className="block w-full cursor-pointer rounded-xl border border-border bg-card p-3.5 text-left transition hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate font-mono font-bold text-foreground">{s.plateNumber}</p>
                    {s.vehicleBrand && (
                      <span className="shrink-0 rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-400">
                        {s.vehicleBrand}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {s.isLongTerm && (
                      <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-orange-400">
                        Package
                      </span>
                    )}
                    {isMember ? (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-400">
                        Member
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-amber-400">
                        Walk-in
                      </span>
                    )}
                  </div>
                </div>
                {isMember && s.user?.fullName && (
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {s.user.fullName}
                    {s.user.email ? ` · ${s.user.email}` : ''}
                  </p>
                )}
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  Check-in: {s.staff?.fullName ?? '—'}
                  {s.entryGate?.code ? ` · gate ${s.entryGate.code}` : ''}
                </p>

                <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  <div>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Vehicle Type</span>
                    <p className="font-medium text-foreground">{s.vehicleType?.name ?? '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Entry Gate</span>
                    <p className="font-medium text-foreground">{s.entryGate?.code ?? '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Floor</span>
                    <p className="font-medium text-foreground">{s.slot?.floor?.name || s.slot?.floor?.code || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Slot</span>
                    <p className="font-medium text-foreground">{s.slot?.code ?? '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Entry Time</span>
                    <p className="font-medium text-foreground">{fmtTime(s.entryTime)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Duration</span>
                    <p className="font-medium text-primary">{fmtDuration(s.entryTime)}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {s.isLongTerm ? 'Overage Fee' : 'Amount Due'}
                  </span>
                  <span className={`font-bold ${s.pricePolicyConfigured === false ? 'text-amber-400' : 'text-primary'}`}>
                    {s.pricePolicyConfigured === false
                      ? 'No price policy'
                      : (s.currentFee ?? s.fee ?? 0) > 0
                        ? fmtMoney(s.currentFee ?? s.fee)
                        : s.isLongTerm
                          ? 'Free'
                          : fmtMoney(0)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      <Modal
        open={selected !== null}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
        title={selected ? `Session · ${selected.plateNumber}` : 'Session Details'}
      >
        {selected && (
          <div className="space-y-4">
            {/* Ảnh lúc check-in (fetch từ detail endpoint) */}
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                Check-in Snapshots
              </p>
              {detailLoading ? (
                <p className="text-xs text-muted-foreground">Loading images...</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <SnapshotImg src={selected.plateImage} label="License Plate" />
                  <SnapshotImg src={selected.portraitImage} label="Driver Portrait" />
                </div>
              )}
            </div>

            <div className="space-y-1.5 rounded-xl border border-border bg-card/50 p-4">
              <DetailRow
                label="Customer"
                value={
                  (selected.isMember ?? selected.user)
                    ? `${selected.user?.fullName || 'Member'}${selected.user?.email ? ` · ${selected.user.email}` : ''}`
                    : 'Walk-in Customer'
                }
              />
              <DetailRow
                label="Vehicle"
                value={`${selected.vehicleType?.name ?? '—'}${selected.vehicleBrand ? ` · ${selected.vehicleBrand}` : ''}`}
              />
              <DetailRow
                label="Location"
                value={`Floor ${selected.slot?.floor?.name || selected.slot?.floor?.code || '—'} · Slot ${selected.slot?.code ?? '—'}`}
              />
              <DetailRow
                label="Entry Gate"
                value={`${selected.entryGate?.code ?? '—'}${selected.entryGate?.name ? ` · ${selected.entryGate.name}` : ''}`}
              />
              <DetailRow label="Entry Time" value={fmtTime(selected.entryTime)} />
              <DetailRow label="Duration" value={fmtDuration(selected.entryTime)} />
              <DetailRow
                label="Check-in Staff"
                value={selected.staff?.fullName ?? '—'}
              />
              <DetailRow
                label="Payment Type"
                value={selected.isLongTerm ? 'Long-term package' : 'Pay per session'}
              />
              {selected.isLongTerm && (
                <DetailRow
                  label="Daily Free Limit"
                  value={
                    selected.maxHoursPerDay
                      ? `${selected.maxHoursPerDay} h/day${(selected.overageHours ?? 0) > 0 ? ` · over by ${selected.overageHours?.toFixed(1)} h` : ''}`
                      : 'Unlimited'
                  }
                />
              )}
              <div className="flex items-center justify-between border-t border-border/60 pt-2">
                <span className="text-sm font-semibold text-foreground">
                  {selected.isLongTerm ? 'Overage Fee' : 'Amount Due'}
                </span>
                <span className={`font-mono text-lg font-black ${selected.pricePolicyConfigured === false ? 'text-amber-400' : 'text-primary'}`}>
                  {selected.pricePolicyConfigured === false
                    ? 'No price policy'
                    : (selected.currentFee ?? selected.fee ?? 0) > 0
                      ? fmtMoney(selected.currentFee ?? selected.fee)
                      : selected.isLongTerm
                        ? 'Free'
                        : fmtMoney(0)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              View-only monitoring. Check-out and payment are performed by exit-gate staff.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
