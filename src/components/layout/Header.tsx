import type { LegacyModule } from '../../data/mainFlow';
import './Header.css';

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
    <header className="topbar">
      <div className="topbar-main">
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

        <div className="topbar-meta">
          <div className="status-chip contact">Ho tro 24/7</div>
          <div className="status-chip soft">
            {session?.token ? `Xin chao, ${user?.fullName || user?.email || 'nguoi dung'}` : 'Chua dang nhap'}
          </div>
          <div className="status-chip soft">{activeLabel}</div>
        </div>

        <nav className="topbar-actions auth-actions" aria-label="Dieu huong tai khoan">
          {actions.map((action) => (
            <button
              key={action.key}
              className={`nav-button ${currentView === action.key || (currentView === 'auth' && action.key === 'login') ? 'is-active' : ''}`}
              type="button"
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="topbar-workflows">
        <div className="workflow-label">Nghiep vu chinh</div>
        <nav className="workflow-nav" aria-label="Chuc nang nghiep vu">
          {modules.map((module) => (
            <button
              key={module.id}
              className={`workflow-chip ${module.available ? '' : 'muted'}`}
              type="button"
              onClick={() => onModuleAction(module)}
            >
              {module.title}
            </button>
          ))}
        </nav>
      </div>

      <div className={`notice ${notice?.type ? `is-${notice.type}` : ''}`} aria-live="polite">
        {notice?.message}
      </div>
    </header>
  );
}
