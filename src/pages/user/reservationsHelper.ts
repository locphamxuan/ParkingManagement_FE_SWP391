import type { LongTermPackage } from '@/services/user/userApi';

export type BookingMode = 'hourly' | 'package';
export type VehicleKind = 'car' | 'motorcycle';

const money = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export function fmtMoney(v: number | undefined | null) {
  return money.format(v || 0);
}

export function fmtTime(iso: string | undefined | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function fmtShort(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${String(
    d.getDate()
  ).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function normalizeVehicleTypeCode(raw?: string | null): VehicleKind | 'all' {
  if (!raw) return 'all';
  const code = String(raw).toLowerCase();
  if (
    code.includes('motor') ||
    code.includes('moto') ||
    code.includes('xe') ||
    code.includes('motorcycle') ||
    code.includes('bike')
  )
    return 'motorcycle';
  if (code.includes('car') || code.includes('ô tô') || code.includes('oto') || code.includes('ôto')) return 'car';
  return 'all';
}

export function isCarPackage(pkg: LongTermPackage): boolean {
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
  if (
    name.includes('xe máy') ||
    name.includes('motor') ||
    name.includes('moto') ||
    codeAttr.includes('moto') ||
    codeAttr.includes('bike')
  )
    return false;
  if (name.includes('ô tô') || name.includes('oto') || name.includes('car') || codeAttr.includes('car')) return true;
  return false;
}

export function getMaxCalendarDate(mode: BookingMode, pkg?: LongTermPackage | null): Date {
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

export function packageCategory(pkg: LongTermPackage): 'weekly' | 'monthly' | 'yearly' {
  if (pkg.durationDays <= 7) return 'weekly';
  if (pkg.durationDays <= 30) return 'monthly';
  return 'yearly';
}

export const categoryLabels = { weekly: 'Gói tuần', monthly: 'Gói tháng', yearly: 'Gói năm' };

export const categoryColors = {
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
    glitterColors: ['bg-cyan-300', 'bg-sky-200', 'bg-blue-300'],
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
    glitterColors: ['bg-amber-300', 'bg-orange-400', 'bg-yellow-300'],
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
    glitterColors: ['bg-purple-300', 'bg-pink-300', 'bg-yellow-300'],
  },
};
