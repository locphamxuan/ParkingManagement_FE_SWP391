import { useEffect, useMemo, useRef, useState } from 'react';
import Brand from '@/components/layout/Brand';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Header({ currentView, session, actions, onNavigate, onNavigateDashboard }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const fileInputRef = useRef(null);

  const profileAction = useMemo(
    () => actions.find((action) => action.key === 'dashboard'),
    [actions]
  );

  const logoutAction = useMemo(
    () => actions.find((action) => action.key === 'logout'),
    [actions]
  );

  useEffect(() => {
    if (!session?.token) {
      setAvatarUrl('');
      return;
    }

    const storageKey = `pbms-avatar-${session.user?.email || session.user?.id || 'default'}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setAvatarUrl(saved);
    }
  }, [session?.token, session?.user?.email, session?.user?.id]);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const handleClickOutside = (event) => {
      if (
        !event.target.closest('#user-menu-button') &&
        !event.target.closest('#user-dropdown')
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const storageKey = `pbms-avatar-${session.user?.email || session.user?.id || 'default'}`;
      localStorage.setItem(storageKey, dataUrl);
      setAvatarUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const initials = useMemo(() => {
    const name = session?.user?.fullName || session?.user?.email || 'QL';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')
      .slice(0, 2);
  }, [session?.user?.fullName, session?.user?.email]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Brand subtitle="Quản lý bãi giữ xe" />

        <nav className="hidden items-center gap-3 sm:flex" aria-label="Điều hướng chính">
          <NavPill active={currentView === 'home'} onClick={() => onNavigate('/')}>Trang chủ</NavPill>
          <NavPill active={currentView === 'about'} onClick={() => onNavigate('/about')}>Giới thiệu</NavPill>
          <NavPill active={currentView === 'contact'} onClick={() => onNavigate('/contact')}>Liên hệ</NavPill>
        </nav>

        <div className="flex items-center gap-2">
          {session?.token ? (
            <div className="relative">
              <button
                id="user-menu-button"
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-3 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-left text-sm text-amber-950 shadow-sm transition hover:bg-amber-100"
              >
                <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-amber-100 text-sm font-semibold text-amber-950">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </span>
                <span className="hidden truncate sm:block">
                  {session.user?.fullName || session.user?.email || 'Quản lý'}
                </span>
              </button>

              {isMenuOpen ? (
                <div
                  id="user-dropdown"
                  className="absolute right-0 z-50 mt-3 w-60 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl"
                >
                  <div className="border-b border-slate-100 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-amber-100 text-sm font-semibold text-amber-950">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                          initials
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {session.user?.fullName || session.user?.email || 'Quản lý'}
                        </p>
                        <p className="truncate text-xs text-slate-500">Hồ sơ cá nhân</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        fileInputRef.current?.click();
                      }}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-950 transition hover:bg-amber-100"
                    >
                      Chỉnh ảnh hồ sơ
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (profileAction) profileAction.onClick();
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Hồ sơ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (logoutAction) logoutAction.onClick();
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : null}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
          ) : (
            <span className="hidden text-xs font-medium text-slate-500 sm:inline">Khách gửi xe</span>
          )}

          {!session?.token &&
            actions.map((action) => (
              <Button
                key={action.key}
                type="button"
                variant={action.key === 'login' ? 'default' : 'outline'}
                size="sm"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
        </div>
      </div>
    </header>
  );
}

function NavPill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-4 py-2 text-xs font-semibold transition',
        active
          ? 'bg-amber-100 text-slate-950 shadow-sm shadow-amber-100'
          : 'text-slate-600 hover:bg-slate-100'
      )}
    >
      {children}
    </button>
  );
}
