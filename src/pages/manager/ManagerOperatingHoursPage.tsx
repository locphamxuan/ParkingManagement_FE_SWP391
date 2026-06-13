import { useEffect, useMemo, useState } from 'react';
import { Clock, Save, Loader2, DoorOpen, DoorClosed } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TimePicker } from '@/components/ui/time-picker';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi } from '@/services/manager/managerApi';

// Is `now` within [open, close]? Handles overnight windows (close < open).
function isOpenNow(open: string, close: string, now = new Date()): boolean {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const cur = now.getHours() * 60 + now.getMinutes();
  const o = toMin(open);
  const c = toMin(close);
  if (o === c) return false;
  return o < c ? cur >= o && cur < c : cur >= o || cur < c;
}

export function ManagerOperatingHoursPage() {
  const { buildingId, building } = useBuildingContext();

  const [open, setOpen] = useState('06:00');
  const [close, setClose] = useState('22:00');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (building?.operatingHours) {
      setOpen(building.operatingHours.open || '06:00');
      setClose(building.operatingHours.close || '22:00');
    }
  }, [building?.operatingHours]);

  const openNow = useMemo(() => isOpenNow(open, close), [open, close]);

  const handleSave = async () => {
    setNotice(null);
    if (open === close) {
      setNotice({ type: 'err', text: 'Giờ mở và giờ đóng không được trùng nhau.' });
      return;
    }
    setSaving(true);
    try {
      await managerApi.updateOperatingHours(buildingId, { open, close });
      setNotice({ type: 'ok', text: 'Đã cập nhật giờ hoạt động. Khách hàng sẽ thấy trạng thái mở/đóng theo giờ này.' });
    } catch (err) {
      setNotice({ type: 'err', text: err instanceof Error ? err.message : 'Cập nhật thất bại.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-5 max-w-2xl">
      <div className="flex items-center gap-2">
        <Clock size={18} className="text-primary" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Giờ hoạt động</h1>
          <p className="text-sm text-muted-foreground">
            Đặt giờ mở cửa và đóng cửa của tòa nhà. Ngoài khung giờ này, khách hàng sẽ thấy “đang đóng cửa”.
          </p>
        </div>
      </div>

      {/* Live status preview */}
      <Card className={openNow ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'}>
        <CardContent className="flex items-center gap-3 p-5">
          {openNow ? <DoorOpen size={24} className="text-emerald-400" /> : <DoorClosed size={24} className="text-rose-400" />}
          <div>
            <p className={`text-base font-bold ${openNow ? 'text-emerald-400' : 'text-rose-400'}`}>
              {openNow ? 'Hiện đang mở cửa' : 'Hiện đang đóng cửa'}
            </p>
            <p className="text-xs text-muted-foreground">
              {building ? `${building.code} · ${building.name}` : ''} · Khung giờ: {open} – {close}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cấu hình giờ mở / đóng cửa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Giờ mở cửa</label>
              <TimePicker value={open} onChange={setOpen} />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Giờ đóng cửa</label>
              <TimePicker value={close} onChange={setClose} />
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Mẹo: nếu bãi mở qua đêm (ví dụ mở 22:00, đóng 06:00 hôm sau), hệ thống tự hiểu là khung giờ qua ngày.
          </p>

          {notice && (
            <div className={`rounded-lg border px-3 py-2 text-sm ${notice.type === 'ok' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600' : 'border-rose-500/25 bg-rose-500/10 text-rose-500'}`}>
              {notice.text}
            </div>
          )}

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Đang lưu...' : 'Lưu giờ hoạt động'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
