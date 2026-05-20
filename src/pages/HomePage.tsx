import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BarChart3,
  BellRing,
  Building2,
  CalendarClock,
  CarFront,
  CheckCircle2,
  Clock3,
  CreditCard,
  Mail,
  MapPinned,
  PhoneCall,
  ScanLine,
  ShieldCheck,
  Ticket,
  Wallet,
  User,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import type { LegacyModule } from '../data/mainFlow';
import './HomePage.css';

interface HomePageProps {
  modules: LegacyModule[];
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenDashboard: () => void;
  onAction: (module: LegacyModule) => void;
  onOpenAdmin?: () => void;
  user?: { fullName?: string; email?: string } | null;
  onLogout?: () => void;
}

const navigationLinks = [
  { label: 'Trang chủ', href: '#top' },
  { label: 'Giới thiệu', href: '#gioi-thieu' },
  { label: 'Giải pháp', href: '#giai-phap' },
  { label: 'Dịch vụ', href: '#dich-vu' },
  { label: 'Liên hệ', href: '#lien-he' },
];

const moduleIcons: Record<string, LucideIcon> = {
  auth: ShieldCheck,
  profile: CheckCircle2,
  wallet: Wallet,
  buildings: Building2,
  reservations: CalendarClock,
  sessions: ScanLine,
  payments: CreditCard,
  notifications: BellRing,
};

const heroHighlights = [
  { value: '24/7', label: 'Giám sát và hỗ trợ vận hành liên tục' },
  { value: '01', label: 'Nền tảng thống nhất cho cư dân và ban quản lý' },
  { value: '99.9%', label: 'Quy trình check-in, check-out rõ ràng' },
];

const benefits = [
  {
    icon: Clock3,
    title: 'Kiểm soát ra vào theo thời gian thực',
    description: 'Theo dõi lượt xe, trạng thái bãi và phiên gửi ngay trên một màn hình vận hành trực quan.',
  },
  {
    icon: BarChart3,
    title: 'Báo cáo doanh thu rõ ràng',
    description: 'Tập trung số liệu giao dịch, doanh thu và hiệu suất khai thác để quản lý dễ ra quyết định hơn.',
  },
  {
    icon: CarFront,
    title: 'Trải nghiệm thân thiện cho người dùng',
    description: 'Đăng nhập, theo dõi thông tin và mở rộng tính năng đặt chỗ, thanh toán, thông báo theo lộ trình.',
  },
];

