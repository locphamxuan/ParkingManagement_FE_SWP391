interface StatusBadgeProps {
  status?: string | null;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = (status || '').toLowerCase();

  const labelMap: Record<string, string> = {
    active: 'Active',
    ok: 'OK',
    success: 'Success',
    online: 'Online',
    low: 'Low',
    warning: 'Warning',
    pending: 'Pending',
    review: 'In Review',
    maintenance: 'Maintenance',
    medium: 'Medium',
    critical: 'Critical',
    danger: 'Danger',
    blocked: 'Blocked',
    offline: 'Offline',
    high: 'Cao',
    admin: 'Admin',
    manager: 'Manager',
    staff: 'Staff',
    user: 'User',
    inactive: 'Inactive',
    available: 'Available',
    occupied: 'Occupied',
    reserved: 'Reserved',
    // Reservation statuses
    confirmed: 'Confirmed',
    checked_in: 'Checked in',
    completed: 'Completed',
    expired: 'Expired',
    cancelled: 'Cancelled',
  };

  const display = labelMap[normalized] ?? status ?? 'N/A';

  // Custom premium color classes
  if (['active', 'ok', 'success', 'online', 'low', 'available', 'confirmed', 'completed'].includes(normalized)) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/50 shadow-[0_2px_8px_rgba(16,185,129,0.06)] status-badge-success">
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        {display}
      </span>
    );
  }
  
  if (['warning', 'pending', 'review', 'maintenance', 'medium'].includes(normalized)) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200/50 shadow-[0_2px_8px_rgba(245,158,11,0.06)] status-badge-warning">
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        {display}
      </span>
    );
  }

  if (['checked_in'].includes(normalized)) {
    return (
      <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 border border-sky-200/50 shadow-[0_2px_8px_rgba(14,165,233,0.06)] status-badge-info">
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
        {display}
      </span>
    );
  }

  if (['occupied'].includes(normalized)) {
    return (
      <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 border border-sky-200/50 shadow-[0_2px_8px_rgba(14,165,233,0.06)] status-badge-info">
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-sky-500" />
        {display}
      </span>
    );
  }

  if (['reserved'].includes(normalized)) {
    return (
      <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 border border-violet-200/50 shadow-[0_2px_8px_rgba(139,92,246,0.06)] status-badge-reserved">
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
        {display}
      </span>
    );
  }

  if (['critical', 'danger', 'blocked', 'offline', 'high', 'inactive', 'expired', 'cancelled'].includes(normalized)) {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200/50 shadow-[0_2px_8px_rgba(244,63,94,0.06)] status-badge-danger">
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
        {display}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-600 border border-stone-200/50 status-badge-default">
      {display}
    </span>
  );
}
