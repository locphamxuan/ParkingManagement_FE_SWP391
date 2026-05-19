import ModuleGrid from '../components/modules/ModuleGrid';
import type { LegacyModule } from '../data/mainFlow';
import './DashboardPage.css';

interface DashboardUser {
  fullName?: string;
  email?: string;
  role?: string;
  phone?: string;
  isActive?: boolean;
  lastLoginAt?: string;
}

interface DashboardPageProps {
  user?: DashboardUser | null;
  onLogout: () => void;
  onRefresh: () => void;
  modules: LegacyModule[];
  onAction: (module: LegacyModule) => void;
}

export default function DashboardPage({ user, onLogout, onRefresh, modules, onAction }: DashboardPageProps) {
  const displayName = user?.fullName || user?.email || 'nguoi dung';

  return (
    <main className="workspace dashboard-view">
      <section className="panel dashboard-hero">
        <div>
          <p className="eyebrow">Phien lam viec</p>
          <h2>Xin chao, {displayName}!</h2>
          <p className="hero-text">
            Day la bang dieu khien cua ban trong PBMS. Tai day co the xem ho so ca nhan va di toi cac chuc nang chinh cua he thong.
          </p>
        </div>

        <div className="session-actions">
          <button className="ghost-button" type="button" onClick={onRefresh}>
            Lam moi ho so
          </button>
          <button className="primary-button danger" type="button" onClick={onLogout}>
            Dang xuat
          </button>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="panel summary-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Ho so nguoi dung</p>
              <h3>{displayName}</h3>
            </div>
            <span className="role-badge">{user?.role || 'user'}</span>
          </div>

          <dl className="profile-list">
            <div>
              <dt>Email</dt>
              <dd>{user?.email || '-'}</dd>
            </div>
            <div>
              <dt>So dien thoai</dt>
              <dd>{user?.phone || '-'}</dd>
            </div>
            <div>
              <dt>Trang thai</dt>
              <dd>{user?.isActive ? 'Dang hoat dong' : 'Bi khoa'}</dd>
            </div>
            <div>
              <dt>Dang nhap gan nhat</dt>
              <dd>{formatDate(user?.lastLoginAt)}</dd>
            </div>
          </dl>
        </article>

        <article className="panel roadmap-card">
          <p className="eyebrow">Lo trinh</p>
          <div className="roadmap-list">
            <div>
              <strong>Quan ly bai</strong>
              <span>Buildings, floors, slots, reservations</span>
            </div>
            <div>
              <strong>Van hanh</strong>
              <span>Check-in, check-out, shift revenues</span>
            </div>
            <div>
              <strong>Tai chinh</strong>
              <span>Wallet, payments, subscriptions</span>
            </div>
          </div>
        </article>
      </section>

      <section className="panel module-panel dashboard-module-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Chuc nang chinh</p>
            <h2>Bang dieu khien</h2>
          </div>
        </div>

        <ModuleGrid modules={modules} compact onAction={onAction} />
      </section>
    </main>
  );
}

function formatDate(value?: string) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
