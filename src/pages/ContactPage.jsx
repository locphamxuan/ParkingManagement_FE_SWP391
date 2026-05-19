import PageShell from '@/components/layout/PageShell';
import SectionHeader from '@/components/layout/SectionHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ContactPage() {
  return (
    <PageShell>
      <section className="grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_28px_80px_-50px_rgba(15,23,42,0.08)] sm:grid-cols-[1.2fr_0.8fr] sm:p-10">
        <div className="space-y-6">
          <SectionHeader
            label="Liên hệ"
            title="Kết nối với chúng tôi"
            description="Hãy gửi yêu cầu để nhận tư vấn triển khai PBMS cho tòa nhà và bãi gửi xe của bạn."
          />

          <div className="space-y-4 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Thông tin hỗ trợ</h2>
              <p className="text-sm leading-7 text-slate-600">
                Hỗ trợ kỹ thuật, tư vấn triển khai và kết nối khách hàng với bãi gửi xe.
              </p>
            </div>

            <div className="grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
              <div>
                <p className="font-semibold">Email</p>
                <p>support@pbms.vn</p>
              </div>
              <div>
                <p className="font-semibold">Điện thoại</p>
                <p>+84 123 456 789</p>
              </div>
              <div>
                <p className="font-semibold">Địa chỉ</p>
                <p>Hà Nội, Việt Nam</p>
              </div>
              <div>
                <p className="font-semibold">Giờ làm việc</p>
                <p>Thứ 2 - Thứ 6, 8:00 - 18:00</p>
              </div>
            </div>
          </div>
        </div>

        <form className="space-y-4 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-6">
          <div className="space-y-2">
            <Label htmlFor="name">Họ và tên</Label>
            <Input id="name" name="name" placeholder="Nguyễn Văn A" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="email@pbms.vn" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Nội dung</Label>
            <textarea
              id="message"
              name="message"
              rows={5}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
              placeholder="Hãy nhập câu hỏi hoặc yêu cầu hỗ trợ"
            />
          </div>
          <Button type="button" className="w-full">
            Gửi thông tin
          </Button>
        </form>
      </section>
    </PageShell>
  );
}
