import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';

const initialForm = {
  fullName: '',
  phone: '',
  email: '',
  password: '',
};

type AuthMode = 'login' | 'register';

interface AuthPageProps {
  mode: AuthMode;
  notice: { message?: string; type?: string };
  onModeChange: (mode: AuthMode) => void;
  onBackHome: () => void;
  onSubmit: (input: { mode: AuthMode; payload: Record<string, string> }) => Promise<unknown>;
  isLoading: boolean;
}

const promoPoints = [
  {
    title: 'Dễ sử dụng',
    text: 'Biểu mẫu sáng rõ, thao tác nhanh và đồng bộ màu sắc với landing page trang chủ.',
  },
  {
    title: 'Đúng bối cảnh',
    text: 'Hình nền bãi đỗ xe và tông màu cam kem giúp nhận diện rõ đây là hệ thống parking.',
  },
  {
    title: 'An tâm truy cập',
    text: 'Thông tin tài khoản và các luồng đăng nhập, đăng ký được trình bày ngắn gọn, dễ theo dõi.',
  },
];

export default function AuthPage({
  mode,
  notice,
  onModeChange,
  onBackHome,
  onSubmit,
  isLoading,
}: AuthPageProps) {
  const [form, setForm] = useState(initialForm);

  const title = useMemo(
    () => (mode === 'login' ? 'Đăng nhập vào PBMS' : 'Tạo tài khoản PBMS'),
    [mode]
  );

  const description = useMemo(
    () =>
      mode === 'login'
        ? 'Đăng nhập để tiếp tục sử dụng hệ thống quản lý bãi đỗ xe, theo dõi thông tin và truy cập các chức năng cần thiết.'
        : 'Tạo tài khoản mới để bắt đầu sử dụng nền tảng quản lý bãi đỗ xe với giao diện đồng nhất cùng trang chủ.',
    [mode]
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: Record<string, string> = {
      email: form.email.trim(),
      password: form.password,
      ...(mode === 'register'
        ? {
            fullName: form.fullName.trim(),
            phone: form.phone.trim(),
          }
        : {}),
    };

    try {
      await onSubmit({ mode, payload });
      setForm(initialForm);
    } catch {
      return;
    }
  };

  return (
    <main className="min-h-screen p-7 grid items-center bg-gradient-to-br from-orange-50 via-amber-50 to-white radial-gradient-accent">
      <section className="w-full max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-1 rounded-5xl overflow-hidden border border-black/8 bg-white/88 shadow-2xl shadow-black/12 backdrop-blur">
        <aside className="relative min-h-xl p-8.5 text-orange-50 bg-gradient-to-br from-gray-950 via-gray-900 to-slate-950">
          <div className="absolute inset-0 opacity-50">
            <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-gradient-radial from-orange-600/26 to-transparent -translate-y-1/2 -translate-x-1/3"></div>
            <div className="absolute inset-0 opacity-50 bg-gradient-to-r from-white/3 to-transparent via-gradient-to-b from-white/2 to-transparent"></div>
          </div>

          <div className="relative z-1 grid content-between min-h-full gap-7">
            <div className="flex justify-between gap-4 items-start">
              <div className="inline-flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-4xl grid grid-cols-3 gap-1 p-2.5 bg-gradient-to-b from-orange-600/22 to-orange-600/6 border border-white/16 shadow-inner shadow-white/8" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <div>
                  <strong className="block text-lg text-white">PBMS Parking</strong>
                  <span className="block mt-0.5 text-xs text-orange-100 uppercase tracking-wider">Cloud Parking Platform</span>
                </div>
              </div>

              <button className="px-3 py-2 rounded-lg border border-white/22 bg-white/12 text-orange-100 hover:text-white hover:bg-white/20 transition-colors font-bold text-sm" type="button" onClick={onBackHome}>
                Về trang chủ
              </button>
            </div>

            <div>
              <p className="m-0 mb-2 text-xs uppercase tracking-wider text-orange-400">PBMS Account</p>
              <h1 className="m-0 mb-3 text-2xl md:text-3xl leading-tight font-bold">Đăng nhập và đăng ký cùng một tông màu với trang home.</h1>
              <p className="m-0 text-orange-200">
                Giao diện tài khoản được chuyển sang phong cách parking branding: nền bãi đỗ xe, tông màu cam ấm,
                card sáng và độ tương phản cao hơn để dễ sử dụng.
              </p>
            </div>

            <div className="grid gap-4">
              <article>
                <strong className="block text-xl">24/7</strong>
                <span className="text-sm text-orange-100">Hỗ trợ vận hành liên tục</span>
              </article>
              <article>
                <strong className="block text-xl">01</strong>
                <span className="text-sm text-orange-100">Hệ thống giao diện đồng nhất</span>
              </article>
              <article>
                <strong className="block text-xl">PBMS</strong>
                <span className="text-sm text-orange-100">Nhận diện rõ phần mềm bãi đỗ xe</span>
              </article>
            </div>

            <div className="grid gap-3">
              {promoPoints.map((point) => (
                <article key={point.title}>
                  <strong className="block font-bold text-sm">{point.title}</strong>
                  <span className="block text-xs text-orange-100 mt-1">{point.text}</span>
                </article>
              ))}
            </div>
          </div>
        </aside>

        <section className="p-8.5">
          <div className="mb-6">
            <p className="m-0 mb-1 text-xs uppercase tracking-wider text-orange-600 font-bold">Tài khoản người dùng</p>
            <h2 className="m-0 mb-3 text-2xl font-bold text-gray-900">{title}</h2>
            <p className="m-0 text-sm text-gray-600">{description}</p>
          </div>

          <div className="flex gap-3 mb-6 border-b border-gray-200 role-tablist">
            <button
              className={`pb-3 px-1 font-bold text-sm transition-colors border-b-2 ${
                mode === 'login'
                  ? 'text-orange-600 border-orange-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
              type="button"
              onClick={() => onModeChange('login')}
            >
              Đăng nhập
            </button>
            <button
              className={`pb-3 px-1 font-bold text-sm transition-colors border-b-2 ${
                mode === 'register'
                  ? 'text-orange-600 border-orange-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
              type="button"
              onClick={() => onModeChange('register')}
            >
              Đăng ký
            </button>
          </div>

          <div className={`mb-6 p-3 rounded-lg text-sm font-medium ${
            notice?.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            notice?.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {notice?.message || 'Sử dụng tài khoản của bạn để truy cập hệ thống parking PBMS.'}
          </div>

          <div className="mb-6 p-3 rounded-lg border border-amber-200 bg-amber-50">
            <span className="block text-xs text-amber-600">Tài khoản demo</span>
            <strong className="block text-amber-900 font-bold mt-1">user@pbms.vn</strong>
            <small className="block text-xs text-amber-700 mt-1">Mật khẩu từ 6 ký tự trở lên</small>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-4">
                <label className="grid gap-1.5">
                  <span className="font-bold text-sm text-gray-900">Họ và tên</span>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={form.fullName}
                    onChange={handleChange}
                    className="px-3 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                    required
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="font-bold text-sm text-gray-900">Số điện thoại</span>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="0901234567"
                    value={form.phone}
                    onChange={handleChange}
                    className="px-3 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                  />
                </label>
              </div>
            )}

            <label className="grid gap-1.5">
              <span className="font-bold text-sm text-gray-900">Email</span>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="user@pbms.vn"
                value={form.email}
                onChange={handleChange}
                className="px-3 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                required
              />
            </label>

            <label className="grid gap-1.5">
              <span className="font-bold text-sm text-gray-900">Mật khẩu</span>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Ít nhất 6 ký tự"
                value={form.password}
                onChange={handleChange}
                className="px-3 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                required
              />
            </label>

            <button 
              className="mt-4 px-4 py-3 rounded-lg border border-orange-600/42 bg-orange-600 text-white font-bold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-600/20" 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập vào hệ thống' : 'Tạo tài khoản'}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}
