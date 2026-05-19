import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import './AuthPage.css';

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
    <main className="auth-standalone">
      <section className="auth-shell">
        <aside className="auth-promo">
          <div className="auth-promo-inner">
            <div className="auth-brand-row">
              <div className="auth-brand">
                <div className="auth-brand-mark" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <div>
                  <strong>PBMS Parking</strong>
                  <span>Cloud Parking Platform</span>
                </div>
              </div>

              <button className="auth-button auth-button-ghost auth-home-link" type="button" onClick={onBackHome}>
                Về trang chủ
              </button>
            </div>

            <div className="auth-promo-copy">
              <p className="auth-kicker">PBMS Account</p>
              <h1>Đăng nhập và đăng ký cùng một tông màu với trang home.</h1>
              <p>
                Giao diện tài khoản được chuyển sang phong cách parking branding: nền bãi đỗ xe, tông màu cam ấm,
                card sáng và độ tương phản cao hơn để dễ sử dụng.
              </p>
            </div>

            <div className="auth-promo-stats">
              <article>
                <strong>24/7</strong>
                <span>Hỗ trợ vận hành liên tục</span>
              </article>
              <article>
                <strong>01</strong>
                <span>Hệ thống giao diện đồng nhất</span>
              </article>
              <article>
                <strong>PBMS</strong>
                <span>Nhận diện rõ phần mềm bãi đỗ xe</span>
              </article>
            </div>

            <div className="auth-promo-points">
              {promoPoints.map((point) => (
                <article key={point.title}>
                  <strong>{point.title}</strong>
                  <span>{point.text}</span>
                </article>
              ))}
            </div>
          </div>
        </aside>

        <section className="auth-panel">
          <div className="auth-head">
            <div>
              <p className="auth-kicker">Tài khoản người dùng</p>
              <h2>{title}</h2>
              <p className="auth-panel-copy">{description}</p>
            </div>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="Chuyển chế độ xác thực">
            <button
              className={`auth-tab ${mode === 'login' ? 'is-active' : ''}`}
              type="button"
              onClick={() => onModeChange('login')}
            >
              Đăng nhập
            </button>
            <button
              className={`auth-tab ${mode === 'register' ? 'is-active' : ''}`}
              type="button"
              onClick={() => onModeChange('register')}
            >
              Đăng ký
            </button>
          </div>

          <div className={`auth-notice ${notice?.type ? `is-${notice.type}` : ''}`}>
            {notice?.message || 'Sử dụng tài khoản của bạn để truy cập hệ thống parking PBMS.'}
          </div>

          <div className="auth-demo-box">
            <span>Tài khoản demo</span>
            <strong>user@pbms.vn</strong>
            <small>Mật khẩu từ 6 ký tự trở lên</small>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="auth-grid-two">
                <label className="auth-field">
                  <span>Họ và tên</span>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label className="auth-field">
                  <span>Số điện thoại</span>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="0901234567"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </label>
              </div>
            )}

            <label className="auth-field">
              <span>Email</span>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="user@pbms.vn"
                value={form.email}
                onChange={handleChange}
                required
              />
            </label>

            <label className="auth-field">
              <span>Mật khẩu</span>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Ít nhất 6 ký tự"
                value={form.password}
                onChange={handleChange}
                required
              />
            </label>

            <button className="auth-button auth-button-primary auth-submit" type="submit" disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập vào hệ thống' : 'Tạo tài khoản'}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}
