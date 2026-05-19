import PageShell from '@/components/layout/PageShell';
import SectionHeader from '@/components/layout/SectionHeader';
import { Button } from '@/components/ui/button';

export default function AboutPage({ onOpenAuth }) {
  return (
    <PageShell>
      <section className="grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_28px_80px_-50px_rgba(15,23,42,0.08)] sm:grid-cols-[1.2fr_0.8fr] sm:p-10">
        <div className="space-y-6">
          <SectionHeader
            label="Giới thiệu"
            title="Về Parking Building Management System"
            description="PBMS là nền tảng quản lý bãi gửi xe cho tòa nhà, doanh nghiệp và khách hàng. Giúp gửi xe nhanh, rõ ràng và dễ theo dõi."
          />

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="section-card">
              <h2 className="text-lg font-semibold text-amber-950">Cho khách gửi xe</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Tìm bãi, đặt chỗ trước, xem giá và thanh toán nhanh ngay trên ứng dụng. Hết lo tìm chỗ hay phải đợi khi vào bãi.
              </p>
            </div>
            <div className="section-card">
              <h2 className="text-lg font-semibold text-amber-950">Cho quản lý</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Quản lý slot, ca làm việc và báo cáo doanh thu dễ dàng. Thông tin cập nhật theo thời gian thực cho nhân viên và quản lý.
              </p>
            </div>
          </div>

          <div className="section-card">
            <h2 className="text-lg font-semibold text-amber-950">Mục tiêu</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Xây dựng trải nghiệm gửi xe đơn giản, minh bạch và thân thiện cho cả khách hàng và đội ngũ vận hành.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => onOpenAuth('login')}>
              Đăng nhập quản lý
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenAuth('register')}>
              Tạo tài khoản mới
            </Button>
          </div>
        </div>

        <div className="hero-image overflow-hidden rounded-[2rem] bg-slate-950/5">
          <img
            className="h-full w-full object-cover"
            src="https://images.unsplash.com/photo-1518051870910-a46e30d9db16?auto=format&fit=crop&w=1200&q=80"
            alt="Bãi xe hiện đại" />
        </div>
      </section>
    </PageShell>
  );
}
