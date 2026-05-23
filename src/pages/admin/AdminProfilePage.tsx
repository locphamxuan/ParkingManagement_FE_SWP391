import { ArrowLeft, LogOut, User } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function AdminProfilePage() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  if (!session?.token || session?.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-sky-600">Hồ sơ Admin</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Thông tin cá nhân</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Trang hồ sơ dành cho quản trị viên hệ thống. Tại đây bạn có thể xem thông tin tài khoản và đăng xuất nhanh.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              onClick={() => navigate('/admin/dashboard')}
            >
              <ArrowLeft size={16} /> Quay lại dashboard
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
              onClick={() => {
                logout();
                navigate('/admin/login', { replace: true });
              }}
            >
              <LogOut size={16} /> Đăng xuất
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.28em] text-sky-600">Thông tin tài khoản</p>
              <h2 className="text-2xl font-semibold text-slate-900">Hồ sơ của bạn</h2>
            </div>

            <div className="grid gap-4 rounded-3xl bg-slate-50 p-6">
              <div className="grid gap-2 rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Tên</p>
                <p className="text-lg font-medium text-slate-900">{session.fullName || 'Chưa cập nhật'}</p>
              </div>

              <div className="grid gap-2 rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Email</p>
                <p className="text-lg font-medium text-slate-900">{session.email}</p>
              </div>

              <div className="grid gap-2 rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Vai trò</p>
                <p className="text-lg font-medium text-slate-900">{session.role}</p>
              </div>

              <div className="grid gap-2 rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Số điện thoại</p>
                <p className="text-lg font-medium text-slate-900">{session.phone || 'Chưa cập nhật'}</p>
              </div>
            </div>
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-sky-600/5 p-8 shadow-sm">
            <div className="flex h-full flex-col justify-between gap-6">
              <div className="flex items-center gap-4 rounded-3xl bg-white/90 p-4 shadow-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-sky-600 text-white">
                  <User size={24} />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-sky-700">Tài khoản</p>
                  <p className="text-xl font-semibold text-slate-950">{session.fullName || 'Administrator'}</p>
                </div>
              </div>

              <div className="space-y-4 rounded-3xl bg-white/90 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Chi tiết nhanh</h3>
                <div className="grid gap-3 text-sm text-slate-600">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-medium text-slate-800">Email</p>
                    <p>{session.email}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-medium text-slate-800">Vai trò</p>
                    <p>{session.role}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-slate-900/95 p-6 text-white shadow-xl">
                <p className="text-sm uppercase tracking-[0.24em] text-sky-300">Ghi chú</p>
                <p className="mt-3 text-sm leading-6 text-slate-100">
                  Thông tin này được lấy trực tiếp từ phiên đăng nhập hiện tại. Cập nhật chi tiết tài khoản thông qua quản lý hệ thống.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
