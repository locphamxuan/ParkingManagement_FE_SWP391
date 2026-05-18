import { useMemo, useState } from 'react';
import Brand from '@/components/layout/Brand';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

const initialForm = {
  fullName: '',
  phone: '',
  email: '',
  password: '',
};

export default function AuthPage({ mode, notice, onModeChange, onBackHome, onSubmit, isLoading }) {
  const [form, setForm] = useState(initialForm);

  const title = useMemo(
    () => (mode === 'login' ? 'Đăng nhập' : 'Đăng ký tài khoản'),
    [mode]
  );

  const noticeClass =
    notice?.type === 'error'
      ? 'border-destructive/30 bg-destructive/5 text-destructive'
      : 'border-yellow-200 bg-yellow-50 text-amber-900';

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      email: form.email.trim(),
      password: form.password,
      ...(mode === 'register'
        ? { fullName: form.fullName.trim(), phone: form.phone.trim() }
        : {}),
    };

    try {
      await onSubmit({ mode, payload });
      setForm(initialForm);
    } catch (_error) {
      // Lỗi hiển thị qua toast.
    }
  };

  return (
    <main className="page-surface flex min-h-screen flex-col lg:flex-row">
      <section className="hidden flex-1 flex-col justify-between overflow-hidden rounded-r-[2rem] bg-gradient-to-br from-yellow-100 via-white to-yellow-50 p-10 shadow-lg shadow-yellow-200/40 lg:flex">
        <div className="space-y-8">
          <Brand subtitle="Đăng nhập an toàn" />
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-amber-900">Trải nghiệm hiện đại</p>
            <h2 className="max-w-sm text-3xl font-semibold tracking-tight text-amber-950">
              Một tài khoản quản lý toàn bộ hệ thống bãi giữ xe.
            </h2>
            <p className="max-w-md text-sm leading-7 text-slate-600">
              Giao diện rõ ràng, thông tin trực quan và phong cách thiết kế vàng rực phù hợp với vận hành chuyên nghiệp.
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-[2rem] bg-amber-500/10 p-5 text-sm text-amber-900 shadow-inner shadow-yellow-100/70">
          <p className="font-semibold">Ưu điểm nổi bật</p>
          <ul className="space-y-2 pl-4 text-slate-700">
            <li>• Tốc độ truy cập nhanh</li>
            <li>• Bảo mật vai trò và phiên</li>
            <li>• Thiết kế tối ưu trên cả desktop</li>
          </ul>
        </div>

        <p className="text-xs text-amber-700">© PBMS {new Date().getFullYear()}</p>
      </section>

      <section className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Brand subtitle="PBMS" />
            <Button type="button" variant="ghost" size="sm" onClick={onBackHome}>
              <ArrowLeft className="h-4 w-4" />
              Trang chủ
            </Button>
          </div>

          <Card className="glass-card border border-yellow-100 bg-white/80 shadow-xl shadow-yellow-100/40">
            <CardHeader className="space-y-4">
              <div className="hidden lg:block">
                <Button type="button" variant="ghost" size="sm" className="-ml-2" onClick={onBackHome}>
                  <ArrowLeft className="h-4 w-4" />
                  Trang chủ
                </Button>
              </div>
              <CardTitle className="text-2xl font-semibold text-amber-950">{title}</CardTitle>
              <div className="grid grid-cols-2 gap-1 rounded-full border border-yellow-200 bg-yellow-50 p-1">
                <Button
                  type="button"
                  variant={mode === 'login' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onModeChange('login')}
                >
                  Đăng nhập
                </Button>
                <Button
                  type="button"
                  variant={mode === 'register' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onModeChange('register')}
                >
                  Đăng ký
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              {notice?.message ? (
                <div className={cn('rounded-2xl border px-3 py-2 text-sm', noticeClass)}>
                  {notice.message}
                </div>
              ) : null}

              <form className="space-y-4" onSubmit={handleSubmit}>
                {mode === 'register' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Họ và tên</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        placeholder="Nguyễn Văn A"
                        value={form.fullName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="0901234567"
                        value={form.phone}
                        onChange={handleChange}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="user@pbms.vn"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Ít nhất 6 ký tự"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
