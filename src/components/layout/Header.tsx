import type { LegacyModule } from '../../data/mainFlow';

interface HeaderAction {
  key: string;
  label: string;
  onClick: () => void;
}

interface HeaderProps {
  currentView: string;
  session: { token?: string; user?: Record<string, unknown> | null } | null;
  notice: { message?: string; type?: string };
  actions: HeaderAction[];
  modules: LegacyModule[];
  onModuleAction: (module: LegacyModule) => void;
}

export default function Header({
  currentView,
  session,
  notice,
  actions,
  modules,
  onModuleAction,
}: HeaderProps) {
  const activeLabel =
    currentView === 'dashboard' ? 'Bang dieu khien' : currentView === 'auth' ? 'Tai khoan' : 'Trang chu';

  const user = session?.user as { fullName?: string; email?: string } | undefined;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-md mb-6">
      <div className="grid grid-cols-3 items-center gap-5 p-3.5 px-4.5">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <p className="eyebrow">Parking Building Management System</p>
            <h1>PBMS Control Hub</h1>
          </div>
        </div>

        <div className="flex gap-2.5 flex-wrap justify-center">
          <div className="px-3 py-2 rounded-full border border-slate-200 bg-white text-orange-600 border-orange-400/35 bg-orange-50 text-sm">Ho tro 24/7</div>
          <div className="px-3 py-2 rounded-full border border-slate-200 bg-white text-gray-500 text-sm">
            {session?.token ? `Xin chao, ${user?.fullName || user?.email || 'nguoi dung'}` : 'Chua dang nhap'}
          </div>
          <div className="px-3 py-2 rounded-full border border-slate-200 bg-white text-gray-500 text-sm">{activeLabel}</div>
        </div>

        <nav className="flex gap-2.5 flex-wrap justify-end" aria-label="Dieu huong tai khoan">
          {actions.map((action) => (
            <button
              key={action.key}
              className={`px-3.5 py-2.5 rounded-full border transition-all ${
                currentView === action.key || (currentView === 'auth' && action.key === 'login')
                  ? 'border-orange-400/40 bg-orange-100/10 -translate-y-0.5 shadow-inner shadow-orange-400/12'
                  : 'border-slate-200 bg-white hover:border-orange-400/40 hover:bg-orange-100/10 hover:-translate-y-0.5'
              }`}
              type="button"
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-gradient-to-r from-orange-500 to-amber-500 grid gap-2.5 px-4.5 py-2.5">
        <div className="text-xs uppercase tracking-widest text-white/85">Nghiep vu chinh</div>
        <nav className="flex gap-2.5 flex-wrap" aria-label="Chuc nang nghiep vu">
          {modules.map((module) => (
            <button
              key={module.id}
              className={`rounded-full border border-white/22 bg-white/12 px-3.5 py-2 font-bold text-orange-50 transition-all ${module.available ? '' : 'opacity-50'}`}
              type="button"
              onClick={() => onModuleAction(module)}
            >
              {module.title}
            </button>
          ))}
        </nav>
      </div>

      <div className={`px-4.5 py-2 aria-live="polite" ${notice?.type ? `is-${notice.type}` : ''}`}>
        {notice?.message}
      </div>
    </header>
  );
}
