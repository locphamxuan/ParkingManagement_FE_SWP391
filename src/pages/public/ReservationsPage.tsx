import { useEffect, useMemo, useState, useCallback } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Bike,
  Building2,
  CalendarClock,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  MapPin,
  Package,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Timer,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { ParkingMap2D } from '@/components/shared/ParkingMap2D';
import { useAuth } from '@/hooks/useAuth';
import { CustomSelect } from '@/components/ui/select';
import {
  userApi,
  type Building,
  type VehicleType,
  type ParkingSlot as ApiParkingSlot,
  type FloorAvailability,
  type LongTermPackage,
  type Reservation,
  type LongTermSubscription,
} from '@/services/user/userApi';

/* ─── Types ────────────────────────────────────────────────────────────────── */

interface ReservationLocationState {
  buildingId?: string;
  plateNumber?: string;
  openHistory?: boolean;
  mode?: BookingMode;
}

type BookingMode = 'hourly' | 'package';
type VehicleKind = 'car' | 'motorcycle';

interface MappedSlot {
  _id: string;
  buildingId: string;
  code: string;
  floorCode?: string;
  vehicleType: VehicleKind | 'all';
  reservable: boolean;
  status: string;
}

/* ─── Constants ────────────────────────────────────────────────────────────── */

const money = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const HOUR_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 12, 24];

const TIME_SLOTS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    TIME_SLOTS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function fmtMoney(v: number | undefined | null) {
  return money.format(v || 0);
}

