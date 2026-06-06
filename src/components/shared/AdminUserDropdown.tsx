import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, User } from 'lucide-react';

interface Props {
  email: string;
  onLogout: () => void;
  fullName?: string;
  role?: string;
}

export function AdminUserDropdown({ email, onLogout, fullName, role }: Props) {
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
    }
  };

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const initials = (fullName ?? email)[0]?.toUpperCase() ?? '?';
  const displayName = fullName || email;
  const roleBadgeColor =
    role === 'admin'
      ? 'text-rose-400'
      : role === 'manager'
      ? 'text-amber-400'
      : 'text-sky-400';

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-200 shadow-sm transition hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-sm font-bold text-orange-400 border border-orange-500/20">
          {initials}
        </span>
        <span className="max-w-[140px] truncate text-xs font-medium text-slate-300">
          {displayName}
        </span>
        <ChevronDown size={13} className="shrink-0 text-slate-500" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-xl shadow-black/40">
          {/* Profile card */}
          <div className="px-4 py-4 border-b border-white/8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/20">
                <span className="text-sm font-bold text-orange-400">{initials}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{fullName || '—'}</p>
                <p className="text-xs text-slate-400 truncate">{email}</p>
                {role && (
                  <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${roleBadgeColor}`}>
                    {role}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-1">
            <button
              type="button"
              className="user-dropdown-item flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
              onClick={handleViewProfile}
            >
              <User size={14} className="text-slate-400" />
              Xem hồ sơ
            </button>
            <button
              type="button"
              className="user-dropdown-item flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-rose-400 transition hover:bg-rose-500/10 hover:text-rose-300 mt-0.5"
              onClick={() => { setOpen(false); onLogout(); }}
            >
              <LogOut size={14} />
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUserDropdown;
