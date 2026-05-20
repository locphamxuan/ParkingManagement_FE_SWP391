import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, User, LogOut } from 'lucide-react';

interface Props {
  email: string;
  onLogout: () => void;
}

export function AdminUserDropdown({ email, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

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
        <div className="user-dropdown-menu" role="menu">
          <button type="button" className="user-dropdown-item" onClick={() => { setOpen(false); }}>
            Hồ sơ
          </button>
          <button type="button" className="user-dropdown-item" onClick={onLogout}>
            <LogOut size={14} style={{ marginRight: 8 }} /> Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminUserDropdown;
