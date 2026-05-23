import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticating, error } = useAuth();
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('1');

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await login(email, password);
      navigate('/admin/dashboard', { replace: true });
    } catch {
      return;
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.16),transparent_24%),linear-gradient(180deg,#fffaf4_0%,#f8f2e8_44%,#fffdf9_100%)]" />
      <div className="absolute -left-24 top-1/3 h-[300px] w-[300px] rounded-full bg-orange-500/16 blur-3xl" />
      <div className="absolute -right-24 top-12 h-[320px] w-[320px] rounded-full bg-amber-400/14 blur-3xl" />
      <Card className="relative w-full max-w-md border-border/80 bg-white/94">
        <CardHeader>
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/20 text-primary">
            <LockKeyhole size={18} />
          </div>
          <CardTitle className="text-2xl">Đăng nhập Admin</CardTitle>
          <p className="text-sm text-muted-foreground">Sử dụng thông tin giả để truy cập Trung tâm điều hành PBMS.</p>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <label className="text-sm text-muted-foreground">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm text-muted-foreground">Mật khẩu</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button disabled={isAuthenticating}>
              {isAuthenticating ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
            <p className="text-xs text-muted-foreground">Thông tin: admin@gmail.com / 1</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
