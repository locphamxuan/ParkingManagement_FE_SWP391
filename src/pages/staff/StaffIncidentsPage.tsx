import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Filter,
  Plus,
  RefreshCcw,
  Search,
  ShieldAlert,
} from 'lucide-react';
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
  medium: 'Medium',
  high: 'Cao',
  critical: 'Critical',
};

const SEVERITY_STYLES: Record<string, string> = {
  medium: 'border-sky-400/20 bg-sky-500/10 text-sky-300',
  high: 'border-amber-400/25 bg-amber-500/10 text-amber-300',
  critical: 'border-rose-400/25 bg-rose-500/10 text-rose-300',
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
    type: item.type || 'Incidents',
    building: item.building?.code || item.building?.name || building?.code || '---',
    severity: item.severity || 'medium',
    status: (item.status as IncidentStatus) || 'open',
    timestamp: item.createdAt
      ? new Date(item.createdAt).toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
        })
      : '---',
    note: item.note || 'No notes',
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
        setError(err instanceof Error ? err.message : 'Failed to load incidents');
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
      setIncidentMessage({ type: 'ok', text: 'Incident created successfully.' });
      setIncidentType('');
      setIncidentTarget('');
      setIncidentNote('');
      refresh();
    } catch (err) {
      setIncidentMessage({ type: 'err', text: err instanceof Error ? err.message : 'Failed to create incident' });
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
        const matchQuery = `${item.id} ${item.type} ${item.building} ${item.note}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchSeverity = severity === 'all' || item.severity === severity;
        return matchQuery && matchSeverity;
      }),
    [items, query, severity]
  );

  const counts = useMemo(
    () => ({
      total: items.length,
      open: items.filter((i) => i.status === 'open').length,
      investigating: items.filter((i) => i.status === 'investigating').length,
      escalated: items.filter((i) => i.status === 'escalated').length,
      resolved: items.filter((i) => i.status === 'resolved').length,
      critical: items.filter((i) => i.severity === 'critical').length,
    }),
    [items]
  );

  const activeCount = counts.open + counts.investigating + counts.escalated;

  return (
    <div className="grid gap-5">
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70 bg-secondary/30">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Incident Overview</CardTitle>
            <p className="text-xs text-muted-foreground">{activeCount} incidents need attention</p>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              {
                label: 'Total',
                value: counts.total,
                icon: ShieldAlert,
                tone: 'border-slate-400/15 bg-slate-500/10 text-slate-200',
              },
              {
                label: 'Open',
                value: counts.open,
                icon: AlertTriangle,
                tone: 'border-amber-400/25 bg-amber-500/10 text-amber-300',
              },
              {
                label: 'In Progress',
                value: counts.investigating,
                icon: Clock3,
                tone: 'border-sky-400/25 bg-sky-500/10 text-sky-300',
              },
              {
                label: 'Leo thang',
                value: counts.escalated,
                icon: ArrowRight,
                tone: 'border-rose-400/25 bg-rose-500/10 text-rose-300',
              },
              {
                label: 'Resolved',
                value: counts.resolved,
                icon: CheckCircle2,
                tone: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-lg border border-border/80 bg-background/35 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                      {item.label}
                    </p>
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg border ${item.tone}`}>
                      <Icon size={15} />
                    </span>
                  </div>
                  <p className="mt-3 text-3xl font-semibold leading-none text-foreground">{item.value}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge status="open" />
            <StatusBadge status="investigating" />
            <StatusBadge status="escalated" />
            <StatusBadge status="resolved" />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70 bg-secondary/30">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Quick Incident Report</CardTitle>
            <p className="text-xs text-muted-foreground">Create a new ticket as soon as an issue is found at a gate or area</p>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr,0.8fr,1.2fr,auto] lg:items-start">
            <Input
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value)}
              placeholder="Incident type: lost ticket, broken barrier, wrong parking..."
              className="h-11 bg-background/60"
            />
            <Input
              value={incidentTarget}
              onChange={(e) => setIncidentTarget(e.target.value)}
              placeholder="License plate / gate / area"
              className="h-11 bg-background/60"
            />
            <Input
              value={incidentNote}
              onChange={(e) => setIncidentNote(e.target.value)}
              placeholder="Initial note"
              className="h-11 bg-background/60"
            />
            <Button
              type="button"
              onClick={createIncident}
              disabled={isCreating || !incidentType.trim()}
              className="h-11 gap-2 bg-gradient-to-r from-emerald-500 to-cyan-400 px-5 text-slate-950 hover:brightness-110 disabled:opacity-60"
            >
              <Plus size={14} /> Create Ticket
            </Button>
          </div>
          {incidentMessage && (
            <div
              className={`mt-3 rounded-lg border px-3 py-2 text-xs font-medium ${
                incidentMessage.type === 'ok'
                  ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300'
                  : 'border-rose-400/20 bg-rose-500/10 text-rose-300'
              }`}
            >
              {incidentMessage.text}
            </div>
          )}
        </CardContent>
      </Card>

      {!loading && error && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-300">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-foreground">Unable to load incident data</p>
              <p className="mt-1">{error}</p>
            </div>
            <Button onClick={refresh} variant="secondary" className="gap-2">
              <RefreshCcw size={14} /> Retry
            </Button>
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70 bg-secondary/30">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle>Incident List ({filtered.length})</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Prioritize critical and escalated tickets first.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-80">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={15}
                />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by ID, type, note..."
                  className="h-10 bg-background/60 pl-9"
                />
              </div>
              <div className="relative">
                <Filter
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={14}
                />
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-background/60 pl-9 pr-8 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring sm:w-44"
                >
                  <option value="all">All Severities</option>
                  <option value="medium">Medium</option>
                  <option value="high">Cao</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          {loading ? (
            <div className="rounded-lg border border-border/70 bg-background/35 p-8 text-center text-sm text-muted-foreground">
              Loading incidents...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-border/70 bg-background/35 p-8 text-center">
              <CheckCircle2 className="mx-auto text-emerald-300" size={24} />
              <p className="mt-3 text-sm font-semibold text-foreground">No incidents found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try changing the search keyword or severity filter.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.map((incident) => (
                <div
                  key={incident.id}
                  className="rounded-lg border border-border/80 bg-background/35 p-4 transition hover:border-primary/25 hover:bg-background/55"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-sm font-semibold text-foreground">{incident.id}</p>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                            SEVERITY_STYLES[incident.severity] ?? SEVERITY_STYLES.medium
                          }`}
                        >
                          {SEVERITY_LABELS[incident.severity] ?? incident.severity}
                        </span>
                        <StatusBadge status={incident.status} />
                      </div>
                      <p className="mt-2 text-sm font-semibold text-foreground">{incident.type}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{incident.note}</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:shrink-0">
                      <div className="rounded-md border border-border/70 bg-card/60 px-3 py-2 text-xs text-muted-foreground">
                        <Clock3 size={12} className="mr-1.5 inline-block" />
                        {incident.timestamp}
                      </div>
                      <div className="rounded-md border border-border/70 bg-card/60 px-3 py-2 text-xs text-muted-foreground">
                        {incident.building}
                      </div>
                      <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
                        Details <ArrowRight size={13} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          {
            label: 'Open',
            description: 'New incidents need to be recorded and classified.',
            icon: AlertTriangle,
            tone: 'border-amber-400/20 bg-amber-500/10 text-amber-300',
          },
          {
            label: 'In Progress',
            description: 'Staff are checking on site.',
            icon: ShieldAlert,
            tone: 'border-sky-400/20 bg-sky-500/10 text-sky-300',
          },
          {
            label: 'Resolved',
            description: 'Resolved and ready for review.',
            icon: CheckCircle2,
            tone: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300',
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="hover:translate-y-0">
              <CardContent className="flex items-start gap-3 p-4">
                <div className={`shrink-0 rounded-lg border p-2.5 ${item.tone}`}>
                  <Icon size={17} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
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
