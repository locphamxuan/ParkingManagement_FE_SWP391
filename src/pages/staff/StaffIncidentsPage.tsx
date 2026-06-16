import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Plus, RefreshCcw, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { extractIncidents, staffApi, type StaffIncident } from '@/services/staff/staffApi';

type IncidentStatus = 'open' | 'investigating' | 'escalated' | 'resolved' | 'closed';

interface IncidentRow {
  id: string;
  type: string;
  building: string;
  severity: 'medium' | 'high' | 'critical';
  status: IncidentStatus;
  timestamp: string;
  note: string;
}

const SEVERITY_LABELS: Record<string, string> = {
  medium: 'Trung bình',
  high: 'Cao',
  critical: 'Nghiêm trọng',
};

export function StaffIncidentsPage() {
  const { buildingId, building } = useBuildingContext();
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('all');
  const [items, setItems] = useState<IncidentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incidentType, setIncidentType] = useState('');
  const [incidentTarget, setIncidentTarget] = useState('');
  const [incidentNote, setIncidentNote] = useState('');
  const [incidentMessage, setIncidentMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const mapIncident = (item: StaffIncident, index: number): IncidentRow => ({
    id: item.code || item._id || `INC-${1000 + index}`,
    type: item.type || 'Sự cố',
    building: item.building?.code || item.building?.name || building?.code || '—',
    severity: item.severity || 'medium',
    status: (item.status as IncidentStatus) || 'open',
    timestamp: item.createdAt
      ? new Date(item.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
      : '—',
    note: item.note || '—',
  });

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    staffApi.incidents
      .list(buildingId)
      .then((res) => {
        const apiItems = extractIncidents(res.data as StaffIncident[] | { items: StaffIncident[] });
        setItems(apiItems.map(mapIncident));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Tải dữ liệu sự cố thất bại');
        setItems([]);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildingId]);

  const createIncident = async () => {
    if (!incidentType.trim()) return;
    setIsCreating(true);
    setIncidentMessage(null);
    try {
      await staffApi.incidents.create({
        type: incidentType.trim(),
        target: incidentTarget.trim() || undefined,
        note: incidentNote.trim() || undefined,
        buildingId: buildingId || undefined,
      });
      setIncidentMessage({ type: 'ok', text: 'Tạo sự cố thành công.' });
      setIncidentType('');
      setIncidentTarget('');
      setIncidentNote('');
      refresh();
    } catch (err) {
      setIncidentMessage({ type: 'err', text: err instanceof Error ? err.message : 'Tạo sự cố thất bại' });
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const matchQuery = `${item.id} ${item.type} ${item.building} ${item.note}`.toLowerCase().includes(query.toLowerCase());
        const matchSeverity = severity === 'all' || item.severity === severity;
        return matchQuery && matchSeverity;
      }),
    [items, query, severity]
  );

  const counts = useMemo(() => ({
    open: items.filter((i) => i.status === 'open').length,
    escalated: items.filter((i) => i.status === 'escalated').length,
    resolved: items.filter((i) => i.status === 'resolved').length,
  }), [items]);

  return (
    <div className="grid gap-6">
      {/* Header */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert size={20} className="text-primary" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Sự cố</p>
              <h2 className="text-xl font-semibold text-foreground">Quản lý sự cố</h2>
              <p className="text-sm text-muted-foreground">{building ? `${building.code} · ${building.name}` : 'Tất cả tòa nhà'}</p>
            </div>
          </div>
          <Button variant="secondary" onClick={refresh} className="gap-2">
            <RefreshCcw size={14} /> Làm mới
          </Button>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[1.15fr,0.85fr]">
        {/* Tổng quan */}
        <Card>
          <CardHeader>
            <CardTitle>Tổng quan sự cố</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-card/50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Đang mở</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{counts.open}</p>
              </div>
              <div className="rounded-xl border border-border bg-card/50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Leo thang</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{counts.escalated}</p>
              </div>
              <div className="rounded-xl border border-border bg-card/50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Đã giải quyết</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{counts.resolved}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusBadge status="open" />
              <StatusBadge status="investigating" />
              <StatusBadge status="escalated" />
              <StatusBadge status="resolved" />
            </div>
          </CardContent>
        </Card>

        {/* Tạo sự cố nhanh */}
        <Card>
          <CardHeader>
            <CardTitle>Báo cáo sự cố nhanh</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Input
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value)}
              placeholder="Loại sự cố: mất vé, rào chắn hỏng, đỗ sai..."
            />
            <Input
              value={incidentTarget}
              onChange={(e) => setIncidentTarget(e.target.value)}
              placeholder="Biển số / cổng / khu vực"
            />
            <Input
              value={incidentNote}
              onChange={(e) => setIncidentNote(e.target.value)}
              placeholder="Ghi chú ban đầu"
            />
            <Button
              type="button"
              onClick={createIncident}
              disabled={isCreating || !incidentType.trim()}
              className="gap-2 bg-gradient-to-r from-emerald-500 to-cyan-400 text-slate-950 hover:brightness-110 disabled:opacity-60"
            >
              <Plus size={14} /> Tạo phiếu sự cố
            </Button>
            {incidentMessage && (
              <p className={`text-xs ${incidentMessage.type === 'ok' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {incidentMessage.text}
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Lỗi tải */}
      {!loading && error && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-300">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-foreground">Không thể tải dữ liệu sự cố</p>
              <p className="mt-1">{error}</p>
            </div>
            <Button onClick={refresh} variant="secondary" className="gap-2">
              <RefreshCcw size={14} /> Thử lại
            </Button>
          </div>
        </div>
      )}

      {/* Danh sách sự cố */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách sự cố ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
            <div className="relative w-full md:max-w-md">
              <ShieldAlert className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo ID, loại, ghi chú..."
                className="pl-9"
              />
            </div>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="h-10 rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none"
            >
              <option value="all">Tất cả mức độ</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
              <option value="critical">Nghiêm trọng</option>
            </select>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Đang tải sự cố...</p>
          ) : (
            <div className="grid gap-3">
              {filtered.length === 0 ? (
                <div className="rounded-xl border border-border bg-card/50 p-6 text-sm text-muted-foreground text-center">
                  Không tìm thấy sự cố nào.
                </div>
              ) : (
                filtered.map((incident) => (
                  <div
                    key={incident.id}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-card/50 p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground font-mono text-sm">{incident.id}</p>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                          {SEVERITY_LABELS[incident.severity] ?? incident.severity}
                        </span>
                        <StatusBadge status={incident.status} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{incident.type} · {incident.building}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{incident.note}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground">
                        <Clock3 size={11} className="mr-1 inline-block" /> {incident.timestamp}
                      </div>
                      <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
                        <ArrowRight size={13} /> Chi tiết
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ghi chú trạng thái */}
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Mở', description: 'Sự cố mới — cần ghi nhận và xử lý', icon: AlertTriangle },
          { label: 'Đang xử lý', description: 'Đang điều tra tại hiện trường', icon: ShieldAlert },
          { label: 'Đã giải quyết', description: 'Đã xử lý xong và kiểm tra lại', icon: CheckCircle2 },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label}>
              <CardContent className="flex items-start gap-3 p-5">
                <div className="rounded-xl border border-emerald-400/15 bg-emerald-500/10 p-2.5 text-emerald-400 shrink-0">
                  <Icon size={17} />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{item.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
