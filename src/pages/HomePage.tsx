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
    <main className="bg-gradient-to-br from-orange-50 via-amber-50 to-white text-slate-900" id="top">
      <header className="sticky top-0 z-40 bg-white/94 backdrop-blur-3xl border-b border-black/8 shadow-md">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-3 items-center gap-6 min-h-[86px]">
          <a className="inline-flex items-center gap-3.5" href="#top" aria-label="PBMS Trang chủ">
            <div className="w-12 h-12 rounded-3xl grid grid-cols-3 gap-1 p-2.5 bg-gradient-to-b from-orange-600/22 to-orange-600/6 border border-white/16 shadow-inner shadow-white/8" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div>
              <strong className="block text-sm font-bold text-slate-900">PBMS Parking</strong>
              <span className="block text-xs text-gray-600">Cloud Parking Platform</span>
            </div>
          </a>

          <nav className="flex gap-6 justify-center" aria-label="Điều hướng trang chủ">
            {navigationLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-sm font-medium text-slate-700 hover:text-orange-600 transition-colors">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex gap-4 items-center justify-end">
            <div className="text-right">
              <span className="block text-xs text-gray-600">Hỗ trợ 24/7</span>
              <strong className="block text-sm font-bold text-slate-900">1900 636 447</strong>
            </div>
            {user ? (
              <div className="relative inline-flex items-center" ref={menuRef}>
                <button
                  type="button"
                  aria-expanded={menuOpen}
                  className="inline-flex items-center gap-1.5 bg-white border border-black/8 text-slate-900 px-3 py-2 rounded-3xl font-bold shadow-md hover:shadow-lg transition-all"
                  onClick={() => setMenuOpen((v) => !v)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setMenuOpen(true);
                      setTimeout(() => {
                        const first = menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]');
                        first?.focus();
                      }, 0);
                    }
                    if (e.key === 'Escape') setMenuOpen(false);
                  }}
                >
                  <User size={16} />
                  <span className="font-bold text-sm truncate max-w-24">{user.fullName ?? user.email}</span>
                  <ChevronDown size={14} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 min-w-40 bg-white rounded-2xl border border-black/6 shadow-2xl shadow-black/12 p-1.5 z-50" role="menu">
                    <button type="button" className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg hover:bg-gray-100 text-left text-sm font-medium text-slate-900 transition-colors" onClick={onOpenDashboard} role="menuitem">
                      Hồ sơ
                    </button>
                    <button type="button" className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg hover:bg-gray-100 text-left text-sm font-medium text-slate-900 transition-colors" onClick={onLogout} role="menuitem">
                      <LogOut size={14} /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-100 text-slate-900 font-bold hover:bg-gray-200 transition-colors text-sm" type="button" onClick={() => onOpenAuth('login')}>
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-8 items-start">
          <div>
            <p className="mb-3 text-xs uppercase tracking-wider font-bold text-orange-600">Giải pháp giữ xe thông minh</p>
            <h1 className="mb-4 text-4xl md:text-5xl leading-tight font-bold text-slate-900">Hệ thống quản lý bãi đỗ xe hiện đại cho tòa nhà, doanh nghiệp và khu dân cư.</h1>
            <p className="mb-6 text-lg text-slate-700 leading-relaxed">
              PBMS hỗ trợ quản lý ra vào, kiểm soát phiên gửi xe, theo dõi doanh thu và chăm sóc khách hàng trên
              một nền tảng duy nhất với giao diện rõ ràng, chuyên nghiệp và dễ mở rộng.
            </p>

            <div className="flex gap-3 flex-wrap">
              <button className="px-6 py-3 rounded-lg border border-orange-600/42 bg-orange-600 text-white font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 text-sm" type="button" onClick={() => onOpenAuth('login')}>
                Đăng nhập ngay
              </button>
              <button className="px-6 py-3 rounded-lg border border-gray-300 bg-gray-100 text-slate-900 font-bold hover:bg-gray-200 transition-colors text-sm" type="button" onClick={() => onOpenAuth('register')}>
                Đăng ký tài khoản
              </button>
              <button className="px-6 py-3 rounded-lg border border-gray-300 bg-gray-100 text-slate-900 font-bold hover:bg-gray-200 transition-colors text-sm" type="button" onClick={onOpenDashboard}>
                Xem hồ sơ
              </button>
            </div>
          </div>

          <aside className="p-6 rounded-2xl border border-gray-200 bg-white shadow-lg">
            <p className="mb-4 text-xs uppercase tracking-wider font-bold text-orange-600">Điểm nổi bật</p>
            <div className="grid gap-4">
              {heroHighlights.map((item) => (
                <article key={item.label} className="p-4 rounded-lg border border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                  <strong className="block text-2xl font-bold text-slate-900">{item.value}</strong>
                  <span className="block text-sm text-gray-700 mt-1">{item.label}</span>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="py-16 md:py-24" id="gioi-thieu">
        <div className="max-w-5xl mx-auto px-6 grid gap-12">
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider font-bold text-orange-600">Giới thiệu</p>
            <h2 className="mb-4 text-3xl md:text-4xl font-bold text-slate-900">Phong cách landing page doanh nghiệp cho hệ thống giữ xe thông minh.</h2>
            <p className="mb-6 text-lg text-slate-700 leading-relaxed max-w-2xl">
              Giao diện mới tập trung vào cảm giác tin cậy, hiện đại và gần với các website giới thiệu giải pháp giữ
              xe chuyên nghiệp. Từ phần nền bãi xe, thanh điều hướng nổi bật đến các khối nội dung, mọi phần đều được
              tổ chức lại để người dùng dễ theo dõi hơn.
            </p>
            <div className="grid gap-3">
              <div className="flex gap-3 items-start">
                <ShieldCheck size={18} className="text-orange-600 mt-1 flex-shrink-0" />
                <span className="text-slate-700">Bố cục rõ ràng cho cả khách truy cập lần đầu và người dùng đã có tài khoản.</span>
              </div>
              <div className="flex gap-3 items-start">
                <Building2 size={18} className="text-orange-600 mt-1 flex-shrink-0" />
                <span className="text-slate-700">Phù hợp với bối cảnh tòa nhà, bãi xe thương mại, khu căn hộ và doanh nghiệp.</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <article key={benefit.title} className="p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-lg border border-orange-200 bg-orange-50 flex items-center justify-center text-orange-600 mb-4">
                    <Icon size={22} />
                  </div>
                  <h3 className="mb-2 font-bold text-slate-900">{benefit.title}</h3>
                  <p className="text-sm text-slate-700">{benefit.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24" id="giai-phap">
        <div className="max-w-5xl mx-auto px-6 grid gap-12">
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider font-bold text-orange-600">Sản phẩm chính</p>
            <h2 className="mb-4 text-3xl md:text-4xl font-bold text-slate-900">Giải pháp trọng tâm</h2>
            <p className="text-lg text-slate-700 max-w-2xl">
              Các khối nghiệp vụ sẵn sàng hoặc đang mở rộng được trình bày lại theo dạng thẻ dịch vụ để trang giống
              website giới thiệu hơn thay vì giao diện dashboard.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {productModules.map((module) => {
              const Icon = moduleIcons[module.id] || CarFront;

              return (
                <article key={module.id} className={`p-6 rounded-xl border transition-all ${
                  module.available 
                    ? 'border-gray-200 bg-white hover:shadow-lg' 
                    : 'border-gray-100 bg-gray-50'
                }`}>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                    module.available
                      ? 'border border-orange-200 bg-orange-50 text-orange-600'
                      : 'border border-gray-200 bg-gray-100 text-gray-600'
                  }`}>
                    <Icon size={22} />
                  </div>
                  <span className={`inline-block mb-2 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    module.available
                      ? 'border border-orange-200 bg-orange-50 text-orange-800'
                      : 'border border-gray-200 bg-gray-100 text-gray-600'
                  }`}>{module.available ? 'Sẵn sàng triển khai' : 'Đang mở rộng'}</span>
                  <h3 className="mb-2 font-bold text-slate-900">{module.title}</h3>
                  <p className="mb-4 text-sm text-slate-700">{module.description}</p>
                  <button
                    className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-lg font-bold transition-colors text-sm ${
                      module.available
                        ? 'border border-orange-600/42 bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-600/20'
                        : 'border border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed opacity-50'
                    }`}
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

      <section className="py-16 md:py-24 bg-gradient-to-br from-slate-950 to-slate-900 text-white" id="dich-vu">
        <div className="max-w-5xl mx-auto px-6 grid gap-12">
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider font-bold text-orange-400">Dịch vụ gia tăng</p>
            <h2 className="mb-4 text-3xl md:text-4xl font-bold">Mở rộng theo nhu cầu vận hành</h2>
            <p className="text-lg text-slate-300 max-w-2xl">
              Phần nền tối mô phỏng khu đỗ xe giúp trang giống reference hơn, đồng thời tách riêng nhóm tính năng
              tương lai như đặt chỗ, thanh toán, phiên gửi và thông báo.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {serviceModules.map((module) => {
              const Icon = moduleIcons[module.id] || Ticket;

              return (
                <article key={module.id} className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition-colors">
                  <div className="w-12 h-12 rounded-lg border border-orange-400/30 bg-orange-600/10 flex items-center justify-center text-orange-400 mb-4">
                    <Icon size={22} />
                  </div>
                  <span className="inline-block mb-2 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-orange-400/30 bg-orange-600/10 text-orange-300">Theo roadmap</span>
                  <h3 className="mb-2 font-bold text-white">{module.title}</h3>
                  <p className="mb-4 text-sm text-slate-300">{module.description}</p>
                  <button className="flex items-center gap-2 w-full px-4 py-2.5 rounded-lg font-bold text-sm border border-white/20 bg-white/10 text-white cursor-not-allowed opacity-50 transition-colors" type="button" disabled>
                    <span>{module.actionLabel}</span>
                    <ArrowRight size={16} />
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-gradient-to-r from-orange-600 to-amber-600">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-white">
            <p className="mb-2 text-xs uppercase tracking-wider font-bold text-orange-100">Sẵn sàng bắt đầu</p>
            <h2 className="text-2xl md:text-3xl font-bold">Triển khai trải nghiệm giữ xe chỉn chu hơn cho trang user.</h2>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button className="px-6 py-3 rounded-lg border border-white/20 bg-white text-orange-700 font-bold hover:bg-orange-50 transition-colors text-sm" type="button" onClick={() => onOpenAuth('register')}>
              Tạo tài khoản
            </button>
            <button className="px-6 py-3 rounded-lg border border-white/20 bg-white/10 text-white font-bold hover:bg-white/20 transition-colors text-sm" type="button" onClick={onOpenDashboard}>
              Vào hồ sơ
            </button>
          </div>
        </div>
      </section>

      <footer className="py-12 md:py-16 bg-slate-950 text-slate-200" id="lien-he">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider font-bold text-orange-400">PBMS PARKING</p>
            <h3 className="mb-3 font-bold text-white text-lg">Hệ thống quản lý bãi đỗ xe dành cho tòa nhà và doanh nghiệp.</h3>
            <p className="text-sm text-slate-400">
              Giao diện landing page được làm theo hướng website giới thiệu giải pháp giữ xe, nhấn mạnh hình ảnh bãi
              đỗ, độ tin cậy thương hiệu và các lối vào nhanh cho người dùng cuối.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-bold text-white">Liên kết nhanh</h4>
            <div className="grid gap-2">
              {navigationLinks.map((link) => (
                <a key={link.href} href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-bold text-white">Tài khoản</h4>
            <div className="grid gap-2">
              <button type="button" onClick={() => onOpenAuth('login')} className="text-left text-sm text-slate-400 hover:text-white transition-colors font-medium">
                Đăng nhập
              </button>
              <button type="button" onClick={() => onOpenAuth('register')} className="text-left text-sm text-slate-400 hover:text-white transition-colors font-medium">
                Đăng ký
              </button>
              <button type="button" onClick={onOpenDashboard} className="text-left text-sm text-slate-400 hover:text-white transition-colors font-medium">
                Xem hồ sơ
              </button>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-bold text-white">Thông tin liên hệ</h4>
            <div className="grid gap-3">
              <a href="tel:+841900636447" className="flex gap-2 items-start text-sm text-slate-400 hover:text-white transition-colors">
                <PhoneCall size={16} className="mt-0.5 flex-shrink-0" /> 1900 636 447
              </a>
              <a href="mailto:support@pbms.vn" className="flex gap-2 items-start text-sm text-slate-400 hover:text-white transition-colors">
                <Mail size={16} className="mt-0.5 flex-shrink-0" /> support@pbms.vn
              </a>
              <p className="flex gap-2 items-start text-sm text-slate-400">
                <MapPinned size={16} className="mt-0.5 flex-shrink-0" /> Trung tâm vận hành giữ xe thông minh PBMS
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 border-t border-slate-800 pt-8 text-center">
          <small className="text-slate-500">© {new Date().getFullYear()} PBMS Parking. Thiết kế lại landing page theo phong cách website giới thiệu.</small>
        </div>
      </footer>
    </main>
  );
}
