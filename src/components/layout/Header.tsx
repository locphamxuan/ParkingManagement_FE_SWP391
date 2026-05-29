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
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-gradient-to-b from-orange-100 to-orange-50 border border-gray-100 grid place-items-center">
            <span className="w-2 h-2 bg-orange-400 rounded-full" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Parking Building Management System</p>
            <h1 className="text-lg font-semibold">PBMS Control Hub</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-sm font-semibold">Ho tro 24/7</div>
          <div className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">
            {session?.token ? `Xin chao, ${user?.fullName || user?.email || 'nguoi dung'}` : 'Chua dang nhap'}
          </div>
          <div className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">{activeLabel}</div>

          <nav className="flex items-center gap-2" aria-label="Dieu huong tai khoan">
            {actions.map((action) => (
              <button
                key={action.key}
                className={`px-3 py-1 rounded-lg font-semibold ${currentView === action.key || (currentView === 'auth' && action.key === 'login') ? 'bg-blue-600 text-white' : 'text-gray-700 bg-white border'}`}
                type="button"
                onClick={action.onClick}
              >
                {action.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-2">
        <div className="text-sm text-gray-500 mb-2">Nghiep vu chinh</div>
        <nav className="flex gap-2" aria-label="Chuc nang nghiep vu">
          {modules.map((module) => (
            <button
              key={module.id}
              className={`px-3 py-1 rounded-full text-sm ${module.available ? 'bg-white text-gray-800 border' : 'bg-gray-50 text-gray-400'}`}
              type="button"
              onClick={() => onModuleAction(module)}
            >
              {module.title}
            </button>
          ))}
        </nav>
      </div>

      {notice?.message ? (
        <div className="max-w-6xl mx-auto px-4 py-2 text-sm text-gray-700">{notice.message}</div>
      ) : null}
    </header>
  );
}