function fmtTime(iso: string | undefined | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtShort(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function normalizeVehicleTypeCode(raw?: string | null): VehicleKind | 'all' {
  if (!raw) return 'all';
  const code = String(raw).toLowerCase();
  if (code.includes('motor') || code.includes('moto') || code.includes('xe') || code.includes('motorcycle') || code.includes('bike')) return 'motorcycle';
  if (code.includes('car') || code.includes('ô tô') || code.includes('oto') || code.includes('ôto')) return 'car';
  return 'all';
}

function isCarPackage(pkg: LongTermPackage): boolean {
  const vt = pkg.vehicleType;
  if (vt && typeof vt === 'object') {
    const code = String(vt.code || vt.name || '').toLowerCase();
    if (code.includes('motor') || code.includes('moto') || code.includes('xe') || code.includes('bike')) return false;
    if (code.includes('car') || code.includes('oto') || code.includes('ô tô') || code.includes('ôto')) return true;
  }
  if (typeof vt === 'string') {
    const code = vt.toLowerCase();
    if (code.includes('motor') || code.includes('moto') || code.includes('xe') || code.includes('bike')) return false;
    if (code.includes('car') || code.includes('oto') || code.includes('ô tô') || code.includes('ôto')) return true;
  }
  const name = String(pkg.name || '').toLowerCase();
  const codeAttr = String(pkg.code || '').toLowerCase();
  if (name.includes('xe máy') || name.includes('motor') || name.includes('moto') || codeAttr.includes('moto') || codeAttr.includes('bike')) return false;
  if (name.includes('ô tô') || name.includes('oto') || name.includes('car') || codeAttr.includes('car')) return true;
  return false;
}

function getMaxCalendarDate(mode: BookingMode, pkg?: LongTermPackage | null): Date {
  const now = new Date();
  if (mode === 'hourly') {
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  if (!pkg) return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const days = pkg.durationDays ?? 30;
  if (days <= 7) {
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  if (days <= 30) {
    return new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);
  }
  return new Date(now.getFullYear() + 1, 11, 31, 23, 59, 59);
}

function packageCategory(pkg: LongTermPackage): 'weekly' | 'monthly' | 'yearly' {
  if (pkg.durationDays <= 7) return 'weekly';
  if (pkg.durationDays <= 30) return 'monthly';
  return 'yearly';
}

const categoryLabels = { weekly: 'Gói tuần', monthly: 'Gói tháng', yearly: 'Gói năm' };
const categoryColors = {
  weekly: {
    borderSelected: 'border-cyan-400 ring-2 ring-cyan-400/40',
    bgSelected: 'bg-gradient-to-br from-cyan-950/40 via-slate-900/60 to-slate-950/80',
    shadowSelected: 'shadow-[0_0_30px_rgba(34,211,238,0.35)]',
    borderNormal: 'border-cyan-500/20',
    bgNormal: 'bg-cyan-950/5',
    borderHover: 'hover:border-cyan-400/50',
    bgHover: 'hover:bg-cyan-950/15',
    shadowHover: 'hover:shadow-[0_0_15px_rgba(34,211,238,0.15)]',
    text: 'text-cyan-300',
    accent: 'from-cyan-500 to-blue-400',
    glitterColors: ['bg-cyan-300', 'bg-sky-200', 'bg-blue-300']
  },
  monthly: {
    borderSelected: 'border-orange-400 ring-2 ring-orange-400/40',
    bgSelected: 'bg-gradient-to-br from-orange-950/40 via-slate-900/60 to-slate-950/80',
    shadowSelected: 'shadow-[0_0_30px_rgba(249,115,22,0.35)]',
    borderNormal: 'border-orange-500/20',
    bgNormal: 'bg-orange-950/5',
    borderHover: 'hover:border-orange-400/50',
    bgHover: 'hover:bg-orange-950/15',
    shadowHover: 'hover:shadow-[0_0_15px_rgba(249,115,22,0.15)]',
    text: 'text-orange-300',
    accent: 'from-orange-500 to-amber-400',
    glitterColors: ['bg-amber-300', 'bg-orange-400', 'bg-yellow-300']
  },
  yearly: {
    borderSelected: 'border-purple-400 ring-2 ring-purple-400/40',
    bgSelected: 'bg-gradient-to-br from-purple-950/40 via-slate-900/60 to-slate-950/80',
    shadowSelected: 'shadow-[0_0_35px_rgba(168,85,247,0.35)]',
    borderNormal: 'border-purple-500/25',
    bgNormal: 'bg-purple-950/5',
    borderHover: 'hover:border-purple-400/55',
    bgHover: 'hover:bg-purple-950/15',
    shadowHover: 'hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]',
    text: 'text-purple-300',
    accent: 'from-yellow-400 via-pink-500 to-purple-600',
    glitterColors: ['bg-purple-300', 'bg-pink-300', 'bg-yellow-300']
  },
};

/* ─── Calendar Component ──────────────────────────────────────────────────── */

function MiniCalendar({
  selectedDate,
  onSelect,
  maxDate,
}: {
  selectedDate: Date | null;
  onSelect: (d: Date) => void;
  maxDate: Date;
}) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [viewMonth, setViewMonth] = useState(() => selectedDate || new Date());

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-start index (0 = Monday, 6 = Sunday)
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => setViewMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setViewMonth(new Date(year, month + 1, 1));

  return (
    <div className="mx-auto max-w-[400px] w-full rounded-2xl border border-white/[0.06] bg-[#0c1220]/45 p-4 shadow-xl">
      {/* Month nav */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition duration-200"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-black text-white">{monthNames[month]} {year}</span>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition duration-200"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {dayNames.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold uppercase text-slate-500 py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} className="aspect-square" />;
          const cellDate = new Date(year, month, day);
          cellDate.setHours(0, 0, 0, 0);
          const isPast = cellDate < today;
          const isBeyondMax = cellDate > maxDate;
          const disabled = isPast || isBeyondMax;
          const isSelected = selectedDate && isSameDay(cellDate, selectedDate);
          const isToday = isSameDay(cellDate, today);

          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(cellDate)}
              className={`relative aspect-square w-full rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center ${isSelected
                ? 'bg-orange-500 text-slate-950 font-black shadow-[0_4px_12px_rgba(249,115,22,0.4)] scale-105'
                : disabled
                  ? 'text-slate-700 opacity-25 cursor-not-allowed'
                  : isToday
                    ? 'border border-orange-500/40 bg-orange-500/5 text-orange-400 hover:bg-orange-500/10'
                    : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'
                }`}
            >
              {day}
              {isToday && !isSelected && (
                <span className="absolute bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-orange-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Time Picker (Overhauled with collapsing parts of day) ────────────────── */

function getSectionForTime(t: string): string {
  const hour = parseInt(t.split(':')[0], 10);
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 24) return 'evening';
  return 'night';
}

function TimeScroller({ selected, onSelect }: { selected: string; onSelect: (t: string) => void }) {
  const initialSection = useMemo(() => getSectionForTime(selected), [selected]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    morning: initialSection === 'morning',
    afternoon: initialSection === 'afternoon',
    evening: initialSection === 'evening',
    night: initialSection === 'night',
  });

  // Keep section expanded when selected time changes externally
  useEffect(() => {
    const sec = getSectionForTime(selected);
    setOpenSections((prev) => ({ ...prev, [sec]: true }));
  }, [selected]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const sections = useMemo(() => {
    const morning: string[] = [];
    const afternoon: string[] = [];
    const evening: string[] = [];
    const night: string[] = [];

    TIME_SLOTS.forEach((t) => {
      const sec = getSectionForTime(t);
      if (sec === 'morning') morning.push(t);
      else if (sec === 'afternoon') afternoon.push(t);
      else if (sec === 'evening') evening.push(t);
      else night.push(t);
    });

    return [
      { id: 'morning', label: '☀️ Sáng (06:00 - 11:30)', slots: morning },
      { id: 'afternoon', label: '🌤️ Trưa - Chiều (12:00 - 17:30)', slots: afternoon },
      { id: 'evening', label: '🌙 Tối (18:00 - 23:30)', slots: evening },
      { id: 'night', label: '🌌 Đêm (00:00 - 05:30)', slots: night },
    ];
  }, []);

  return (
    <div className="space-y-2">
      {sections.map((sec) => {
        const isOpen = openSections[sec.id];
        return (
          <div key={sec.id} className="rounded-2xl border border-white/[0.04] bg-[#0c1220]/25 overflow-hidden transition-all duration-200">
            <button
              type="button"
              onClick={() => toggleSection(sec.id)}
              className="flex w-full items-center justify-between px-4 py-3.5 text-xs font-black uppercase tracking-wider text-slate-300 hover:bg-white/[0.03] transition duration-200"
            >
              <span>{sec.label}</span>
              <ChevronDown
                size={16}
                className={`text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-orange-400' : ''}`}
              />
            </button>
            {isOpen && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-4 border-t border-white/[0.04]">
                {sec.slots.map((t) => {
                  const isSelected = selected === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onSelect(t)}
                      className={`rounded-xl py-2.5 text-xs font-bold transition-all duration-200 ${isSelected
                        ? 'bg-orange-500 text-slate-950 font-black shadow-[0_4px_12px_rgba(249,115,22,0.3)] scale-105'
                        : 'border border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-orange-300/30 hover:text-white'
                        }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Duration Selector ────────────────────────────────────────────────────── */

function DurationSelector({ hours, onSelect }: { hours: number; onSelect: (h: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {HOUR_OPTIONS.map((h) => (
        <button
          key={h}
          type="button"
          onClick={() => onSelect(h)}
          className={`rounded-xl px-3 py-2 text-xs font-bold transition-all duration-150 ${hours === h
            ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
            : 'border border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-orange-300/25 hover:text-white'
            }`}
        >
          {h} giờ
        </button>
      ))}
    </div>
  );
}

/* ─── Package Card with Glitter Hover Effect ───────────────────────────────── */

function PackageCard({
  pkg,
  isSelected,
  isLocked,
  cat,
  colors,
  onClick,
}: {
  pkg: LongTermPackage;
  isSelected: boolean;
  isLocked: boolean;
  cat: 'weekly' | 'monthly' | 'yearly';
  colors: any;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Generate unique properties for each glitter particle once
  const particles = useMemo(() => {
    return Array.from({ length: 16 }).map((_, i) => {
      const size = 3 + Math.random() * 4;
      const left = Math.random() * 100;
      const delay = Math.random() * 1.5;
      const duration = 1.2 + Math.random() * 1.8;
      const type = i % 3 === 0 ? 'star' : i % 3 === 1 ? 'diamond' : 'circle';
      return { id: i, size, left, delay, duration, type };
    });
  }, []);

  return (
    <button
      type="button"
      onClick={isLocked ? undefined : onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative rounded-2xl border p-4 text-left transition-all duration-300 ${isLocked
          ? 'border-white/[0.04] bg-white/[0.01] opacity-40 cursor-not-allowed'
          : isSelected
            ? `${colors.borderSelected} ${colors.bgSelected} ${colors.shadowSelected} scale-[1.04]`
            : `${colors.borderNormal} ${colors.bgNormal} ${colors.borderHover} ${colors.bgHover} ${colors.shadowHover} hover:scale-[1.02]`
        }`}
    >
      {/* Lock overlay on hover when locked */}
      {isLocked && isHovered && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-2xl bg-slate-950/70 backdrop-blur-[2px] pointer-events-none">
          <Lock size={22} className="text-slate-400 mb-1" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Không phù hợp</span>
        </div>
      )}

      {/* Glitter particles shown on hover (only if not locked) */}
      {!isLocked && isHovered && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-0">
          {particles.map((p) => {
            let color = 'bg-amber-400';
            if (colors.glitterColors) {
              color = colors.glitterColors[p.id % colors.glitterColors.length];
            }

            const style: React.CSSProperties = {
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              top: '-10px',
            };

            let shapeClass = 'rounded-full';
            if (p.type === 'star') {
              shapeClass = '';
              style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
            } else if (p.type === 'diamond') {
              shapeClass = '';
              style.clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
            }

            return (
              <span
                key={p.id}
                className={`glitter-particle ${color} ${shapeClass}`}
                style={style}
              />
            );
          })}
        </div>
      )}

      {/* Floating Ribbon / Badge */}
      <span className={`absolute -top-2.5 right-4 rounded-full bg-gradient-to-r ${colors.accent} px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.25)] animate-pulse z-10`}>
        {cat === 'weekly' ? 'Tiết kiệm' : cat === 'monthly' ? 'Phổ biến' : '💎 VIP GIÁ TỐT'}
      </span>
      <span className={`text-[9px] font-black uppercase tracking-wider ${colors.text} relative z-10`}>
        {categoryLabels[cat]}
      </span>
      <h4 className={`mt-1 text-sm font-black flex items-center gap-1.5 relative z-10 transition-colors ${isSelected ? 'text-white' : 'text-slate-200'}`}>
        {isCarPackage(pkg) ? (
          <Car size={15} className={`${colors.text} shrink-0`} />
        ) : (
          <Bike size={15} className={`${colors.text} shrink-0`} />
        )}
        <span>{pkg.name}</span>
      </h4>
      <p className="mt-1 text-xs text-slate-400 relative z-10">{pkg.durationDays} ngày</p>
      {pkg.description && (
        <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400/80 italic relative z-10 border-t border-white/5 pt-1.5">
          {pkg.description}
        </p>
      )}
      <p className={`mt-2 text-lg font-black ${colors.text} relative z-10 transition-all duration-300 ${isSelected ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.15)] scale-105 origin-left' : ''
        }`}>{fmtMoney(pkg.price)}</p>
      <span className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold relative z-10 ${isSelected
          ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
          : 'border-emerald-400/20 bg-emerald-400/5 text-emerald-300'
        }`}>
        <ShieldCheck size={10} /> Chỗ cố định
      </span>
      {isSelected && (
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute right-3 top-3 z-20"
        >
          <CheckCircle2 size={18} className={`${colors.text} drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]`} />
        </motion.div>
      )}
    </button>
  );
}

/* ─── Reservation History Sub-Component ────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    pending: 'Chờ thanh toán', confirmed: 'Đã đặt', checked_in: 'Đang sử dụng',
    completed: 'Hoàn thành', expired: 'Hết hạn', cancelled: 'Đã hủy',
    active: 'Đã đặt',
  };
  const colors: Record<string, string> = {
    pending: 'border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
    confirmed: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
    checked_in: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]',
    completed: 'border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)]',
    expired: 'border-slate-500/30 bg-slate-500/10 text-slate-400',
    cancelled: 'border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.1)]',
    active: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
  };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${colors[status] || 'border-slate-500/30 bg-slate-500/10 text-slate-400'}`}>
      {labels[status] || status}
    </span>
  );
}

function ReservationHistoryTab() {
  const [activeMode, setActiveMode] = useState<'hourly' | 'package'>('hourly');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [cancellingSub, setCancellingSub] = useState<LongTermSubscription | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('change_slot');
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

  const load = useCallback((p = 1, mode = activeMode, status = statusFilter) => {
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
      let apiStatus: string | undefined = status;
      if (status === 'all') {
        apiStatus = undefined;
      } else if (status === 'confirmed') {
        apiStatus = 'active';
      } else if (status === 'checked_in' || status === 'completed') {
        apiStatus = 'none'; // Will return empty list because subscriptions don't have these statuses
      }

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
  }, [activeMode, statusFilter]);

  useEffect(() => { load(1, activeMode, statusFilter); }, [load, activeMode, statusFilter]);

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

  const filterTabs = activeMode === 'hourly'
    ? [
        { value: 'all', label: 'Tất cả' },
        { value: 'confirmed', label: 'Đã đặt' },
        { value: 'checked_in', label: 'Đang sử dụng' },
        { value: 'completed', label: 'Hoàn thành' },
        { value: 'cancelled', label: 'Đã hủy' },
        { value: 'expired', label: 'Hết hạn' },
      ]
    : [
        { value: 'all', label: 'Tất cả' },
        { value: 'confirmed', label: 'Đã đặt' },
        { value: 'checked_in', label: 'Đang sử dụng' },
        { value: 'completed', label: 'Hoàn thành' },
        { value: 'cancelled', label: 'Đã hủy' },
      ];

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
            className={`rounded-lg px-6 py-2 text-xs font-black uppercase tracking-wider transition-all duration-300 ${activeMode === 'hourly'
                ? 'bg-orange-500 text-slate-950 shadow-[0_0_12px_rgba(249,115,22,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            Đặt theo giờ
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('package')}
            className={`rounded-lg px-6 py-2 text-xs font-black uppercase tracking-wider transition-all duration-300 ${activeMode === 'package'
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
              onClick={() => { setStatusFilter(tab.value); load(1, activeMode, tab.value); }}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all duration-200 ${statusFilter === tab.value
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

      {error && <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>}
      {successMessage && <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{successMessage}</div>}

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-400">Đang tải dữ liệu...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
          <CalendarClock size={32} className="mx-auto mb-3 text-slate-600 animate-pulse" />
          <p className="text-sm font-semibold text-slate-400">
            {activeMode === 'hourly' ? 'Bạn chưa có lịch sử đặt chỗ nào.' : 'Bạn chưa có đăng ký gói dài hạn nào.'}
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
                      <p className={`mt-1 text-sm font-black ${r.fee ? 'text-emerald-400' : 'text-slate-500'}`}>{fmtMoney(r.fee)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Còn lại phải trả</p>
                      <p className="mt-1 text-sm font-black text-orange-400">
                        {fmtMoney(r.parkingSession ? r.parkingSession.fee : (r.estimatedFee && r.fee ? r.estimatedFee - r.fee : 0))}
                      </p>
                    </div>
                  </div>

                  {r.parkingSession && (
                    <div className="mt-4 rounded-xl border border-white/[0.04] bg-white/[0.01] p-3 shadow-inner">
                      <div className="flex items-center gap-1.5 border-b border-white/[0.04] pb-2 mb-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <h5 className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Phiên gửi xe thực tế</h5>
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
                            <span className={`font-black ${r.parkingSession.fee > 0 ? 'text-amber-400 font-extrabold' : 'text-emerald-400'}`}>
                              {fmtMoney(r.parkingSession.fee)}
                            </span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${r.parkingSession.paymentStatus === 'paid'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
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
                      <StatusBadge status={sub.status} />
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

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5 border-t border-white/[0.03] pt-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Chỗ đỗ cố định</p>
                      <p className="mt-1 text-sm font-bold text-slate-200">
                        {sub.slot ? ((sub.slot as any).code ?? sub.slot) : 'Không cố định'}
                      </p>
                    </div>
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
                      <p className="mt-1 text-sm font-black text-emerald-400">{fmtMoney(sub.price ?? sub.package?.price)}</p>
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
          <button type="button" disabled={page <= 1 || loading} onClick={() => load(page - 1)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:text-white disabled:opacity-40">← Trước</button>
          <span className="text-xs text-slate-400">Trang {page} / {totalPages}</span>
          <button type="button" disabled={page >= totalPages || loading} onClick={() => load(page + 1)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:text-white disabled:opacity-40">Sau →</button>
        </div>
      )}

      {cancellingSub && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-6 text-left">
            <div>
              <h3 className="text-lg font-black text-white">Xác nhận hủy gói dài hạn</h3>
              <p className="text-xs text-slate-400 mt-1">Gói: {cancellingSub.package?.name ?? 'Gói không xác định'} ({cancellingSub.package?.code ?? '—'})</p>
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
                (*) Hệ thống khấu trừ 5% phí hủy gói, bao gồm: phí dịch vụ tiện ích, phí quản lý hệ thống và chi phí vận hành bãi đỗ.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase text-slate-400 block mb-2">Lý do hủy</span>
                <div className="space-y-2">
                  {[
                    { value: 'change_slot', label: '🚗 Đổi sang chỗ đỗ khác' },
                    { value: 'change_vehicle', label: '🔄 Thay đổi phương tiện / biển số xe' },
                    { value: 'no_longer_needed', label: '🏢 Không còn nhu cầu đỗ xe ở đây' },
                    { value: 'pricing_issue', label: '💸 Giá gói không còn phù hợp' },
                    { value: 'other', label: '⚠️ Lý do khác' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${cancelReason === opt.value
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
                  setCancelReason('change_slot');
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
                    setSuccessMessage('Hủy gói dài hạn thành công! Số tiền hoàn lại (95%) đã được cộng vào ví tài khoản.');
                    load(page, activeMode, statusFilter);
                    setCancellingSub(null);
                    setCancelReason('change_slot');
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

/* ─── Main ReservationsPage ────────────────────────────────────────────────── */

export default function ReservationsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const state = (location.state as ReservationLocationState | null) ?? null;

  const user = useMemo(() => {
    if (!session) return null;
    return { userId: session.userId, fullName: session.displayName, licensePlates: session.licensePlates || [] };
  }, [session]);

  /* ── Core state ── */
  const [mode, setMode] = useState<BookingMode>(state?.mode || 'hourly');
  const [rows, setRows] = useState<Array<{ building: Building }>>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [vehicleTypesForBuilding, setVehicleTypesForBuilding] = useState<VehicleType[]>([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleKind | ''>('');
  const [floorsData, setFloorsData] = useState<FloorAvailability[]>([]);
  const [slots, setSlots] = useState<MappedSlot[]>([]);
  const [selectedFloorIdModal, setSelectedFloorIdModal] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedPlate, setSelectedPlate] = useState('');

  /* ── Hourly state ── */
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('08:00');
  const [durationHours, setDurationHours] = useState(2);

  /* ── Package state ── */
  const [packages, setPackages] = useState<LongTermPackage[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<LongTermPackage | null>(null);
  const [pkgStartDate, setPkgStartDate] = useState<Date | null>(null);

  /* ── UI state ── */
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  // Auto-dismiss alerts after 10 seconds
  useEffect(() => {
    if (bookingSuccess) {
      const timer = setTimeout(() => setBookingSuccess(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [bookingSuccess]);

  useEffect(() => {
    if (bookingError) {
      const timer = setTimeout(() => setBookingError(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [bookingError]);

  const [bookedPlates, setBookedPlates] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch reservations
    const p1 = userApi.reservations.list({ limit: 100 }).then(res => {
      const items = (res as any)?.data?.items || [];
      return items
        .filter((r: any) => ['pending', 'confirmed', 'checked_in'].includes(r.status))
        .map((r: any) => r.plateNumber);
    }).catch(() => []);

    // Fetch subscriptions
    const p2 = userApi.longTermSubscriptions.list({ limit: 100 }).then(res => {
      const items = (res as any)?.data?.items || [];
      return items
        .filter((s: any) => ['pending', 'active'].includes(s.status))
        .map((s: any) => s.plateNumber || s.linkedPlates?.[0]);
    }).catch(() => []);

    Promise.all([p1, p2]).then(([resPlates, subPlates]) => {
      const allBooked = Array.from(new Set([
        ...resPlates.filter(Boolean),
        ...subPlates.filter(Boolean)
      ]));
      setBookedPlates(allBooked);
    });
  }, [user, bookingSuccess]);

  /* ── Data Loading ── */
  useEffect(() => {
    let ignore = false;
    setIsLoadingBuildings(true);
    userApi.buildings.list()
      .then((res) => {
        if (ignore) return;
        const buildingRows = res.data.items.map((b) => ({ building: b }));
        setRows(buildingRows);
        const preferred = state?.buildingId || buildingRows[0]?.building._id || '';
        setSelectedBuildingId((c) => c || preferred);
      })
      .catch(() => { })
      .finally(() => { if (!ignore) setIsLoadingBuildings(false); });
    return () => { ignore = true; };
  }, [state?.buildingId]);

  // Set plate from navigation state
  useEffect(() => {
    if (state?.plateNumber) setSelectedPlate(state.plateNumber);
  }, [state?.plateNumber]);

  // Set history mode
  useEffect(() => {
    if (state?.openHistory) setShowHistory(true);
  }, [state?.openHistory]);

  // Load vehicle types + floors for selected building
  useEffect(() => {
    let ignore = false;
    if (!selectedBuildingId) { setFloorsData([]); setVehicleTypesForBuilding([]); return; }

    const load = async () => {
      try {
        const vtRes = await userApi.buildings.vehicleTypes(selectedBuildingId);
        if (ignore) return;
        setVehicleTypesForBuilding(vtRes.data.items || []);

        const floorsRes = await userApi.buildings.floors(selectedBuildingId);
        if (ignore) return;
        setFloorsData(floorsRes.data.floors || []);
      } catch { /* ok */ }
    };
    load();
    return () => { ignore = true; };
  }, [selectedBuildingId]);

  // Load packages for selected building
  useEffect(() => {
    if (!selectedBuildingId) { setPackages([]); return; }
    let ignore = false;
    userApi.longTermPackages.list({ buildingId: selectedBuildingId })
      .then((res) => {
        if (ignore) return;
        setPackages((res as any)?.data?.packages ?? []);
      })
      .catch(() => { });
    return () => { ignore = true; };
  }, [selectedBuildingId]);

  // Load slots when floor is selected in modal
  useEffect(() => {
    let ignore = false;
    if (!selectedBuildingId || !selectedFloorIdModal) return;
    setIsLoadingSlots(true);
    userApi.buildings.slots(selectedBuildingId, selectedFloorIdModal)
      .then((slotsRes) => {
        if (ignore) return;
        const apiSlots: ApiParkingSlot[] = slotsRes.data.slots || [];
        const mapped: MappedSlot[] = apiSlots.map((s) => {
          let rawCode: string | undefined;
          if (s.vehicleType && typeof s.vehicleType === 'object' && 'code' in s.vehicleType) {
            rawCode = String(s.vehicleType.code);
          }
          return {
            _id: s._id,
            buildingId: selectedBuildingId,
            code: s.code,
            vehicleType: normalizeVehicleTypeCode(rawCode),
            reservable: s.reservable ?? true,
            status: (s.status as string) || 'available',
          };
        });
        setSlots(mapped);
        setSelectedSlot(null);
      })
      .catch(() => { })
      .finally(() => { if (!ignore) setIsLoadingSlots(false); });
    return () => { ignore = true; };
  }, [selectedBuildingId, selectedFloorIdModal]);

  /* ── Derived values ── */
  const selectedBuilding = useMemo(
    () => rows.find((r) => r.building._id === selectedBuildingId) || null,
    [rows, selectedBuildingId],
  );

  const maxCalDate = useMemo(() => getMaxCalendarDate(mode, selectedPkg), [mode, selectedPkg]);

  const startDateTime = useMemo(() => {
    const baseDate = mode === 'hourly' ? selectedDate : pkgStartDate;
    if (!baseDate) return null;
    const [h, m] = selectedTime.split(':').map(Number);
    const d = new Date(baseDate);
    d.setHours(h, m, 0, 0);
    return d;
  }, [mode, selectedDate, selectedTime, pkgStartDate]);

  const endDateTime = useMemo(() => {
    if (mode === 'hourly') {
      if (!startDateTime) return null;
      return new Date(startDateTime.getTime() + durationHours * 60 * 60 * 1000);
    }
    if (startDateTime && selectedPkg) {
      return new Date(startDateTime.getTime() + selectedPkg.durationDays * 24 * 60 * 60 * 1000);
    }
    return null;
  }, [mode, startDateTime, durationHours, selectedPkg]);

  const estimatedAmount = useMemo(() => {
    if (mode === 'package' && selectedPkg) return selectedPkg.price;
    // Rough estimate for hourly — will be replaced by API estimate
    const building = selectedBuilding?.building;
    if (!building?.pricing?.hourlyRate) return 0;
    const rate = selectedVehicleType === 'motorcycle'
      ? building.pricing.hourlyRate * (building.pricing.motorcycleMultiplier || 0.5)
      : building.pricing.hourlyRate;
    return Math.ceil(rate * durationHours);
  }, [mode, selectedPkg, selectedBuilding, selectedVehicleType, durationHours]);

  const filteredPackages = useMemo(() => {
    if (!selectedVehicleType) return packages;
    return packages.filter((pkg) => {
      const isCar = isCarPackage(pkg);
      return selectedVehicleType === 'car' ? isCar : !isCar;
    });
  }, [packages, selectedVehicleType]);

  const plateOptions = useMemo(() => {
    if (!user) return [];
    const base = selectedVehicleType
      ? user.licensePlates.filter((p) => {
        const t = p.vehicleType?.toLowerCase();
        if (selectedVehicleType === 'motorcycle') return t === 'motorcycle' || t === 'bike';
        return t !== 'motorcycle' && t !== 'bike';
      })
      : user.licensePlates;
    return base.filter((p) => !bookedPlates.includes(p.plateNumber));
  }, [user, selectedVehicleType, bookedPlates]);

  const unavailableSlotCodes = useMemo(() => {
    return slots.filter((s) => {
      if (s.status !== 'available') return true;
      if (!s.reservable) return true;
      return false;
    }).map((s) => s.code);
  }, [slots]);

  const unsupportedSlotCodes = useMemo(() => {
    if (!selectedVehicleType) return [];
    return slots.filter((s) => {
      if (s.status !== 'available') return false;
      if (!s.reservable) return false;
      return s.vehicleType !== 'all' && s.vehicleType !== selectedVehicleType;
    }).map((s) => s.code);
  }, [slots, selectedVehicleType]);

  const selectedFloorInfo = useMemo(() => floorsData.find((f) => f._id === selectedFloorIdModal) || null, [floorsData, selectedFloorIdModal]);

  const canSubmit = Boolean(
    selectedBuildingId && selectedSlot && selectedPlate && startDateTime && endDateTime && !isSubmitting
  );

  /* ── Handlers ── */
  const handleBuildingChange = (id: string) => {
    setSelectedBuildingId(id);
    setSelectedSlot(null);
    setSelectedPlate('');
    setBookingError(null);
    setBookingSuccess(null);
    setSelectedPkg(null);
  };

  const handleSlotClick = (code: string) => {
    if (unavailableSlotCodes.includes(code)) return;
    if (unsupportedSlotCodes.includes(code)) return;
    setSelectedSlot(code);
    setBookingError(null);
    // Auto-select first available plate
    if (!selectedPlate && plateOptions.length > 0) {
      setSelectedPlate(plateOptions[0].plateNumber);
    }
  };

  const handleConfirmBooking = async () => {
    setBookingError(null);
    setBookingSuccess(null);
    if (!startDateTime || !endDateTime || !selectedPlate || !selectedBuildingId) return;

    if (startDateTime.getTime() < Date.now() - 5 * 60 * 1000) {
      setBookingError('Thời gian nhận bãi không được ở trong quá khứ. Vui lòng chọn thời gian khác.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'hourly') {
        // Find vehicleTypeId from building's vehicle types
        const vt = vehicleTypesForBuilding.find((v) => {
          const c = (v.code || v.name || '').toLowerCase();
          if (selectedVehicleType === 'motorcycle') return /motor|xe|máy|bike|moto/i.test(c);
          return /car|oto|ô t|auto/i.test(c);
        });

        // Find the slot's _id
        const slotRecord = slots.find((s) => s.code === selectedSlot);

        await userApi.reservations.create({
          buildingId: selectedBuildingId,
          plateNumber: selectedPlate,
          vehicleTypeId: vt?._id,
          vehicleType: selectedVehicleType || undefined,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          slotId: slotRecord?._id,
        });
        setBookingSuccess(`Đặt chỗ thành công! Ô ${selectedSlot} từ ${fmtShort(startDateTime)} đến ${fmtShort(endDateTime)}`);
      } else if (selectedPkg) {
        const res = await userApi.longTermSubscriptions.create({
          packageId: selectedPkg._id,
          plateNumber: selectedPlate,
          slotId: slots.find((s) => s.code === selectedSlot)?._id,
          startDate: startDateTime.toISOString(),
        });
        const data = (res as any)?.data;
        if (data?.checkoutUrl) {
          setBookingSuccess('Chuyển hướng đến cổng thanh toán PayOS...');
          window.location.href = data.checkoutUrl;
        } else {
          setBookingSuccess(`Đăng ký gói "${selectedPkg.name}" thành công!`);
        }
      }
      setSelectedSlot(null);
      setShowSlotModal(false);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Không thể hoàn tất đặt chỗ');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session || !user) return <Navigate to="/auth/login" replace />;

  /* ── Render ── */
  return (
    <main className="min-h-screen bg-[#060a11] text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col gap-3 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <button type="button" onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-300 transition hover:border-orange-300/30 hover:text-orange-200"
          >
            <ArrowLeft size={14} /> Trang chủ
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowHistory(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-2 text-xs font-black uppercase tracking-wider text-yellow-400 transition hover:border-yellow-400/40 hover:bg-yellow-500/10 hover:text-yellow-300"
            >
              <CalendarClock size={14} /> Lịch sử
            </button>
          </div>
        </motion.div>

        {/* ── Tab Bar ── */}
        <div className="mb-6 flex items-center gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1.5">
          {[
            { key: 'hourly' as BookingMode, label: 'Đặt theo giờ', icon: <Timer size={14} /> },
            { key: 'package' as BookingMode, label: 'Đăng ký gói dài hạn', icon: <Package size={14} /> },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setMode(tab.key);
                setSelectedSlot(null);
                setBookingError(null);
                setBookingSuccess(null);
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs font-black uppercase tracking-wider transition-all duration-200 ${mode === tab.key
                ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 shadow-[0_0_16px_rgba(249,115,22,0.2)]'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Alerts are now displayed as floating notification toasts */}


        {/* ── Main Wizard ── */}
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Left: Booking Form */}
          <div className="space-y-5">
            {/* Building + Vehicle + Plate */}
            <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={16} className="text-cyan-300/70" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/70">Thông tin cơ bản</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Tòa nhà</span>
                  <CustomSelect
                    value={selectedBuildingId}
                    onChange={handleBuildingChange}
                    options={[
                      { value: '', label: '-- Chọn tòa nhà --' },
                      ...rows.map((r) => ({ value: r.building._id, label: r.building.name })),
                    ]}
                    placeholder="-- Chọn tòa nhà --"
                  />
                </div>
                <div>
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Loại xe</span>
                  <CustomSelect
                    value={selectedVehicleType}
                    onChange={(val) => {
                      setSelectedVehicleType(val as VehicleKind | '');
                      setSelectedSlot(null);
                      setSelectedPlate('');
                      setSelectedPkg(null);
                    }}
                    options={[
                      { value: '', label: '-- Chọn loại xe --' },
                      { value: 'car', label: '🚗 Ô tô' },
                      { value: 'motorcycle', label: '🏍️ Xe máy' },
                    ]}
                    placeholder="-- Chọn loại xe --"
                  />
                </div>
              </div>

              {/* Plate selection right below vehicle type */}
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={14} className="text-amber-300/70" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Biển số xe</span>
                </div>
                <CustomSelect
                  value={selectedPlate}
                  onChange={setSelectedPlate}
                  disabled={plateOptions.length === 0}
                  options={[
                    { value: '', label: plateOptions.length === 0 ? '-- Tất cả biển số xe phù hợp đều đã đặt chỗ --' : '-- Chọn biển số --' },
                    ...plateOptions.map((p) => ({
                      value: p.plateNumber,
                      label: `${p.plateNumber} — ${p.vehicleType === 'motorcycle' ? '🏍️ Xe máy' : '🚗 Ô tô'}`,
                    })),
                  ]}
                  placeholder="-- Chọn biển số --"
                />
              </div>
            </div>

            {/* ── Hourly Mode ── */}
            <AnimatePresence mode="wait">
              {mode === 'hourly' && (
                <motion.div key="hourly" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="space-y-5"
                >
                  {/* Date */}
                  <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <CalendarClock size={16} className="text-orange-300/70" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300/70">Chọn ngày nhận xe</span>
                    </div>
                    <MiniCalendar selectedDate={selectedDate} onSelect={setSelectedDate} maxDate={maxCalDate} />
                    <p className="mt-2 text-[10px] font-semibold text-slate-500">
                      Chỉ được đặt trước tối đa 7 ngày
                    </p>
                  </div>

                  {/* Time */}
                  <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock size={16} className="text-orange-300/70" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300/70">Giờ nhận xe</span>
                    </div>
                    <TimeScroller selected={selectedTime} onSelect={setSelectedTime} />
                  </div>

                  {/* Duration */}
                  <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Timer size={16} className="text-orange-300/70" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300/70">Số giờ sử dụng</span>
                    </div>
                    <DurationSelector hours={durationHours} onSelect={setDurationHours} />
                  </div>
                </motion.div>
              )}

              {/* ── Package Mode ── */}
              {mode === 'package' && (
                <motion.div key="package" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="space-y-5"
                >
                  {/* Package Cards */}
                  <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300/70">Chọn gói dài hạn</span>
                    </div>

                    {packages.length === 0 ? (
                      <p className="text-sm text-slate-500 font-semibold py-4 text-center">
                        {isLoadingBuildings ? 'Đang tải...' : 'Không có gói nào cho tòa nhà này.'}
                      </p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {packages.map((pkg) => {
                          const cat = packageCategory(pkg);
                          const colors = categoryColors[cat];
                          const isSelected = selectedPkg?._id === pkg._id;
                          const isCar = isCarPackage(pkg);
                          // isLocked: only when a vehicle type IS selected and this package doesn't match
                          const isLocked = !!selectedVehicleType && (selectedVehicleType === 'car' ? !isCar : isCar);
                          return (
                            <PackageCard
                              key={pkg._id}
                              pkg={pkg}
                              isSelected={isSelected}
                              isLocked={isLocked}
                              cat={cat}
                              colors={colors}
                              onClick={() => {
                                if (isLocked) return;
                                setSelectedPkg(pkg);
                                setPkgStartDate(null);
                                const nextType = isCar ? 'car' : 'motorcycle';
                                if (selectedVehicleType !== nextType) {
                                  setSelectedVehicleType(nextType);
                                  setSelectedSlot(null);
                                  setSelectedPlate('');
                                }
                              }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Package Date */}
                  {selectedPkg && (
                    <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <CalendarClock size={16} className="text-purple-300/70" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300/70">Ngày bắt đầu gói</span>
                      </div>
                      <MiniCalendar selectedDate={pkgStartDate} onSelect={setPkgStartDate} maxDate={maxCalDate} />
                      <p className="mt-2 text-[10px] font-semibold text-slate-500">
                        {selectedPkg.durationDays <= 7
                          ? 'Gói tuần: chọn trong vòng 7 ngày tới'
                          : selectedPkg.durationDays <= 30
                            ? 'Gói tháng: chọn trong tháng này hoặc tháng sau'
                            : 'Gói năm: chọn trong năm nay hoặc năm sau'}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Slot Selection Button ── */}
            <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={16} className="text-cyan-300/70" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/70">Chọn chỗ đỗ</span>
              </div>

              <div className="flex items-center gap-3">
                <motion.button
                  type="button"
                  onClick={() => setShowSlotModal(true)}
                  disabled={!selectedBuildingId}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 px-4 py-4 text-sm font-black uppercase tracking-wider text-cyan-200 transition-all hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500 disabled:bg-transparent"
                >
                  <MapPin size={16} /> Chọn chỗ đỗ
                </motion.button>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center min-w-[100px]">
                  <p className="text-[9px] font-bold uppercase text-slate-500">Ô đỗ</p>
                  <p className="mt-1 font-mono text-xl font-black text-orange-300">{selectedSlot || '—'}</p>
                </div>
              </div>
            </div>

          </div>


          {/* Right: Summary Sidebar */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-3xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent p-5">
              <div className="flex items-center gap-2 mb-5">
                <CalendarClock size={16} className="text-orange-300/70" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300/70">Tóm tắt đặt chỗ</span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-400">Tòa nhà</span>
                  <span className="font-black text-white">{selectedBuilding?.building.name || '—'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-400">Chế độ</span>
                  <span className="font-black text-white">{mode === 'hourly' ? 'Theo giờ' : selectedPkg?.name || 'Gói dài hạn'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-400">Loại xe</span>
                  <span className="font-black text-white flex items-center gap-1.5">
                    {selectedVehicleType === 'motorcycle' ? <><Bike size={12} className="text-purple-300" /> Xe máy</> : selectedVehicleType === 'car' ? <><Car size={12} className="text-cyan-300" /> Ô tô</> : '—'}
                  </span>
                </div>

                <div className="h-px bg-white/[0.06]" />

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-[9px] font-bold uppercase text-slate-500">Ô đỗ</p>
                    <p className="mt-1 font-mono text-lg font-black text-orange-300">{selectedSlot || '—'}</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-[9px] font-bold uppercase text-slate-500">Biển số</p>
                    <p className="mt-1 font-mono text-sm font-black text-cyan-200 truncate">{selectedPlate || '—'}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="text-[9px] font-bold uppercase text-slate-500">Nhận bãi</p>
                  <p className="mt-1 text-sm font-black text-white">{startDateTime ? fmtShort(startDateTime) : '—'}</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="text-[9px] font-bold uppercase text-slate-500">Trả bãi</p>
                  <p className="mt-1 text-sm font-black text-white">{endDateTime ? fmtShort(endDateTime) : '—'}</p>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3">
                  <span className="text-xs font-bold text-emerald-200">Số tiền</span>
                  <span className="font-mono text-sm font-black text-emerald-300">{estimatedAmount ? fmtMoney(estimatedAmount) : '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sticky Footer ── */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-[#060a11]/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="hidden text-xs font-semibold text-slate-400 sm:block">
              {startDateTime && endDateTime ? (
                <>
                  <span className="text-white">Nhận bãi:</span> {fmtShort(startDateTime)}
                  <span className="mx-2 text-slate-600">—</span>
                  <span className="text-white">Trả bãi:</span> {fmtShort(endDateTime)}
                  <span className="mx-2 text-slate-600">|</span>
                  <span className="text-emerald-300 font-black">{fmtMoney(estimatedAmount)}</span>
                </>
              ) : (
                'Chọn thời gian và chỗ đỗ để đặt chỗ'
              )}
            </div>
            <motion.button
              type="button"
              disabled={!canSubmit}
              onClick={handleConfirmBooking}
              whileHover={canSubmit ? { scale: 1.02 } : {}}
              whileTap={canSubmit ? { scale: 0.98 } : {}}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-3 text-sm font-black uppercase tracking-wider text-slate-950 shadow-[0_0_24px_rgba(249,115,22,0.3)] transition-all disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 disabled:shadow-none"
            >
              <ShieldCheck size={16} />
              {isSubmitting ? 'Đang xử lý...' : mode === 'hourly' ? 'Xác nhận đặt chỗ' : 'Mua gói'}
            </motion.button>
          </div>
        </div>

        {/* Extra bottom padding for sticky footer */}
        <div className="h-20" />
      </div>

      {/* ── Slot Selection Modal ── */}
      <AnimatePresence>
        {showSlotModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 backdrop-blur-md"
            onClick={() => setShowSlotModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[90vh] w-full max-w-5xl overflow-auto rounded-3xl border border-slate-700/60 bg-[#080d17] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.55)] sm:p-6"
            >
              <ParkingMap2D
                interactive
                slots={selectedFloorIdModal ? slots.map((s) => ({
                  code: s.code,
                  status: s.status === 'available' && s.reservable ? 'available' : 'unavailable',
                  vehicleType: s.vehicleType === 'all' ? undefined : s.vehicleType,
                })) : []}
                selectedSlot={selectedSlot}
                unavailableSlots={unavailableSlotCodes}
                unsupportedSlots={unsupportedSlotCodes}
                onSlotClick={handleSlotClick}
                onConfirm={() => setShowSlotModal(false)}
                onClose={() => setShowSlotModal(false)}
                className="w-full bg-transparent p-0 border-none rounded-none shadow-none"
                placeholder={
                  !selectedFloorIdModal ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                      <MapPin size={36} className="text-slate-600 mb-3 animate-pulse" />
                      <span className="text-sm font-medium">Vui lòng chọn tầng để hiển thị sơ đồ ô đỗ</span>
                    </div>
                  ) : isLoadingSlots ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent mb-3" />
                      <span className="text-sm font-medium">Đang tải danh sách ô đỗ...</span>
                    </div>
                  ) : null
                }
              >
                {/* Floor selector & Guide note */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="flex-1">
                    <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Khu vực / Tầng</span>
                    <CustomSelect
                      value={selectedFloorIdModal}
                      onChange={(val) => {
                        setSelectedFloorIdModal(String(val || ''));
                        setSelectedSlot(null);
                      }}
                      options={[
                        { value: '', label: '-- Chọn tầng --' },
                        ...floorsData.map((f) => ({ value: f._id, label: `Tầng ${f.code || f.name || ''} (${f.availableSlots}/${f.totalSlots})` })),
                      ]}
                      placeholder="-- Chọn tầng --"
                    />
                  </div>
                  {selectedVehicleType && (
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5 text-xs text-slate-400 flex items-center gap-2 max-w-md">
                      <span>
                        Bản đồ đang lọc theo <strong>{selectedVehicleType === 'car' ? 'Ô tô' : 'Xe máy'}</strong>. Các ô đỗ không phù hợp sẽ tự động mờ đi.
                      </span>
                    </div>
                  )}
                </div>
              </ParkingMap2D>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── History Modal ── */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            onClick={() => setShowHistory(false)}
          >
            {/* Background glowing flare */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-orange-500/10 blur-[120px] pointer-events-none" />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-[0_0_80px_rgba(0,0,0,0.8),_inset_0_1px_1px_rgba(255,255,255,0.1)] flex flex-col"
            >
              {/* Modal Header */}
              <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-orange-500/10 p-2 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                    <CalendarClock size={20} className="text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white tracking-wide">Lịch sử đặt chỗ</h2>
                    <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5">Theo dõi & Quản lý các lượt đỗ xe</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="rounded-full border border-white/5 bg-white/[0.02] p-2 text-slate-400 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-auto pr-1">
                <ReservationHistoryTab />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Center Notification Popup Modal ── */}
      <AnimatePresence>
        {(bookingSuccess || bookingError) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm pointer-events-auto"
            onClick={() => {
              setBookingSuccess(null);
              setBookingError(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm overflow-hidden rounded-3xl border p-6 text-left shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl bg-slate-900/95 pointer-events-auto"
              style={{
                borderColor: bookingSuccess ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)',
              }}
            >
              {bookingSuccess ? (
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.4 }}
                    className="rounded-full bg-emerald-500/10 p-3.5 border border-emerald-500/20 mb-4 shrink-0"
                  >
                    <CheckCircle2 size={32} className="text-emerald-400" />
                  </motion.div>
                  <h3 className="text-lg font-black uppercase tracking-wider text-emerald-400">Thành công!</h3>
                  <p className="mt-3 text-sm font-medium text-slate-300 leading-relaxed break-words">
                    {bookingSuccess}
                  </p>
                  <button
                    type="button"
                    onClick={() => setBookingSuccess(null)}
                    className="mt-6 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-950 transition hover:brightness-110 active:scale-95 shadow-[0_4px_15px_rgba(16,185,129,0.2)]"
                  >
                    Đồng ý
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    initial={{ x: 0 }}
                    animate={{ x: [-10, 10, -10, 10, 0] }}
                    transition={{ duration: 0.4 }}
                    className="rounded-full bg-rose-500/10 p-3.5 border border-rose-500/20 mb-4 shrink-0"
                  >
                    <XCircle size={32} className="text-rose-400" />
                  </motion.div>
                  <h3 className="text-lg font-black uppercase tracking-wider text-rose-400">Đã xảy ra lỗi</h3>
                  <p className="mt-3 text-sm font-medium text-slate-300 leading-relaxed break-words">
                    {bookingError}
                  </p>
                  <button
                    type="button"
                    onClick={() => setBookingError(null)}
                    className="mt-6 w-full rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-950 transition hover:brightness-110 active:scale-95 shadow-[0_4px_15px_rgba(244,63,94,0.2)]"
                  >
                    Đóng
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
