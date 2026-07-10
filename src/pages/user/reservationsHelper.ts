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

export function getMaxCalendarDate(mode: BookingMode, pkg?: LongTermPackage | null, maxAdvanceDays = 7): Date {
  const now = new Date();
  if (mode === 'hourly') {
    return new Date(now.getTime() + maxAdvanceDays * 24 * 60 * 60 * 1000);
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

export const categoryLabels = { weekly: 'Weekly Package', monthly: 'Monthly Package', yearly: 'Yearly Package' };

export const categoryColors = {
  weekly: {
    borderSelected: 'border-cyan-500 ring-2 ring-cyan-500/25',
    bgSelected: 'bg-gradient-to-br from-cyan-950/30 via-cyan-950/10 to-slate-950/30',
    shadowSelected: 'shadow-[0_0_20px_rgba(6,182,212,0.15)]',
    borderNormal: 'border-white/[0.06]',
    bgNormal: 'bg-white/[0.01]',
    borderHover: 'hover:border-cyan-500/40',
    bgHover: 'hover:bg-cyan-950/10',
    shadowHover: 'hover:shadow-[0_0_12px_rgba(6,182,212,0.06)]',
    text: 'text-cyan-400',
    accent: 'from-cyan-400 to-blue-500',
    glitterColors: ['bg-cyan-400', 'bg-sky-300', 'bg-blue-400'],
  },
  monthly: {
    borderSelected: 'border-orange-500 ring-2 ring-orange-500/25',
    bgSelected: 'bg-gradient-to-br from-orange-950/30 via-orange-950/10 to-slate-950/30',
    shadowSelected: 'shadow-[0_0_20px_rgba(249,115,22,0.15)]',
    borderNormal: 'border-white/[0.06]',
    bgNormal: 'bg-white/[0.01]',
    borderHover: 'hover:border-orange-500/40',
    bgHover: 'hover:bg-orange-950/10',
    shadowHover: 'hover:shadow-[0_0_12px_rgba(249,115,22,0.06)]',
    text: 'text-orange-400',
    accent: 'from-orange-400 to-amber-500',
    glitterColors: ['bg-amber-400', 'bg-orange-400', 'bg-yellow-400'],
  },
  yearly: {
    borderSelected: 'border-purple-500 ring-2 ring-purple-500/25',
    bgSelected: 'bg-gradient-to-br from-purple-950/30 via-purple-950/10 to-slate-950/30',
    shadowSelected: 'shadow-[0_0_25px_rgba(168,85,247,0.15)]',
    borderNormal: 'border-white/[0.06]',
    bgNormal: 'bg-white/[0.01]',
    borderHover: 'hover:border-purple-500/40',
    bgHover: 'hover:bg-purple-950/10',
    shadowHover: 'hover:shadow-[0_0_12px_rgba(168,85,247,0.06)]',
    text: 'text-purple-400',
    accent: 'from-yellow-400 via-pink-500 to-purple-500',
    glitterColors: ['bg-purple-400', 'bg-pink-400', 'bg-yellow-400'],
  },
};
