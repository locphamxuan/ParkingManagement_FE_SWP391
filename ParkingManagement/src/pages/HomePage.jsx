import { Car, Sparkles, ShieldCheck, Clock3 } from 'lucide-react';
import ModuleGrid from '@/components/modules/ModuleGrid';
import PageShell from '@/components/layout/PageShell';
import SectionHeader from '@/components/layout/SectionHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const highlights = [
  { value: 'Đặt chỗ', label: 'Giữ chỗ trước', icon: Clock3 },
  { value: 'Thanh toán', label: 'Thanh toán nhanh', icon: ShieldCheck },
  { value: 'Lịch sử', label: 'Xem phiếu gửi xe', icon: Sparkles },
];

const benefits = [
  {
    title: 'Đặt xe trước',
    text: 'Chọn tòa nhà và thời gian, giữ chỗ nhanh chóng để vào bãi không phải chờ.',
  },
  {
    title: 'Check-in đơn giản',
    text: 'Quét mã hoặc nhập biển số, cập nhật phiên gửi xe ngay lập tức.',
  },
  {
    title: 'Theo dõi chi tiết',
    text: 'Xem lịch sử gửi xe, phí và trạng thái giờ thực trên điện thoại.',
  },
];

export default function HomePage({ modules, onOpenAuth, onOpenDashboard, onAction }) {
  const productModules = modules.slice(0, 4);
  const serviceModules = modules.slice(4);

  return (
    <PageShell>
      <section className="grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_28px_80px_-50px_rgba(15,23,42,0.08)] sm:grid-cols-[1.2fr_0.8fr] sm:p-10">
        <div className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">Ứng dụng khách gửi xe</p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Đặt chỗ gửi xe và thanh toán nhanh cho tòa nhà
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-600">
              Khách hàng dễ dàng tìm bãi, giữ chỗ, check-in bằng mã và xem lịch sử gửi xe chỉ trên một ứng dụng.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="feature-card">
              <p className="text-sm font-semibold text-amber-950">Chọn bãi nhanh</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Xem tòa nhà, tầng, số slot trống và đặt chỗ trước trong vài giây.
              </p>
            </div>
            <div className="feature-card">
              <p className="text-sm font-semibold text-amber-950">Gửi xe linh hoạt</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Hỗ trợ gửi xe theo giờ, đặt chỗ trước và gói dài hạn cho cư dân và khách vãng lai.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="feature-card flex flex-col gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-900 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-lg font-semibold text-slate-950">{item.value}</p>
                  <p className="text-sm leading-6 text-slate-600">{item.label}</p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => onOpenAuth('login')}>
              Đăng nhập
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenAuth('register')}>
              Đăng ký
            </Button>
            <Button type="button" variant="ghost" onClick={() => onOpenAuth('login')}>
              Khách hàng mới
            </Button>
          </div>
        </div>

        <div className="hero-image h-full min-h-[420px]">
          <img
            src="https://images.unsplash.com/photo-1519052520727-3d2b46a1a5b4?auto=format&fit=crop&w=1200&q=80"
            alt="Khách gửi xe tại bãi" />
        </div>
      </section>

      <section className="mt-10">
        <SectionHeader
          label="Tính năng dành cho khách"
          title="Trải nghiệm gửi xe tiện lợi"
          description="Tập trung vào người gửi xe với các bước đơn giản: chọn chỗ, gửi xe và nhận thông tin ngay lập tức."
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="section-card">
            <p className="text-sm font-semibold text-amber-950">Đặt chỗ trước</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Chọn tòa nhà, tầng và slot phù hợp để đảm bảo có chỗ khi đến bãi.
            </p>
          </div>
          <div className="section-card">
            <p className="text-sm font-semibold text-amber-950">Check-in bằng mã</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Quét mã QR hoặc nhập mã đặt chỗ để vào bãi nhanh, giảm thời gian chờ.
            </p>
          </div>
          <div className="section-card">
            <p className="text-sm font-semibold text-amber-950">Lịch sử và hóa đơn</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Lưu lại mọi phiên gửi xe và thanh toán để kiểm tra lại bất cứ lúc nào.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <SectionHeader
          label="Dành cho quản lý"
          title="Quản lý bãi dễ dàng"
          description="Admin/Manager chỉ cần đăng nhập để giám sát slot, ca làm việc và báo cáo. Nhân viên vận hành có giao diện trực quan."
        />

        <Card className="glass-card">
          <CardContent className="grid gap-6 p-6 sm:grid-cols-3 sm:p-8">
            {benefits.map((item) => (
              <article key={item.title} className="space-y-3">
                <h3 className="text-sm font-semibold text-amber-950">{item.title}</h3>
                <p className="text-sm leading-7 text-slate-600">{item.text}</p>
              </article>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mt-10">
        <SectionHeader
          label="Thực tế"
          title="Một số bãi đã triển khai"
          description="Hình ảnh minh họa bãi xe nhiều tầng và trải nghiệm khách hàng tại bãi."
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <img
            className="aspect-[4/3] w-full rounded-[1.5rem] object-cover"
            src="https://images.unsplash.com/photo-1543168257-70fef1f0cb53?auto=format&fit=crop&w=800&q=80"
            alt="Bãi xe tòa nhà" />
          <img
            className="aspect-[4/3] w-full rounded-[1.5rem] object-cover"
            src="https://images.unsplash.com/photo-1528796504966-01ccda5a5810?auto=format&fit=crop&w=800&q=80"
            alt="Cửa hàng giữ xe" />
          <img
            className="aspect-[4/3] w-full rounded-[1.5rem] object-cover"
            src="https://images.unsplash.com/photo-1516687405508-4a6ffb1c7b57?auto=format&fit=crop&w=800&q=80"
            alt="Nhân viên quầy tiếp nhận" />
        </div>
      </section>
    </PageShell>
  );
}
