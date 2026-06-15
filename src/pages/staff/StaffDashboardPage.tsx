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
import { Link } from 'react-router-dom';
import { ScanLine } from 'lucide-react';
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
  bg: string;
  loading?: boolean;
  glowColor: string;
}

function StatCard({ label, value, icon: Icon, accent, bg, loading, glowColor }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-slate-900/40 p-5 backdrop-blur-md shadow-lg transition-all duration-305 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:border-white/12 group">
      {/* Glow effect */}
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${glowColor} opacity-10 blur-xl pointer-events-none group-hover:opacity-20 transition-opacity duration-300`} />
      
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 font-mono">{label}</p>
          {loading ? (
            <Skeleton className="mt-2.5 h-9 w-14" />
          ) : (
            <p className="mt-1.5 text-4xl font-black tabular-nums text-white tracking-tight">{value}</p>
          )}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${accent} ${bg} group-hover:scale-105 transition-transform duration-300`}>
          <Icon size={18} className="text-slate-200" />
        </div>
      </div>
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

  const stats = [
    {
      label: 'Ca hôm nay',
      value: todayShifts.length,
      icon: CalendarClock,
      accent: 'border-teal-500/20 bg-teal-500/10',
      bg: 'bg-teal-500/10',
      glowColor: 'from-teal-500/20 to-transparent',
      loading,
    },
    {
      label: 'Đang đỗ xe',
      value: activeSessions.length,
      icon: Gauge,
      accent: 'border-emerald-500/20 bg-emerald-500/10',
      bg: 'bg-emerald-500/10',
      glowColor: 'from-emerald-500/20 to-transparent',
      loading,
    },
    {
      label: 'Đặt chỗ trước',
      value: pendingReservations.length,
      icon: Ticket,
      accent: 'border-amber-500/20 bg-amber-500/10',
      bg: 'bg-amber-500/10',
      glowColor: 'from-amber-500/20 to-transparent',
      loading,
    },
    {
      label: 'Sự cố mở',
      value: openIncidents.length,
      icon: ShieldAlert,
      accent: openIncidents.length > 0 ? 'border-rose-500/30 bg-rose-500/10' : 'border-white/5 bg-slate-950/20',
      bg: openIncidents.length > 0 ? 'bg-rose-500/10' : 'bg-slate-950/20',
      glowColor: openIncidents.length > 0 ? 'from-rose-500/20 to-transparent' : 'from-slate-500/10 to-transparent',
      loading,
    },
  ];

  if (!loading && !building) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-sm rounded-3xl border border-amber-500/30 bg-amber-500/10 p-8 text-center backdrop-blur-md shadow-lg">
          <Building2 size={36} className="mx-auto mb-3 text-amber-400" />
          <p className="text-base font-extrabold text-amber-300">Chưa chọn tòa nhà</p>
          <p className="mt-1 text-sm text-slate-400 font-medium">
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
      className="space-y-6 max-w-6xl mx-auto"
    >
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-slate-900/40 p-6 backdrop-blur-md shadow-lg">
        {/* Glow accents */}
        <div className="absolute top-0 left-0 w-60 h-60 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.06),transparent_65%)] pointer-events-none blur-2xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.04),transparent_65%)] pointer-events-none blur-2xl" />

        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-teal-500/20 bg-teal-500/10 shadow-[0_0_12px_rgba(20,184,166,0.15)]">
              <Building2 size={20} className="text-teal-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 font-mono">
                Nhân viên vận hành
              </p>
              <h1 className="mt-1 text-2xl font-black text-white tracking-tight leading-none">
                {building ? building.name : <Skeleton className="h-7 w-48" />}
              </h1>
              <p className="mt-1.5 text-xs font-semibold text-slate-400">{fmtDateFull()}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!loading && (
              assignedGates.length > 0 ? (
                assignedGates.map((g) => (
                  <div
                    key={g._id}
                    className="flex items-center gap-1.5 rounded-xl border border-teal-500/20 bg-teal-500/10 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.08)]"
                  >
                    <DoorOpen size={13} />
                    Cổng {g.code}{g.name ? ` · ${g.name}` : ''} · {directionText(g.direction)}
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-slate-950/40 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-slate-400">
                  <DoorOpen size={13} /> Chưa được gán cổng
                </div>
              )
            )}
            {building?.operatingHours && (
              <div className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-slate-950/40 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-slate-400 font-mono">
                <Clock size={12} />
                {building.operatingHours.open} – {building.operatingHours.close}
              </div>
            )}
            <StatusBadge status={building?.status ?? 'active'} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Interactive Action Cards */}
      {!loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {showCheckIn && (
            <Link
              to="/staff/operations"
              className="group relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-slate-900/35 p-5 transition-all duration-300 hover:border-emerald-500/40 hover:bg-slate-900/60 hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)] hover:scale-[1.02]"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/5 to-transparent blur-xl pointer-events-none" />

              <div className="flex items-center gap-4 relative z-10">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.1)] group-hover:scale-105 transition-all duration-300">
                  <ScanLine size={20} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 font-mono">
                    {assignedGates.length > 0 ? 'Cổng vào được gán' : 'Nhiệm vụ'}
                  </p>
                  <h3 className="mt-0.5 text-base font-extrabold text-white tracking-tight">Check-in xe vào</h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">Quét biển số / QR để cho xe vào bãi</p>
                </div>
              </div>
            </Link>
          )}
          {showCheckOut && (
            <Link
              to="/staff/checkout"
              className="group relative overflow-hidden rounded-3xl border border-orange-500/20 bg-slate-900/35 p-5 transition-all duration-300 hover:border-orange-500/40 hover:bg-slate-900/60 hover:shadow-[0_8px_30px_rgba(249,115,22,0.15)] hover:scale-[1.02]"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-500/5 to-transparent blur-xl pointer-events-none" />

              <div className="flex items-center gap-4 relative z-10">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 shadow-[0_0_10px_rgba(249,115,22,0.1)] group-hover:scale-105 transition-all duration-300">
                  <ScanLine size={20} className="text-orange-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 font-mono">
                    {assignedGates.length > 0 ? 'Cổng ra được gán' : 'Nhiệm vụ'}
                  </p>
                  <h3 className="mt-0.5 text-base font-extrabold text-white tracking-tight">Check-out xe ra</h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">Quét biển số / QR → đối chiếu ảnh → thu phí & cho ra</p>
                </div>
              </div>
            </Link>
          )}
          <Link
            to="/staff/parked"
            className="group relative overflow-hidden rounded-3xl border border-white/8 bg-slate-900/35 p-5 transition-all duration-300 hover:border-white/18 hover:bg-slate-900/60 hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] hover:scale-[1.02]"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/5 to-transparent blur-xl pointer-events-none" />

            <div className="flex items-center gap-4 relative z-10">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-slate-950/40 group-hover:scale-105 transition-all duration-300">
                <Car size={20} className="text-slate-350" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 font-mono">Giám sát</p>
                <h3 className="mt-0.5 text-base font-extrabold text-white tracking-tight">Xe đang đỗ</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">Xem danh sách xe đang đỗ (chỉ xem)</p>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3.5 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
          <AlertTriangle size={16} className="shrink-0 text-rose-450" />
          <p className="text-sm font-semibold text-rose-350">{error}</p>
        </div>
      )}

      {/* Open incidents banner */}
      {!loading && openIncidents.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/8 px-4 py-3.5 shadow-[0_0_15px_rgba(244,63,94,0.08)]">
          <ShieldAlert size={16} className="mt-0.5 shrink-0 text-rose-400" />
          <div>
            <p className="text-sm font-extrabold text-rose-300">
              {openIncidents.length} sự cố đang mở
            </p>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Truy cập tab Sự cố để xem chi tiết và xử lý kịp thời.
            </p>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Ca làm việc */}
        <div className="rounded-3xl border border-white/8 bg-slate-900/40 p-6 backdrop-blur-md shadow-lg relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.03),transparent_60%)] pointer-events-none blur-2xl" />

          <div className="mb-5 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <CalendarClock size={16} className="text-teal-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">Ca làm việc hôm nay</h2>
            </div>
            <span className="rounded-md border border-white/5 bg-slate-950/40 px-2 py-0.5 text-[11px] font-bold text-slate-400 font-mono">
              {loading ? '…' : todayShifts.length}
            </span>
          </div>

          <div className="space-y-3 relative z-10">
            {loading ? (
              <>
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
              </>
            ) : todayShifts.length === 0 ? (
              <div className="flex flex-col items-center gap-2.5 py-12 text-center border border-dashed border-white/5 rounded-2xl bg-slate-950/20">
                <Circle size={28} className="text-slate-700 opacity-60" />
                <p className="text-sm text-slate-500 font-medium">Không có ca nào hôm nay</p>
              </div>
            ) : (
              todayShifts.map((s) => (
                <div
                  key={s._id}
                  className="flex items-center gap-4 rounded-2xl border border-white/5 bg-slate-950/35 px-4 py-3.5 transition-all duration-300 hover:border-teal-500/10 hover:bg-slate-950/60"
                >
                  <div className="w-20 shrink-0 text-center">
                    <p className="text-[11px] font-black tabular-nums text-teal-400 font-mono">
                      {s.shift.startTime}
                    </p>
                    <div className="mx-auto my-1.5 h-3.5 w-px bg-slate-800" />
                    <p className="text-[11px] font-black tabular-nums text-slate-500 font-mono">
                      {s.shift.endTime}
                    </p>
                  </div>
                  <div className="h-11 w-px shrink-0 bg-white/5" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-200">
                      {s.shift.code} — {s.shift.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-400 font-medium">{s.building.name}</p>
                    {s.gate ? (
                      <p className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-teal-500/20 bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-teal-400 font-mono">
                        <DoorOpen size={10} />
                        Cổng {s.gate.code}
                        {s.gate.name ? ` · ${s.gate.name}` : ''}
                        {' · '}
                        {s.gate.direction === 'in' ? 'Cổng vào' : s.gate.direction === 'out' ? 'Cổng ra' : 'Hai chiều'}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono italic">Chưa phân công cổng</p>
                    )}
                    {s.note && (
                      <p className="mt-1 truncate text-[11px] text-slate-500 italic">Ghi chú: {s.note}</p>
                    )}
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Xe đang đỗ */}
        <div className="rounded-3xl border border-white/8 bg-slate-900/40 p-6 backdrop-blur-md shadow-lg relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03),transparent_60%)] pointer-events-none blur-2xl" />

          <div className="mb-5 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <Car size={16} className="text-emerald-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">Xe đang đỗ</h2>
            </div>
            <span className="rounded-md border border-white/5 bg-slate-950/40 px-2 py-0.5 text-[11px] font-bold text-slate-400 font-mono">
              {loading ? '…' : activeSessions.length}
            </span>
          </div>

          <div className="space-y-3 relative z-10">
            {loading ? (
              <>
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
              </>
            ) : activeSessions.length === 0 ? (
              <div className="flex flex-col items-center gap-2.5 py-12 text-center border border-dashed border-white/5 rounded-2xl bg-slate-950/20">
                <CheckCircle2 size={28} className="text-slate-700 opacity-60" />
                <p className="text-sm text-slate-500 font-medium">Không có xe nào đang đỗ</p>
              </div>
            ) : (
              activeSessions.slice(0, 5).map((session) => (
                <div
                  key={session._id}
                  className="flex items-center gap-3 rounded-2xl border border-white/5 bg-slate-950/35 px-4 py-3.5 transition-all duration-300 hover:border-emerald-500/10 hover:bg-slate-950/60"
                >
                  <div className="flex h-9 min-w-[90px] items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/5 px-2.5 shadow-[0_0_10px_rgba(245,158,11,0.05)]">
                    <span className="font-mono text-xs font-black tracking-widest text-amber-450">
                      {session.plateNumber}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pl-1">
                    <p className="truncate text-xs text-slate-400 font-medium">
                      <DoorOpen size={11} className="mr-1 inline-block text-slate-550" />
                      {session.entryGate?.name ?? session.entryGate?.code ?? '—'}
                      {session.vehicleType ? ` · ${session.vehicleType.name}` : ''}
                    </p>
                    <p className="mt-1.5 text-xs font-bold text-orange-450 font-sans">
                      {formatSlotLocation(session)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 font-mono">
                      Vào lúc {fmtTime(session.entryTime)}
                    </p>
                  </div>
                  <StatusBadge status={session.status} />
                </div>
              ))
            )}

            {!loading && activeSessions.length > 5 && (
              <p className="pt-1.5 text-center text-xs font-bold text-slate-500 font-mono tracking-wide">
                +{activeSessions.length - 5} XE KHÁC
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
