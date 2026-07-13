import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, CheckCircle2, RefreshCcw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { staffApi, type StaffReservation } from '@/services/staff/staffApi';

const fmtTime = (v?: string | null) =>
  v ? new Date(v).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const fmtMoney = (n?: number | null) =>
  n != null ? `${n.toLocaleString('vi-VN')} đ` : '—';

const STATUS_LABELS: Record<StaffReservation['status'], string> = {
  pending: 'Pending confirmation',
  confirmed: 'Confirmed',
  checked_in: 'Checked in',
  completed: 'Completed',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

export function StaffReservationsPage() {
  const { buildingId, building } = useBuildingContext();

  const [items, setItems] = useState<StaffReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const q: Record<string, string | undefined> = {};
    if (buildingId) q.buildingId = buildingId;
    staffApi
      .listReservations(q)
      .then((res) => {
        const rows = (res as { data?: { items?: StaffReservation[] } })?.data?.items ?? [];
        setItems(Array.isArray(rows) ? rows : []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load reservations'))
      .finally(() => setLoading(false));
  }, [buildingId]);

  const handleCheckIn = useCallback(async (code: string, id: string) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    setActionError(null);
    try {
      await staffApi.reservations.checkIn(code);
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Check-in failed');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  }, [load]);

  const handleExpire = useCallback(async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    setActionError(null);
    try {
      await staffApi.reservations.expire(id);
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  }, [load]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15_000);
    return () => clearInterval(timer);
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) =>
      [r.code ?? '', r.plateNumber ?? '', r.user?.fullName ?? '', r.user?.email ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [items, query]);

  const columns: DataColumn<StaffReservation>[] = [
    {
      key: 'code',
      title: 'Reservation Code',
      render: (row) => <span className="font-mono text-xs font-bold text-primary">{row.code ?? '—'}</span>,
    },
    {
      key: 'user',
      title: 'Customer',
      render: (row) =>
        row.user ? (
          <div>
            <p className="font-semibold text-foreground text-sm">{row.user.fullName ?? '—'}</p>
            <p className="text-xs text-muted-foreground">{row.user.email ?? ''}</p>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      key: 'plateNumber',
      title: 'License Plate',
      render: (row) => <span className="font-mono font-semibold text-foreground">{row.plateNumber ?? '—'}</span>,
    },
    {
      key: 'vehicleType',
      title: 'Vehicle Type',
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.vehicleType ? `${row.vehicleType.code} — ${row.vehicleType.name}` : '—'}
        </span>
      ),
    },
    {
      key: 'slot',
      title: 'Floor / Slot',
      render: (row) => {
        const floor = (row.slot as { floor?: { code?: string; name?: string } } | null)?.floor;
        const floorLabel = floor?.name ?? floor?.code ?? null;
        const slotCode = row.slot?.code ?? null;
        return (
          <div className="flex items-center gap-1 flex-wrap">
            {floorLabel ? (
              <span className="rounded border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                Floor {floorLabel}
              </span>
            ) : null}
            {slotCode ? (
              <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                Slot {slotCode}
              </span>
            ) : (
              !floorLabel && <span className="text-muted-foreground text-xs">—</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'startTime',
      title: 'Entry Time',
      render: (row) => <span className="text-xs text-muted-foreground">{fmtTime(row.startTime)}</span>,
    },
    {
      key: 'fee',
      title: 'Deposit',
      render: (row) => (
        <span className="font-bold text-emerald-400 text-sm">
          {fmtMoney(row.amountPaid ?? row.fee)}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (row) => (
        <div className="flex flex-col gap-1">
          <StatusBadge status={row.status} />
          <span className="text-[10px] text-muted-foreground">{STATUS_LABELS[row.status] ?? row.status}</span>
        </div>
      ),
    },
    {
      key: '_id',
      title: 'Actions',
      render: (row) => {
        const busy = actionLoading[row._id];
        if (row.status === 'confirmed') {
          return (
            <Button
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => row.code && handleCheckIn(row.code, row._id)}
              className="gap-1.5 text-xs h-7 px-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            >
              <CheckCircle2 size={12} />
              {busy ? '...' : 'Check-in'}
            </Button>
          );
        }
        if (row.status === 'expired' || row.status === 'pending') {
          return (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => handleExpire(row._id)}
              className="gap-1.5 text-xs h-7 px-2 text-rose-400 hover:bg-rose-500/10"
            >
              <XCircle size={12} />
              {busy ? '...' : 'Expired'}
            </Button>
          );
        }
        return <span className="text-xs text-muted-foreground">—</span>;
      },
    },
  ];

  return (
    <div className="grid gap-6">
      {actionError && (
        <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-500">
          {actionError}
        </div>
      )}

      {/* Header */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <CalendarCheck2 size={22} className="text-primary" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Reservations</p>
              <h2 className="mt-0.5 text-xl font-semibold text-foreground">Reservation List</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {building ? `${building.code} · ${building.name}` : 'All Buildings'}
              </p>
            </div>
          </div>
          <Button variant="secondary" onClick={load} className="gap-2 self-start lg:self-auto">
            <RefreshCcw size={14} /> Refresh
          </Button>
        </div>
      </section>

      {/* Thống kê nhanh */}
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Total Reservations', value: items.length },
          { label: 'Confirmed', value: items.filter((i) => i.status === 'confirmed').length },
          { label: 'Checked in', value: items.filter((i) => i.status === 'checked_in').length },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{m.label}</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{loading ? '–' : m.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Bộ lọc */}
      <Card>
        <CardContent className="p-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by code, license plate, customer name, email..."
            className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </CardContent>
      </Card>

      {/* Bảng dữ liệu */}
      <Card>
        <CardHeader>
          <CardTitle>
            Reservations{filtered.length > 0 ? ` (${filtered.length})` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading data...</p>
          ) : error ? (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
              <p>{error}</p>
              <Button variant="secondary" onClick={load} className="mt-3 gap-2 text-xs">
                <RefreshCcw size={13} /> Retry
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No reservations found.</p>
          ) : (
            <DataTable
              title={`Reservations (${filtered.length})`}
              rows={filtered}
              columns={columns}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
