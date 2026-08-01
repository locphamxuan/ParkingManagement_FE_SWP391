import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Car, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { staffApi, type ParkingSession } from '@/services/staff/staffApi';

const fmtTime = (s?: string | null) =>
  s ? new Date(s).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

/**
 * Lịch sử xe VÀO hôm nay của nhân viên (có location: cổng vào, tầng, ô đỗ).
 * Báo cáo doanh thu đã chuyển hoàn toàn về phía Manager (tab Ví / Dòng tiền).
 */
export function StaffSessionsPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!buildingId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await staffApi.sessions.myCheckIns(buildingId);
      setItems(res.data?.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Car size={18} className="text-primary" />
          <div>
            <h2 className="text-base font-semibold text-foreground">Check-in History</h2>
            <p className="text-xs text-muted-foreground">
              Vehicles you checked in today {fmtDate(new Date().toISOString())}
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={refresh} className="gap-1.5">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{error}</div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <Card className="border border-primary/25 bg-primary/5">
          <CardContent className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Check-ins</p>
            <p className="mt-2 text-3xl font-black text-primary">{loading ? '—' : items.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Car size={14} className="text-primary" /> Today's Check-ins
            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              {items.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>
          ) : items.length === 0 ? (
            <div className="py-8 text-center">
              <Car size={28} className="mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No vehicle check-ins in today's shift.</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {items.map((s) => (
                <div key={s._id} className="rounded-xl border border-border bg-card/50 px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="rounded border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 font-mono text-xs font-bold text-amber-300">
                      {s.plateNumber}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock size={11} />
                      {fmtTime(s.entryTime)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin size={11} className="text-primary" />
                      Entry Gate: <strong className="text-foreground ml-1">{s.entryGate?.code ?? '—'}</strong>
                    </span>
                    <span className="text-muted-foreground">
                      Floor: <strong className="text-foreground">{s.slot?.floor?.name ?? s.slot?.floor?.code ?? '—'}</strong>
                    </span>
                    <span className="text-muted-foreground">
                      Slot: <strong className="text-foreground">{s.slot?.code ?? '—'}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
