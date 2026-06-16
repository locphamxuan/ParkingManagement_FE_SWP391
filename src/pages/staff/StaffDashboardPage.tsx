import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarClock,
  Car,
  CheckCircle2,
  Circle,
  Clock,
  DoorOpen,
  Gauge,
  ScanLine,
  ShieldAlert,
  Ticket,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import {
  staffApi,
  extractShifts,
  type MyShift,
  type ParkingSession,
  type StaffIncident,
  type StaffReservation,
} from '@/services/staff/staffApi';

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
  loading?: boolean;
}

function StatCard({ label, value, icon: Icon, accent, loading }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
          <Icon size={15} />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-12" />
      ) : (
        <p className="mt-1.5 text-3xl font-bold tabular-nums text-white">{value}</p>
      )}
    </div>
  );
}

function formatSlotLocation(session: ParkingSession): string {
  const floor = session.slot?.floor?.name || session.slot?.floor?.code || null;
  const slotCode = session.slot?.code || null;
  if (!floor && !slotCode) return 'Vị trí —';
  if (!floor) return `Ô ${slotCode}`;
  if (!slotCode) return `Tầng ${floor}`;
  return `Tầng ${floor} • Ô ${slotCode}`;
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
    const buildingId = building?._id;
    Promise.all([
      staffApi.myShifts(),
      staffApi.getActiveSessions({ populate: 'slot.floor,vehicleType,entryGate,exitGate' }),
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
          Array.isArray(rawInc) ? rawInc : (rawInc as { items?: StaffIncident[] })?.items ?? [],
        );

        const rawRes = (resRes as { data?: { items?: StaffReservation[] } })?.data?.items ?? [];
        setReservations(Array.isArray(rawRes) ? rawRes : []);

        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Tải dữ liệu thất bại'))
      .finally(() => setLoading(false));
  }, [building]);

  const todayShifts = useMemo(() => {
    const now = new Date();
    const sameDay = (iso: string) => {
      const d = new Date(iso);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    };
    return shifts.filter((s) => sameDay(s.workDate));
  }, [shifts]);

  const activeSessions = useMemo(() => sessions.filter((s) => s.status === 'active'), [sessions]);
  const openIncidents = useMemo(
    () => incidents.filter((i) => ['open', 'investigating', 'escalated'].includes(i.status ?? '')),
    [incidents],
  );
  const pendingReservations = useMemo(
    () => reservations.filter((r) => r.status === 'confirmed'),
    [reservations],
  );

  const assignedGates = useMemo(() => {
    const pickFrom = todayShifts.length > 0 ? todayShifts : shifts.slice(0, 1);
    const map = new Map<string, NonNullable<MyShift['gate']>>();
    pickFrom.forEach((s) => {
      if (s.gate?._id) map.set(s.gate._id, s.gate);
    });
    return Array.from(map.values());
  }, [todayShifts, shifts]);

  const directionText = (d: 'in' | 'out' | 'both') =>
    d === 'in' ? 'Cổng vào' : d === 'out' ? 'Cổng ra' : 'Hai chiều';

  const showCheckIn = assignedGates.some((g) => g.direction === 'in' || g.direction === 'both') || assignedGates.length === 0;
  const showCheckOut = assignedGates.some((g) => g.direction === 'out' || g.direction === 'both') || assignedGates.length === 0;
  const taskCount = (showCheckIn ? 1 : 0) + (showCheckOut ? 1 : 0);

  const stats = [
    { label: 'Ca hôm nay', value: todayShifts.length, icon: CalendarClock, accent: 'border border-teal-500/20 bg-teal-500/10 text-teal-400', loading },
    { label: 'Đang đỗ xe', value: activeSessions.length, icon: Gauge, accent: 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400', loading },
    { label: 'Đặt chỗ trước', value: pendingReservations.length, icon: Ticket, accent: 'border border-amber-500/20 bg-amber-500/10 text-amber-400', loading },
    {
      label: 'Sự cố mở',
      value: openIncidents.length,
      icon: ShieldAlert,
      accent: openIncidents.length > 0
        ? 'border border-rose-500/30 bg-rose-500/10 text-rose-400'
        : 'border border-white/10 bg-slate-950/40 text-slate-400',
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
      className="space-y-5"
    >
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/40 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-teal-500/20 bg-teal-500/10">
            <Building2 size={20} className="text-teal-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nhân viên vận hành</p>
            <h1 className="text-xl font-bold leading-tight text-white">
              {building ? building.name : <Skeleton className="h-6 w-44" />}
            </h1>
            <p className="mt-0.5 text-xs text-slate-400">{fmtDateFull()}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!loading &&
            (assignedGates.length > 0 ? (
              assignedGates.map((g) => (
                <span
                  key={g._id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-300"
                >
                  <DoorOpen size={13} /> Cổng {g.code}
                  {g.name ? ` · ${g.name}` : ''} · {directionText(g.direction)}
                </span>
              ))
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-950/40 px-3 py-1.5 text-xs font-semibold text-slate-400">
                <DoorOpen size={13} /> Chưa được gán cổng
              </span>
            ))}
          {building?.operatingHours && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-950/40 px-3 py-1.5 text-xs font-semibold text-slate-400">
              <Clock size={12} /> {building.operatingHours.open} – {building.operatingHours.close}
            </span>
          )}
          <StatusBadge status={building?.status ?? 'active'} />
        </div>
      </div>

      {/* ── Thao tác chính ── */}
      {!loading && (
        <div className={`grid gap-3 ${taskCount === 2 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
          {showCheckIn && (
            <Link
              to="/staff/operations"
              className="group flex items-center gap-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-5 transition-colors hover:bg-emerald-500/10"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
                <ScanLine size={22} className="text-emerald-400" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-white">Check-in xe vào</h3>
                <p className="text-xs text-slate-400">Quét biển số / QR cho xe vào bãi</p>
              </div>
              <ArrowRight size={18} className="shrink-0 text-emerald-400 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
          {showCheckOut && (
            <Link
              to="/staff/checkout"
              className="group flex items-center gap-4 rounded-2xl border border-orange-500/25 bg-orange-500/[0.06] p-5 transition-colors hover:bg-orange-500/10"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-orange-500/25 bg-orange-500/10">
                <ScanLine size={22} className="text-orange-400" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-white">Check-out xe ra</h3>
                <p className="text-xs text-slate-400">Quét → đối chiếu ảnh → thu phí & cho ra</p>
              </div>
              <ArrowRight size={18} className="shrink-0 text-orange-400 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      )}

      {/* ── Thống kê ── */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* ── Banners ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-400">
          <AlertTriangle size={16} className="shrink-0" /> {error}
        </div>
      )}
      {!loading && openIncidents.length > 0 && (
        <Link
          to="/staff/incidents"
          className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 transition-colors hover:bg-rose-500/15"
        >
          <ShieldAlert size={16} className="shrink-0 text-rose-400" />
          <p className="flex-1 text-sm text-rose-300">
            <strong>{openIncidents.length} sự cố đang mở</strong> — bấm để xem và xử lý.
          </p>
          <ArrowRight size={16} className="shrink-0 text-rose-400" />
        </Link>
      )}

      {/* ── Danh sách: Xe đang đỗ (2/3) · Ca làm việc (1/3) ── */}
      <div className="grid items-start gap-5 xl:grid-cols-3">
        {/* Xe đang đỗ */}
        <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car size={16} className="text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Xe đang đỗ</h2>
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-bold text-slate-400">
                {loading ? '…' : activeSessions.length}
              </span>
            </div>
            <Link to="/staff/parked" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300">
              Xem tất cả <ArrowRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : activeSessions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 bg-slate-950/20 py-8 text-center">
              <CheckCircle2 size={26} className="text-slate-700" />
              <p className="text-sm text-slate-500">Không có xe nào đang đỗ</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {activeSessions.slice(0, 6).map((session) => (
                <div
                  key={session._id}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-slate-950/35 px-3.5 py-3"
                >
                  <span className="flex h-9 min-w-[88px] items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/5 px-2 font-mono text-xs font-bold tracking-wide text-amber-300">
                    {session.plateNumber}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-slate-400">
                      {session.entryGate?.name ?? session.entryGate?.code ?? '—'}
                      {session.vehicleType ? ` · ${session.vehicleType.name}` : ''}
                    </p>
                    <p className="truncate text-xs font-semibold text-orange-300">{formatSlotLocation(session)}</p>
                    <p className="text-[11px] text-slate-500">Vào lúc {fmtTime(session.entryTime)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && activeSessions.length > 6 && (
            <p className="mt-3 text-center text-xs font-semibold text-slate-500">
              +{activeSessions.length - 6} xe khác
            </p>
          )}
        </section>

        {/* Ca làm việc hôm nay */}
        <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock size={16} className="text-teal-400" />
              <h2 className="text-sm font-bold text-white">Ca làm việc hôm nay</h2>
            </div>
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-bold text-slate-400">
              {loading ? '…' : todayShifts.length}
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : todayShifts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 bg-slate-950/20 py-8 text-center">
              <Circle size={26} className="text-slate-700" />
              <p className="text-sm text-slate-500">Không có ca nào hôm nay</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayShifts.map((s) => (
                <div key={s._id} className="rounded-xl border border-white/5 bg-slate-950/35 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-200">{s.shift.code} — {s.shift.name}</p>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="mt-1 font-mono text-xs text-teal-400">{s.shift.startTime} – {s.shift.endTime}</p>
                  {s.gate ? (
                    <p className="mt-2 inline-flex items-center gap-1 rounded-md border border-teal-500/20 bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-400">
                      <DoorOpen size={10} /> Cổng {s.gate.code}{s.gate.name ? ` · ${s.gate.name}` : ''} · {directionText(s.gate.direction)}
                    </p>
                  ) : (
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 italic">Chưa phân công cổng</p>
                  )}
                  {s.note && <p className="mt-1 truncate text-[11px] text-slate-500 italic">Ghi chú: {s.note}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
}
