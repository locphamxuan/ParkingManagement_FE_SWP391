import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  const labelMap: Record<string, string> = {
    active: 'Hoạt động',
    ok: 'OK',
    success: 'Thành công',
    online: 'Online',
    low: 'Thấp',
    warning: 'Cảnh báo',
    pending: 'Đang chờ',
    review: 'Đang xem xét',
    maintenance: 'Bảo trì',
    medium: 'Trung bình',
    critical: 'Nguy cấp',
    danger: 'Nguy hiểm',
    blocked: 'Bị chặn',
    offline: 'Ngoại tuyến',
    high: 'Cao',
    admin: 'Quản trị viên',
    manager: 'Quản lý',
    staff: 'Nhân viên',
    user: 'Người dùng',
    inactive: 'Không hoạt động',
  };

  const display = labelMap[normalized] ?? status;

  if (['active', 'ok', 'success', 'online', 'low'].includes(normalized)) {
    return <Badge variant="success">{display}</Badge>;
  }
  if (['warning', 'pending', 'review', 'maintenance', 'medium'].includes(normalized)) {
    return <Badge variant="warning">{display}</Badge>;
  }
  if (['critical', 'danger', 'blocked', 'offline', 'high'].includes(normalized)) {
    return <Badge variant="danger">{display}</Badge>;
  }

  return <Badge variant="muted">{display}</Badge>;
}
