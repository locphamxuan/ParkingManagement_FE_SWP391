import ModuleGrid from '../components/modules/ModuleGrid';
import type { LegacyModule } from '../data/mainFlow';

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
    <main className="grid gap-6 p-6">
      <section className="p-6.5 flex items-start justify-between gap-4 border border-gray-200 rounded-lg bg-white">
        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-orange-600 font-bold">Phien lam viec</p>
          <h2 className="m-0 mb-3 text-2xl md:text-3xl font-bold text-gray-900">Xin chao, {displayName}!</h2>
          <p className="m-0 text-gray-600 max-w-2xl">
            Day la bang dieu khien cua ban trong PBMS. Tai day co the xem ho so ca nhan va di toi cac chuc nang chinh cua he thong.
          </p>
        </div>

        <div className="flex gap-2.5 flex-wrap">
          <button className="px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-100 text-gray-900 font-bold hover:bg-gray-200 transition-colors" type="button" onClick={onRefresh}>
            Lam moi ho so
          </button>
          <button className="px-4 py-2.5 rounded-lg border border-red-600 bg-gradient-to-br from-red-500 to-red-600 text-white font-bold hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/20" type="button" onClick={onLogout}>
            Dang xuat
          </button>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <article className="p-6 border border-gray-200 rounded-lg bg-white">
          <div className="flex justify-between gap-4 items-center mb-4.5">
            <div>
              <p className="mb-1 text-xs uppercase tracking-wider text-orange-600 font-bold">Ho so nguoi dung</p>
              <h3 className="m-0 text-lg font-bold text-gray-900">{displayName}</h3>
            </div>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-2px">{user?.role || 'user'}</span>
          </div>

          <dl className="grid gap-3.5 m-0">
            <div className="p-3.5 rounded-lg border border-gray-200 bg-white/2.5">
              <dt className="text-gray-500 text-xs mb-1.5">Email</dt>
              <dd className="m-0 text-gray-900 break-words">{user?.email || '-'}</dd>
            </div>
            <div className="p-3.5 rounded-lg border border-gray-200 bg-white/2.5">
              <dt className="text-gray-500 text-xs mb-1.5">So dien thoai</dt>
              <dd className="m-0 text-gray-900">{user?.phone || '-'}</dd>
            </div>
            <div className="p-3.5 rounded-lg border border-gray-200 bg-white/2.5">
              <dt className="text-gray-500 text-xs mb-1.5">Trang thai</dt>
              <dd className="m-0 text-gray-900">{user?.isActive ? 'Dang hoat dong' : 'Bi khoa'}</dd>
            </div>
            <div className="p-3.5 rounded-lg border border-gray-200 bg-white/2.5">
              <dt className="text-gray-500 text-xs mb-1.5">Dang nhap gan nhat</dt>
              <dd className="m-0 text-gray-900">{formatDate(user?.lastLoginAt)}</dd>
            </div>
          </dl>
        </article>

        <article className="p-6 border border-gray-200 rounded-lg bg-white">
          <p className="mb-4 text-xs uppercase tracking-wider text-orange-600 font-bold">Lo trinh</p>
          <div className="grid gap-3.5">
            <div className="p-3.5 rounded-lg border border-gray-200 bg-white/2.5">
              <strong className="block text-gray-900 font-bold">Quan ly bai</strong>
              <span className="block text-xs text-gray-600 mt-1">Buildings, floors, slots, reservations</span>
            </div>
            <div className="p-3.5 rounded-lg border border-gray-200 bg-white/2.5">
              <strong className="block text-gray-900 font-bold">Van hanh</strong>
              <span className="block text-xs text-gray-600 mt-1">Check-in, check-out, shift revenues</span>
            </div>
            <div className="p-3.5 rounded-lg border border-gray-200 bg-white/2.5">
              <strong className="block text-gray-900 font-bold">Tai chinh</strong>
              <span className="block text-xs text-gray-600 mt-1">Wallet, payments, subscriptions</span>
            </div>
          </div>
        </article>
      </section>

      <section className="p-6 border border-gray-200 rounded-lg bg-white grid gap-6">
        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-orange-600 font-bold">Chuc nang chinh</p>
          <h2 className="m-0 text-2xl font-bold text-gray-900">Bang dieu khien</h2>
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