export default function HomePage({ modules, onOpenAuth, onOpenDashboard, onAction, onOpenAdmin, user, onLogout }: HomePageProps) {
  const productModules = modules.slice(0, 4);
  const serviceModules = modules.slice(4);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <main className="home-view" id="top">
      <header className="home-nav">
        <div className="home-shell home-nav-shell">
          <a className="home-brand" href="#top" aria-label="PBMS Trang chủ">
            <div className="home-brand-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div>
              <strong>PBMS Parking</strong>
              <span>Cloud Parking Platform</span>
            </div>
          </a>

          <nav className="home-menu" aria-label="Điều hướng trang chủ">
            {navigationLinks.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
            {/* <button className="home-admin-link" type="button" onClick={() => onOpenAdmin?.()}>
              Quản trị
            </button> */}
          </nav>

          <div className="home-nav-meta">
            <div className="home-hotline">
              <span>Hỗ trợ 24/7</span>
              <strong>1900 636 447</strong>
            </div>
            {user ? (
              <div className="user-dropdown" ref={menuRef}>
                <button
                  type="button"
                  aria-expanded={menuOpen}
                  className="user-dropdown-button"
                  onClick={() => setMenuOpen((v) => !v)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setMenuOpen(true);
                      setTimeout(() => {
                        const first = menuRef.current?.querySelector<HTMLButtonElement>('.user-dropdown-item');
                        first?.focus();
                      }, 0);
                    }
                    if (e.key === 'Escape') setMenuOpen(false);
                  }}
                >
                  <User size={16} style={{ marginRight: 8 }} />
                  <span className="home-username">{user.fullName ?? user.email}</span>
                  <ChevronDown size={14} className="chev" />
                </button>

                {menuOpen && (
                  <div className="user-dropdown-menu" role="menu">
                    <button type="button" className="user-dropdown-item" onClick={onOpenDashboard} role="menuitem">
                      Hồ sơ
                    </button>
                    <button type="button" className="user-dropdown-item" onClick={onLogout} role="menuitem">
                      <LogOut size={14} style={{ marginRight: 8 }} /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="ghost-button home-nav-button" type="button" onClick={() => onOpenAuth('login')}>
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="home-hero">
        <div className="home-shell home-hero-shell">
          <div className="home-hero-copy">
            <p className="home-kicker">Giải pháp giữ xe thông minh</p>
            <h1>Hệ thống quản lý bãi đỗ xe hiện đại cho tòa nhà, doanh nghiệp và khu dân cư.</h1>
            <p className="home-hero-text">
              PBMS hỗ trợ quản lý ra vào, kiểm soát phiên gửi xe, theo dõi doanh thu và chăm sóc khách hàng trên
              một nền tảng duy nhất với giao diện rõ ràng, chuyên nghiệp và dễ mở rộng.
            </p>

            <div className="home-hero-actions">
              <button className="primary-button" type="button" onClick={() => onOpenAuth('login')}>
                Đăng nhập ngay
              </button>
              <button className="ghost-button home-hero-ghost" type="button" onClick={() => onOpenAuth('register')}>
                Đăng ký tài khoản
              </button>
              <button className="ghost-button home-hero-ghost" type="button" onClick={onOpenDashboard}>
                Xem hồ sơ
              </button>
            </div>
          </div>

          <aside className="home-hero-panel">
            <p className="home-hero-panel-kicker">Điểm nổi bật</p>
            <div className="home-highlight-list">
              {heroHighlights.map((item) => (
                <article key={item.label} className="home-highlight-card">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="home-story" id="gioi-thieu">
        <div className="home-shell home-story-shell">
          <div className="home-section-copy">
            <p className="home-kicker">Giới thiệu</p>
            <h2>Phong cách landing page doanh nghiệp cho hệ thống giữ xe thông minh.</h2>
            <p>
              Giao diện mới tập trung vào cảm giác tin cậy, hiện đại và gần với các website giới thiệu giải pháp giữ
              xe chuyên nghiệp. Từ phần nền bãi xe, thanh điều hướng nổi bật đến các khối nội dung, mọi phần đều được
              tổ chức lại để người dùng dễ theo dõi hơn.
            </p>
            <div className="home-story-points">
              <div>
                <ShieldCheck size={18} />
                <span>Bố cục rõ ràng cho cả khách truy cập lần đầu và người dùng đã có tài khoản.</span>
              </div>
              <div>
                <Building2 size={18} />
                <span>Phù hợp với bối cảnh tòa nhà, bãi xe thương mại, khu căn hộ và doanh nghiệp.</span>
              </div>
            </div>
          </div>

          <div className="home-story-grid">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <article key={benefit.title} className="home-story-card">
                  <div className="home-story-icon">
                    <Icon size={22} />
                  </div>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="home-section" id="giai-phap">
        <div className="home-shell">
          <div className="home-section-heading">
            <div>
              <p className="home-kicker">Sản phẩm chính</p>
              <h2>Giải pháp trọng tâm</h2>
            </div>
            <p>
              Các khối nghiệp vụ sẵn sàng hoặc đang mở rộng được trình bày lại theo dạng thẻ dịch vụ để trang giống
              website giới thiệu hơn thay vì giao diện dashboard.
            </p>
          </div>

          <div className="home-module-grid">
            {productModules.map((module) => {
              const Icon = moduleIcons[module.id] || CarFront;

              return (
                <article key={module.id} className={`home-module-card ${module.available ? 'is-ready' : 'is-planned'}`}>
                  <div className="home-module-icon">
                    <Icon size={28} />
                  </div>
                  <span className="home-module-status">{module.available ? 'Sẵn sàng triển khai' : 'Đang mở rộng'}</span>
                  <h3>{module.title}</h3>
                  <p>{module.description}</p>
                  <button
                    className="home-module-button"
                    type="button"
                    onClick={() => onAction(module)}
                    disabled={!module.available}
                  >
                    <span>{module.available ? module.actionLabel : 'Sắp ra mắt'}</span>
                    <ArrowRight size={16} />
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="home-section home-services" id="dich-vu">
        <div className="home-shell">
          <div className="home-section-heading home-section-heading-light">
            <div>
              <p className="home-kicker">Dịch vụ gia tăng</p>
              <h2>Mở rộng theo nhu cầu vận hành</h2>
            </div>
            <p>
              Phần nền tối mô phỏng khu đỗ xe giúp trang giống reference hơn, đồng thời tách riêng nhóm tính năng
              tương lai như đặt chỗ, thanh toán, phiên gửi và thông báo.
            </p>
          </div>

          <div className="home-module-grid">
            {serviceModules.map((module) => {
              const Icon = moduleIcons[module.id] || Ticket;

              return (
                <article key={module.id} className="home-module-card home-module-card-light">
                  <div className="home-module-icon">
                    <Icon size={28} />
                  </div>
                  <span className="home-module-status">Theo roadmap</span>
                  <h3>{module.title}</h3>
                  <p>{module.description}</p>
                  <button className="home-module-button" type="button" disabled>
                    <span>{module.actionLabel}</span>
                    <ArrowRight size={16} />
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="home-cta-band">
        <div className="home-shell home-cta-shell">
          <div>
            <p className="home-kicker">Sẵn sàng bắt đầu</p>
            <h2>Triển khai trải nghiệm giữ xe chỉn chu hơn cho trang user.</h2>
          </div>
          <div className="home-cta-actions">
            <button className="primary-button" type="button" onClick={() => onOpenAuth('register')}>
              Tạo tài khoản
            </button>
            <button className="ghost-button" type="button" onClick={onOpenDashboard}>
              Vào hồ sơ
            </button>
          </div>
        </div>
      </section>

      <footer className="home-site-footer" id="lien-he">
        <div className="home-shell home-footer-grid">
          <div className="home-footer-brand">
            <p className="home-footer-title">PBMS PARKING</p>
            <h3>Hệ thống quản lý bãi đỗ xe dành cho tòa nhà và doanh nghiệp.</h3>
            <p>
              Giao diện landing page được làm theo hướng website giới thiệu giải pháp giữ xe, nhấn mạnh hình ảnh bãi
              đỗ, độ tin cậy thương hiệu và các lối vào nhanh cho người dùng cuối.
            </p>
          </div>

          <div className="home-footer-column">
            <h4>Liên kết nhanh</h4>
            {navigationLinks.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </div>

          <div className="home-footer-column">
            <h4>Tài khoản</h4>
            <button type="button" onClick={() => onOpenAuth('login')}>
              Đăng nhập
            </button>
            <button type="button" onClick={() => onOpenAuth('register')}>
              Đăng ký
            </button>
            <button type="button" onClick={onOpenDashboard}>
              Xem hồ sơ
            </button>
          </div>

          <div className="home-footer-column">
            <h4>Thông tin liên hệ</h4>
            <a href="tel:+841900636447">
              <PhoneCall size={16} /> 1900 636 447
            </a>
            <a href="mailto:support@pbms.vn">
              <Mail size={16} /> support@pbms.vn
            </a>
            <p>
              <MapPinned size={16} /> Trung tâm vận hành giữ xe thông minh PBMS
            </p>
          </div>
        </div>

        <div className="home-shell home-footer-bottom">
          <small>© {new Date().getFullYear()} PBMS Parking. Thiết kế lại landing page theo phong cách website giới thiệu.</small>
        </div>
      </footer>
    </main>
  );
}
