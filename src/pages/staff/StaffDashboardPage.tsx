import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  Car,
  CheckCircle2,
  Circle,
  Clock,
  DoorOpen,
  Gauge,
  ShieldAlert,
  Ticket,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import {
  staffApi,
  extractShifts,
  type MyShift,
  type ParkingSession,
  type StaffIncident,
  type StaffReservation,
} from '@/services/staff/staffApi';

const todayStr = () => new Date().toISOString().slice(0, 10);

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function fmtDateFull() {
  return new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-white/10 ${className}`} />;
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent: string;
  bg: string;
  loading?: boolean;
}

function StatCard({ label, value, icon: Icon, accent, bg, loading }: StatCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border ${accent} ${bg} p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-9 w-14" />
          ) : (
            <p className="mt-1 text-4xl font-black tabular-nums text-white">{value}</p>
          )}
        </div>
        <div className={`rounded-xl border ${accent} bg-white/5 p-2.5`}>
          <Icon size={18} className="text-slate-300" />
        </div>
      </div>
    </div>
  );
}

export function StaffDashboardPage() {
  const { building } = useBuildingContext();
  const [shifts, setShifts] = useState<MyShift[]>([]);
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [incidents, setIncidents] = useState<StaffIncident[]>([]);
  const [reservations, setReservations] = useState<StaffReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const d = todayStr();
    const buildingId = building?._id;
    Promise.all([
      staffApi.myShifts({ from: d, to: d }),
      staffApi.getActiveSessions(),
      staffApi.incidents.list(buildingId),
      staffApi.listReservations(buildingId ? { buildingId, status: 'confirmed' } : {}),
    ])
      .then(([shiftRes, sessionRes, incidentRes, resRes]) => {
        setShifts(extractShifts(shiftRes as Parameters<typeof extractShifts>[0]));

        const rawSessions =
          (sessionRes as { data?: { items?: ParkingSession[] } | ParkingSession[] })?.data;
        setSessions(
          Array.isArray(rawSessions)
            ? rawSessions
            : (rawSessions as { items?: ParkingSession[] })?.items ?? [],
        );

        const rawInc =
          (incidentRes as { data?: { items?: StaffIncident[] } | StaffIncident[] })?.data;
        setIncidents(
          Array.isArray(rawInc)
            ? rawInc
            : (rawInc as { items?: StaffIncident[] })?.items ?? [],
        );

        const rawRes =
          (resRes as { data?: { items?: StaffReservation[] } })?.data?.items ?? [];
        setReservations(Array.isArray(rawRes) ? rawRes : []);

        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Tải dữ liệu thất bại'))
      .finally(() => setLoading(false));
  }, [building]);

  const activeSessions = useMemo(() => sessions.filter((s) => s.status === 'active'), [sessions]);
  const openIncidents = useMemo(
    () => incidents.filter((i) => ['open', 'investigating', 'escalated'].includes(i.status ?? '')),
    [incidents],
  );
  const pendingReservations = useMemo(
    () => reservations.filter((r) => r.status === 'confirmed'),
    [reservations],
  );

  const stats: StatCardProps[] = [
    {
      label: 'Ca hôm nay',
      value: shifts.length,
      icon: CalendarClock,
      accent: 'border-teal-500/30',
      bg: 'bg-teal-500/5',
      loading,
    },
    {
      label: 'Đang đỗ xe',
      value: activeSessions.length,
      icon: Gauge,
      accent: 'border-emerald-500/30',
      bg: 'bg-emerald-500/5',
      loading,
    },
    {
      label: 'Đặt chỗ trước',
      value: pendingReservations.length,
      icon: Ticket,
      accent: 'border-amber-500/30',
      bg: 'bg-amber-500/5',
      loading,
    },
    {
      label: 'Sự cố mở',
      value: openIncidents.length,
      icon: ShieldAlert,
      accent: openIncidents.length > 0 ? 'border-rose-500/50' : 'border-slate-700',
      bg: openIncidents.length > 0 ? 'bg-rose-500/5' : 'bg-white/5',
      loading,
    },
  ];

  if (!loading && !building) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-sm rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
          <Building2 size={36} className="mx-auto mb-3 text-amber-400" />
          <p className="text-base font-bold text-amber-300">Chưa chọn tòa nhà</p>
          <p className="mt-1 text-sm text-slate-400">
            Vui lòng chọn tòa nhà từ menu bên trái để bắt đầu ca làm việc.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-slate-900 to-slate-900/80 p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-emerald-500/8 blur-2xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-teal-500/25 bg-teal-500/10">
              <Building2 size={22} className="text-teal-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Nhân viên vận hành
              </p>
              <h1 className="mt-0.5 text-2xl font-bold text-white">
                {building ? building.name : <Skeleton className="h-7 w-48" />}
              </h1>
              <p className="mt-1 text-sm text-slate-400">{fmtDateFull()}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {building?.operatingHours && (
              <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400">
                <Clock size={12} />
                {building.operatingHours.open} – {building.operatingHours.close}
              </div>
            )}
            <StatusBadge status={building?.status ?? 'active'} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
          <AlertTriangle size={16} className="shrink-0 text-rose-400" />
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      )}

      {/* Open incidents banner */}
      {!loading && openIncidents.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/8 px-4 py-3">
          <ShieldAlert size={16} className="mt-0.5 shrink-0 text-rose-400" />
          <div>
            <p className="text-sm font-semibold text-rose-300">
              {openIncidents.length} sự cố đang mở
            </p>
            <p className="text-xs text-slate-400">
              Truy cập tab Sự cố để xem chi tiết và xử lý.
            </p>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid gap-5 xl:grid-cols-2">
        {/* Ca làm việc */}
        <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock size={16} className="text-teal-400" />
              <h2 className="text-sm font-bold text-white">Ca làm việc hôm nay</h2>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
              {loading ? '…' : shifts.length}
            </span>
          </div>

          <div className="space-y-2">
            {loading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : shifts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Circle size={28} className="text-slate-700" />
                <p className="text-sm text-slate-500">Không có ca nào hôm nay</p>
              </div>
            ) : (
              shifts.map((s) => (
                <div
                  key={s._id}
                  className="flex items-center gap-4 rounded-xl border border-white/6 bg-white/3 px-4 py-3"
                >
                  <div className="w-20 shrink-0 text-center">
                    <p className="text-[11px] font-black tabular-nums text-teal-400">
                      {s.shift.startTime}
                    </p>
                    <div className="mx-auto my-0.5 h-3 w-px bg-slate-700" />
                    <p className="text-[11px] font-black tabular-nums text-slate-500">
                      {s.shift.endTime}
                    </p>
                  </div>
                  <div className="h-10 w-px shrink-0 bg-white/8" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">
                      {s.shift.code} — {s.shift.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{s.building.name}</p>
                    {s.note && (
                      <p className="mt-0.5 truncate text-[11px] italic text-slate-600">{s.note}</p>
                    )}
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Xe đang đỗ */}
        <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car size={16} className="text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Xe đang đỗ</h2>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
              {loading ? '…' : activeSessions.length}
            </span>
          </div>

          <div className="space-y-2">
            {loading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : activeSessions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckCircle2 size={28} className="text-slate-700" />
                <p className="text-sm text-slate-500">Không có xe nào đang đỗ</p>
              </div>
            ) : (
              activeSessions.slice(0, 5).map((session) => (
                <div
                  key={session._id}
                  className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/3 px-4 py-3"
                >
                  <div className="flex h-9 min-w-[76px] items-center justify-center rounded-lg border border-amber-500/25 bg-amber-500/8 px-2">
                    <span className="font-mono text-xs font-black tracking-wide text-amber-300">
                      {session.plateNumber}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-slate-400">
                      <DoorOpen size={11} className="mr-1 inline-block" />
                      {session.entryGate?.name ?? session.entryGate?.code ?? '—'}
                      {session.vehicleType ? ` · ${session.vehicleType.name}` : ''}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Vào lúc {fmtTime(session.entryTime)}
                    </p>
                  </div>
                  <StatusBadge status={session.status} />
                </div>
              ))
            )}

            {!loading && activeSessions.length > 5 && (
              <p className="pt-1 text-center text-xs text-slate-500">
                +{activeSessions.length - 5} xe khác
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
