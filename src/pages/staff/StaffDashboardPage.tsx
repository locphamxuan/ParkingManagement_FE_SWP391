import { useEffect, useState } from 'react';
import { CalendarClock, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [shifts, setShifts] = useState<MyShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const d = todayStr();
    staffApi
      .myShifts({ from: d, to: d })
      .then((res) => {
        setShifts(extractShifts(res));
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Tải thất bại'))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
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
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((card) => {
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
                    {loading ? '–' : String(card.value)}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Ca làm việc hôm nay</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
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
