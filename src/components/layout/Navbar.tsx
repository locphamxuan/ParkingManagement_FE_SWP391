import { Bell } from 'lucide-react';
import AdminUserDropdown from './AdminUserDropdown';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  title: string;
  email: string;
  onLogout: () => void;
  fullName?: string;
  role?: string;
  showNotification?: boolean;
  /** Hide search bar (default false) */
  hideSearch?: boolean;
  /** Show compact profile (unused — kept for API compat) */
  compactProfile?: boolean;
}

export function Navbar({ title, email, onLogout, fullName, role, showNotification = true }: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/8 bg-slate-900/90 px-6 py-4 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">
            HỆ THỐNG ĐIỀU HÀNH
          </p>
          <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">{title}</h1>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          {showNotification && (
            <Button
              variant="secondary"
              size="sm"
              className="gap-2 rounded-full border border-white/10 bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 hover:text-white shadow-sm px-4 transition-all"
            >
              <Bell size={14} className="text-slate-400" />
              <span className="hidden sm:inline font-medium text-xs">Thông báo</span>
            </Button>
          )}

          <AdminUserDropdown
            email={email}
            onLogout={onLogout}
            fullName={fullName}
            role={role}
          />
        </div>
      </div>
    </header>
  );
}
