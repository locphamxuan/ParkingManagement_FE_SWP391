import BuildingsTable from '@/components/features/BuildingsTable';
import ModuleGrid from '@/components/modules/ModuleGrid';
import PageShell from '@/components/layout/PageShell';
import SectionHeader from '@/components/layout/SectionHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LogOut, RefreshCw } from 'lucide-react';

export default function DashboardPage({
  user,
  onLogout,
  onRefresh,
  modules,
  onAction,
  isProfileLoading,
}) {
  const displayName = user?.fullName || user?.email || 'Người dùng';
  const initial = (displayName[0] || 'U').toUpperCase();

  return (
    <PageShell>
      <section className="flex flex-col gap-4 rounded-md border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-sm font-semibold"
            aria-hidden
          >
            {initial}
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Xin chào, {displayName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Quản lý hồ sơ và theo dõi bãi đỗ của bạn.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isProfileLoading}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {isProfileLoading ? 'Đang tải...' : 'Làm mới'}
          </Button>
          
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Vai trò" value={user?.role || 'user'} />
        <StatCard
          label="Trạng thái"
          value={user?.isActive ? 'Đang hoạt động' : 'Bị khóa'}
        />
        <StatCard label="Email" value={user?.email || '—'} />
        <StatCard label="Đăng nhập gần nhất" value={formatDate(user?.lastLoginAt)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold">Thông tin tài khoản</CardTitle>
              <Badge variant="secondary">{user?.role || 'user'}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isProfileLoading ? (
              <ProfileSkeleton />
            ) : (
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Họ tên" value={user?.fullName} />
                <Field label="Số điện thoại" value={user?.phone} />
                <Field label="Email" value={user?.email} />
                <Field label="Trạng thái" value={user?.isActive ? 'Hoạt động' : 'Khóa'} />
              </dl>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Đang phát triển</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <RoadmapItem title="Vận hành bãi" detail="Check-in, check-out, ca trực" />
            <RoadmapItem title="Tài chính" detail="Ví, thanh toán, gói dài hạn" />
            <RoadmapItem title="Đặt chỗ" detail="Reservation theo chính sách bãi" />
          </CardContent>
        </Card>
      </div>

      <section id="buildings-section" className="mt-8 scroll-mt-20">
        <SectionHeader
          label="Bãi đỗ"
          title="Danh sách tòa nhà"
          description="Dữ liệu đồng bộ từ API backend khi endpoint sẵn sàng."
        />
        <BuildingsTable />
      </section>

      <section className="mt-10">
        <SectionHeader label="Shortcuts" title="Truy cập nhanh" />
        <ModuleGrid modules={modules} compact onAction={onAction} />
      </section>
    </PageShell>
  );
}

function StatCard({ label, value }) {
  return (
    <Card className="card-interactive">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-sm font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value || '—'}</dd>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

function RoadmapItem({ title, detail }) {
  return (
    <div className="border-t border-border pt-3 first:border-t-0 first:pt-0">
      <p className="font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
