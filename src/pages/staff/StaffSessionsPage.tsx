import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarCheck2,
  Car,
  Clock,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { staffApi, type ParkingSession, type StaffReservation } from '@/services/staff/staffApi';

const fmtMoney = (n?: number | null) =>
  n != null ? `${n.toLocaleString('vi-VN')} ₫` : '—';

const fmtTime = (s?: string | null) =>
  s ? new Date(s).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const STATUS_LABELS: Record<string, string> = {
  checked_in: 'Đã check-in',
  completed: 'Hoàn thành',
  active: 'Đang gửi',
};

type ViewFilter = 'all' | 'reservation' | 'session';

export function StaffSessionsPage() {
  const { buildingId } = useBuildingContext();

  const [activeSessions, setActiveSessions] = useState<ParkingSession[]>([]);
  const [paidReservations, setPaidReservations] = useState<StaffReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');

  const refresh = useCallback(async () => {
    if (!buildingId) return;
    setLoading(true);
    setError(null);
    try {
      const [sessRes, checkedInRes, completedRes] = await Promise.all([
        staffApi.sessions.list(buildingId),
        staffApi.listReservations({ buildingId, status: 'checked_in' }),
        staffApi.listReservations({ buildingId, status: 'completed' }),
      ]);

      const rawSessions =
        (sessRes as { data?: { items?: ParkingSession[] } })?.data?.items ?? [];
      setActiveSessions(Array.isArray(rawSessions) ? rawSessions : []);

      const checkedIn =
        (checkedInRes as { data?: { items?: StaffReservation[] } })?.data?.items ?? [];
      const completed =
        (completedRes as { data?: { items?: StaffReservation[] } })?.data?.items ?? [];
      const allPaid = [...checkedIn, ...completed].sort(
        (a, b) =>
          new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime(),
      );
      setPaidReservations(allPaid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tải dữ liệu thất bại');
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(timer);
  }, [refresh]);

  const totalRevenue = useMemo(
    () => paidReservations.reduce((sum, r) => sum + (r.amountPaid ?? r.fee ?? 0), 0),
    [paidReservations],
  );
  const checkedInCount = useMemo(
    () => paidReservations.filter((r) => r.status === 'checked_in').length,
    [paidReservations],
  );
  const completedCount = useMemo(
    () => paidReservations.filter((r) => r.status === 'completed').length,
    [paidReservations],
  );

  const reservationColumns: DataColumn<StaffReservation>[] = [
    {
      key: 'code',
      title: 'Mã đặt chỗ',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-primary">{row.code ?? '—'}</span>
      ),
    },
    {
      key: 'plateNumber',
      title: 'Biển số',
      render: (row) => (
        <span className="rounded border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 font-mono text-xs font-bold text-amber-300">
          {row.plateNumber ?? '—'}
        </span>
      ),
    },
    {
      key: 'slot',
      title: 'Tầng / Ô đỗ',
      render: (row) => {
        const floor = (
          row.slot as { floor?: { code?: string; name?: string } } | null
        )?.floor;
        const floorLabel = floor?.code ?? floor?.name;
        const slotCode = row.slot?.code;
        return (
          <div className="flex items-center gap-1 flex-wrap">
            {floorLabel && (
              <span className="rounded border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-400">
                T.{floorLabel}
              </span>
            )}
            {slotCode && (
              <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                {slotCode}
              </span>
            )}
            {!floorLabel && !slotCode && (
              <span className="text-muted-foreground text-xs">—</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'fee',
      title: 'Số tiền',
      render: (row) => (
        <span className="font-bold text-emerald-400">
          {fmtMoney(row.amountPaid ?? row.fee)}
        </span>
      ),
    },
    {
      key: 'startTime',
      title: 'Thời gian',
      render: (row) => (
        <span className="text-xs text-muted-foreground">{fmtTime(row.startTime)}</span>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <StatusBadge status={row.status} />
          <span className="text-[10px] text-muted-foreground">
            {STATUS_LABELS[row.status] ?? row.status}
          </span>
        </div>
      ),
    },
  ];

  const sessionColumns: DataColumn<ParkingSession>[] = [
    {
      key: 'plateNumber',
      title: 'Biển số',
      render: (row) => (
        <span className="rounded border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 font-mono text-xs font-bold text-amber-300">
          {row.plateNumber}
        </span>
      ),
    },
    {
      key: 'vehicleType',
      title: 'Loại xe',
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.vehicleType ? `${row.vehicleType.code} — ${row.vehicleType.name}` : '—'}
        </span>
      ),
    },
    {
      key: 'slot',
      title: 'Vị trí',
      render: (row) => {
        const floor = row.slot?.floor;
        const slotCode = row.slot?.code;
        return (
          <div className="flex items-center gap-1 flex-wrap">
            {floor?.code && (
              <span className="rounded border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-400">
                T.{floor.code}
              </span>
            )}
            {slotCode && (
              <span className="rounded border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-bold text-violet-400">
                {slotCode}
              </span>
            )}
            {!floor?.code && !slotCode && (
              <span className="text-muted-foreground text-xs">—</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'entryTime',
      title: 'Vào lúc',
      render: (row) => (
        <span className="text-xs text-muted-foreground">{fmtTime(row.entryTime)}</span>
      ),
    },
    {
      key: 'entryGate',
      title: 'Cổng vào',
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.entryGate?.name ?? row.entryGate?.code ?? '—'}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: () => (
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
          Đang gửi
        </span>
      ),
    },
  ];

  const VIEW_TABS: { value: ViewFilter; label: string }[] = [
    { value: 'all', label: 'Tất cả' },
    { value: 'reservation', label: `Đặt chỗ (${paidReservations.length})` },
    { value: 'session', label: `Gửi trực tiếp (${activeSessions.length})` },
  ];

  const statCards = [
    {
      label: 'Thu từ đặt chỗ',
      value: fmtMoney(totalRevenue),
      icon: Wallet,
      color: 'text-emerald-500',
      border: 'border-emerald-500/20 bg-emerald-500/5',
    },
    {
      label: 'Đã check-in',
      value: String(checkedInCount),
      icon: CalendarCheck2,
      color: 'text-blue-500',
      border: 'border-blue-500/20 bg-blue-500/5',
    },
    {
      label: 'Hoàn thành',
      value: String(completedCount),
      icon: Clock,
      color: 'text-amber-500',
      border: 'border-amber-500/20 bg-amber-500/5',
    },
    {
      label: 'Xe đang gửi',
      value: String(activeSessions.length),
      icon: Car,
      color: 'text-violet-500',
      border: 'border-violet-500/20 bg-violet-500/5',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet size={18} className="text-primary" />
          <div>
            <h2 className="text-base font-semibold text-foreground">Theo dõi thanh toán</h2>
            <p className="text-xs text-muted-foreground">
              Đặt chỗ trước đã thu tiền và xe đang gửi trực tiếp
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={refresh} className="gap-1.5">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Làm mới
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-500">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className={`border ${stat.border}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} className={stat.color} />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
                <p className="text-xl font-bold text-foreground">{loading ? '—' : stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* View filter tabs */}
      <div className="flex gap-1.5 rounded-lg border border-border bg-card p-1 w-fit">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setViewFilter(tab.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              viewFilter === tab.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reservations table */}
      {(viewFilter === 'all' || viewFilter === 'reservation') && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CalendarCheck2 size={14} className="text-primary" />
              Đặt chỗ đã thu tiền
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                {paidReservations.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Đang tải...</p>
            ) : paidReservations.length === 0 ? (
              <div className="py-8 text-center">
                <CalendarCheck2 size={28} className="mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Chưa có đặt chỗ nào đã thu tiền.</p>
              </div>
            ) : (
              <DataTable title="" rows={paidReservations} columns={reservationColumns} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Active sessions table */}
      {(viewFilter === 'all' || viewFilter === 'session') && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Car size={14} className="text-violet-500" />
              Xe đang gửi trực tiếp
              <span className="ml-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-400">
                {activeSessions.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Đang tải...</p>
            ) : activeSessions.length === 0 ? (
              <div className="py-8 text-center">
                <Car size={28} className="mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Không có xe đang gửi.</p>
              </div>
            ) : (
              <DataTable title="" rows={activeSessions} columns={sessionColumns} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
