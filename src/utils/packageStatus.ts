// Nguồn dùng chung cho nhãn/màu/tab của status GÓI DÀI HẠN phía user.
// BE trả về: pending | active | expired | cancelled.
// Dùng ở: ReservationHistoryTab, LongTermSubscriptionsPage, ProfilePage để đồng bộ.

export type PackageStatus = 'pending' | 'active' | 'expired' | 'cancelled';

export const PACKAGE_STATUS_LABELS: Record<PackageStatus, string> = {
  pending: 'Chờ kích hoạt',
  active: 'Đã mua',
  expired: 'Hết hạn',
  cancelled: 'Đã hủy',
};

// Class gồm border + bg + text — dùng trực tiếp làm className của badge.
export const PACKAGE_STATUS_BADGE: Record<PackageStatus, string> = {
  pending: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  active: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  expired: 'border-slate-500/20 bg-slate-500/10 text-slate-400',
  cancelled: 'border-rose-500/20 bg-rose-500/10 text-rose-400',
};

const FALLBACK_BADGE = 'border-slate-500/20 bg-slate-500/10 text-slate-400';

export const packageStatusLabel = (status: string): string =>
  PACKAGE_STATUS_LABELS[status as PackageStatus] ?? status;

export const packageStatusBadgeClass = (status: string): string =>
  PACKAGE_STATUS_BADGE[status as PackageStatus] ?? FALLBACK_BADGE;

// Bộ tab lọc cho chế độ gói dài hạn (value = đúng status API; 'all' = tất cả).
export const PACKAGE_STATUS_TABS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'active', label: PACKAGE_STATUS_LABELS.active },
  { value: 'expired', label: PACKAGE_STATUS_LABELS.expired },
  { value: 'cancelled', label: PACKAGE_STATUS_LABELS.cancelled },
] as const;
