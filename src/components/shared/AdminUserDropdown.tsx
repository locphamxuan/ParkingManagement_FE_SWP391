import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, User, LogOut, History } from 'lucide-react';

interface Props {
  email: string;
  onLogout: () => void;
}

export function AdminUserDropdown({ email, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleViewProfile = () => {
    setOpen(false);
    if (location.pathname.startsWith('/manager')) {
      navigate('/manager/profile');
    } else if (location.pathname.startsWith('/admin')) {
      navigate('/admin/dashboard/profile');
    } else {
      navigate('/profile');
    }
  };

  const handleViewReservationHistory = () => {
    setOpen(false);
    navigate('/reservations', { state: { openHistory: true } });
  };

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-200 shadow-sm transition hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-orange-500/50 sm:text-sm"
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
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">
          <User size={16} />
        </span>
        <span className="max-w-[170px] truncate text-xs font-medium uppercase tracking-[0.06em] text-slate-300 sm:text-sm">
          {email}
        </span>
        <ChevronDown size={14} className="text-slate-500" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-xl shadow-black/40">
          <button
            type="button"
            className="user-dropdown-item w-full px-4 py-3 text-left text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
            onClick={handleViewProfile}
          >
            Hồ sơ
          </button>
          <button
            type="button"
            className="user-dropdown-item w-full px-4 py-3 text-left text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white border-t border-white/5"
            onClick={handleViewReservationHistory}
          >
            <History size={14} className="inline-block align-middle" />
            <span className="ml-2 align-middle">Lịch sử đặt chỗ</span>
          </button>
          <button
            type="button"
            className="user-dropdown-item w-full px-4 py-3 text-left text-sm text-rose-400 transition hover:bg-slate-800 border-t border-white/5"
            onClick={onLogout}
          >
            <LogOut size={14} className="inline-block align-middle" />
            <span className="ml-2 align-middle">Đăng xuất</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminUserDropdown;
