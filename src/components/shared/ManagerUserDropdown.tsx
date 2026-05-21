import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  User,
  LogOut,
  LayoutDashboard,
  Building2,
  ParkingCircle,
  Truck,
  DollarSign,
  Package,
  Users,
  TrendingUp,
  MessageSquare,
  FileText,
} from 'lucide-react';

interface Props {
  email: string;
  onLogout: () => void;
}

const menuItems = [
  { label: 'Hồ sơ', icon: User, action: 'profile' },
  { label: 'Bảng điều khiển', icon: LayoutDashboard, path: '/manager/dashboard' },
  { label: 'Quản lý tầng', icon: Building2, path: '/manager/dashboard/floors' },
  { label: 'Quản lý chỗ đỗ', icon: ParkingCircle, path: '/manager/dashboard/slots' },
  { label: 'Quản lý phương tiện', icon: Truck, path: '/manager/dashboard/vehicles' },
  { label: 'Chính sách giá', icon: DollarSign, path: '/manager/dashboard/pricing' },
  { label: 'Quản lý gói', icon: Package, path: '/manager/dashboard/packages' },
  { label: 'Quản lý nhân viên', icon: Users, path: '/manager/dashboard/staff' },
  { label: 'Báo cáo doanh thu', icon: TrendingUp, path: '/manager/dashboard/revenue-report' },
  { label: 'Phản hồi', icon: MessageSquare, path: '/manager/dashboard/feedback' },
  { label: 'Nhật ký kiểm toán', icon: FileText, path: '/manager/dashboard/audit-logs' },
];

export function ManagerUserDropdown({ email, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const handleMenuClick = (item: typeof menuItems[0]) => {
    if (item.path) {
      navigate(item.path);
    }
    setOpen(false);
  };

  return (
    <div className="user-dropdown" ref={ref}>
      <button
        type="button"
        className="user-dropdown-button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
            setTimeout(() => {
              const first = ref.current?.querySelector<HTMLButtonElement>('.user-dropdown-item');
              first?.focus();
            }, 0);
          }
          if (e.key === 'Escape') setOpen(false);
        }}
      >
        <User size={16} style={{ marginRight: 8 }} />
        <span className="max-w-[170px] truncate text-xs sm:text-sm">{email}</span>
        <ChevronDown size={14} className="chev" />
      </button>

      {open && (
        <div className="user-dropdown-menu max-h-96 overflow-y-auto" role="menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                className="user-dropdown-item"
                onClick={() => handleMenuClick(item)}
              >
                <Icon size={14} style={{ marginRight: 8 }} />
                {item.label}
              </button>
            );
          })}
          <div className="border-t border-gray-200 my-1" />
          <button type="button" className="user-dropdown-item" onClick={onLogout}>
            <LogOut size={14} style={{ marginRight: 8 }} />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

export default ManagerUserDropdown;
