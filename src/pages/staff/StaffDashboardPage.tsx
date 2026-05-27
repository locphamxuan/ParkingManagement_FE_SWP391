import { useEffect, useState } from 'react';
import { CalendarClock, CheckCircle2, Clock, XCircle, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStaffDashboard } from '@/hooks/staff/useStaffDashboard';
import { staffApi, extractShifts, type MyShift } from '@/services/staff/staffApi';

const todayStr = () => new Date().toISOString().slice(0, 10);

const statusStyle: Record<MyShift['status'], string> = {
  scheduled: 'text-amber-700 bg-amber-50 border-amber-200',
  active: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  completed: 'text-stone-600 bg-stone-50 border-stone-200',
  cancelled: 'text-red-600 bg-red-50 border-red-200',
};
const statusLabel: Record<MyShift['status'], string> = {
  scheduled: 'Đã lên lịch',
  active: 'Đang làm',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export function StaffDashboardPage() {
  const { dashboard, loading: dashLoading, error: dashError } = useStaffDashboard();
  const [shifts, setShifts] = useState<MyShift[]>([]);
  const [shiftsLoading, setShiftsLoading] = useState(true);
  const [shiftsError, setShiftsError] = useState<string | null>(null);

  useEffect(() => {
    const d = todayStr();
    staffApi
      .myShifts({ from: d, to: d })
      .then((res) => {
        setShifts(extractShifts(res));
        setShiftsError(null);
      })
      .catch((err) => setShiftsError(err instanceof Error ? err.message : 'Tải thất bại'))
      .finally(() => setShiftsLoading(false));
  }, []);

  const stats = [
    {
      label: 'Tổng phiên',
      value: dashboard?.totalSessions ?? 0,
      icon: CheckCircle2,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Đang hoạt động',
      value: dashboard?.activeSessions ?? 0,
      icon: Clock,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Đã hoàn thành',
      value: dashboard?.completedSessions ?? 0,
      icon: CheckCircle2,
      color: 'text-stone-600 bg-stone-50',
    },
    {
      label: 'Doanh thu',
      value: dashboard?.revenue ?? 0,
      icon: DollarSign,
      color: 'text-amber-600 bg-amber-50',
      format: 'currency',
    },
  ];

  const shiftStats = [
    {
      label: 'Ca hôm nay',
      value: shifts.length,
      icon: CalendarClock,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Đang hoạt động',
      value: shifts.filter((s) => s.status === 'active').length,
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Đã lên lịch',
      value: shifts.filter((s) => s.status === 'scheduled').length,
      icon: Clock,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Đã hủy',
      value: shifts.filter((s) => s.status === 'cancelled').length,
      icon: XCircle,
      color: 'text-red-600 bg-red-50',
    },
  ];

  return (
    <div className="grid gap-5">
      {/* Dashboard Stats */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Thống kê hôm nay
        </h2>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {stats.map((card) => {
            const Icon = card.icon;
            const displayValue = card.format === 'currency'
              ? `${(card.value as number).toLocaleString('vi-VN')} đ`
              : String(card.value);

            return (
              <Card key={card.label}>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`rounded-xl p-3 ${card.color}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <p className="text-2xl font-semibold text-foreground">
                      {dashLoading ? '–' : displayValue}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Shift Stats */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Ca làm việc
        </h2>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {shiftStats.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.label}>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`rounded-xl p-3 ${card.color}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <p className="text-2xl font-semibold text-foreground">
                      {shiftsLoading ? '–' : String(card.value)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Shifts Today */}
      <Card>
        <CardHeader>
          <CardTitle>Ca làm việc hôm nay</CardTitle>
        </CardHeader>
        <CardContent>
          {shiftsLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          ) : shiftsError ? (
            <p className="text-sm text-red-600">{shiftsError}</p>
          ) : shifts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Không có ca nào được phân công hôm nay.</p>
          ) : (
            <div className="grid gap-3">
              {shifts.map((s) => (
                <div
                  key={s._id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-4"
                >
                  <div>
                    <p className="font-semibold text-foreground">
                      {s.shift.code} — {s.shift.name}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {s.shift.startTime} – {s.shift.endTime} · {s.building.name}
                    </p>
                    {s.note ? (
                      <p className="mt-1 text-xs italic text-muted-foreground">{s.note}</p>
                    ) : null}
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle[s.status]}`}
                  >
                    {statusLabel[s.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
