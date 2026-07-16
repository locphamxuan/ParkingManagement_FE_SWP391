import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import {
  managerApi,
  type ManagerIncident,
  type ManagerIncidentStatus,
} from '@/services/manager/managerApi';
import { resolveErrorMessage } from '@/utils/apiErrors';

const STATUS_OPTIONS: ManagerIncidentStatus[] = ['open', 'investigating', 'escalated', 'resolved', 'closed'];

const SEVERITY_STYLES: Record<string, string> = {
  medium: 'border-sky-400/20 bg-sky-500/10 text-sky-300',
  high: 'border-amber-400/25 bg-amber-500/10 text-amber-300',
  critical: 'border-rose-400/25 bg-rose-500/10 text-rose-300',
};

export function ManagerIncidentsPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<ManagerIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ManagerIncidentStatus>('all');

  const [selected, setSelected] = useState<ManagerIncident | null>(null);
  const [resolveStatus, setResolveStatus] = useState<ManagerIncidentStatus>('investigating');
  const [resolutionNote, setResolutionNote] = useState('');
  const [violatorPlate, setViolatorPlate] = useState('');
  const [penaltyFee, setPenaltyFee] = useState('');
  const [payMethod, setPayMethod] = useState<'cash' | 'wallet' | 'qr'>('cash');
  const [isUpdating, setIsUpdating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!buildingId) return;
    setLoading(true);
    try {
      const res = await managerApi.incidents.list(buildingId, {
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 100,
      });
      setItems(res.data.items ?? []);
      setError(null);
    } catch (err) {
      setError(resolveErrorMessage(err, 'Failed to load incidents.'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [buildingId, statusFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openModal = (incident: ManagerIncident) => {
    setSelected(incident);
    setResolveStatus(incident.status === 'open' || !incident.status ? 'investigating' : incident.status);
    setResolutionNote(incident.resolutionNote || '');
    setViolatorPlate(incident.violatorPlate || '');
    setPenaltyFee('');
    setPayMethod('cash');
    setModalError(null);
  };

  const submitUpdate = async (penalize: boolean) => {
    if (!buildingId || !selected) return;
    if (penalize && !violatorPlate.trim()) {
      setModalError('Violator plate is required to penalize.');
      return;
    }
    setIsUpdating(true);
    setModalError(null);
    try {
      await managerApi.incidents.resolve(
        buildingId,
        selected._id,
        penalize
          ? {
              action: 'penalize_violator',
              violatorPlate: violatorPlate.trim(),
              penaltyFee: Number(penaltyFee) || 0,
              paymentMethod: payMethod,
              resolutionNote: resolutionNote.trim() || undefined,
            }
          : {
              status: resolveStatus,
              resolutionNote: resolutionNote.trim() || undefined,
              violatorPlate: violatorPlate.trim() || undefined,
            }
      );
      setSelected(null);
      await refresh();
    } catch (err) {
      setModalError(resolveErrorMessage(err, 'Failed to update incident.'));
    } finally {
      setIsUpdating(false);
    }
  };

  const filtered = items.filter((it) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (it.code || '').toLowerCase().includes(q) ||
      (it.type || '').toLowerCase().includes(q) ||
      (it.note || '').toLowerCase().includes(q) ||
      (it.violatorPlate || '').toLowerCase().includes(q) ||
      (it.reportedBy?.fullName || '').toLowerCase().includes(q)
    );
  });

  const columns: DataColumn<ManagerIncident>[] = [
    {
      key: 'code',
      title: 'Code',
      render: (it) => <span className="font-mono text-xs font-semibold text-orange-300">{it.code || it._id}</span>,
    },
    {
      key: 'type',
      title: 'Type',
      render: (it) => (
        <div>
          <p className="text-sm font-medium text-slate-100">{it.type || '—'}</p>
          {it.note && <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{it.note}</p>}
        </div>
      ),
    },
    {
      key: 'reportedBy',
      title: 'Reported By',
      render: (it) => (
        <div>
          <p className="text-sm text-slate-200">{it.reportedBy?.fullName || 'Unknown'}</p>
          <p className="text-xs text-slate-500">{it.reportedBy?.email || ''}</p>
        </div>
      ),
    },
    {
      key: 'severity',
      title: 'Severity',
      render: (it) => (
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${
            SEVERITY_STYLES[it.severity || 'medium'] ?? SEVERITY_STYLES.medium
          }`}
        >
          {it.severity || 'medium'}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (it) => <StatusBadge status={it.status || 'open'} />,
    },
    {
      key: 'createdAt',
      title: 'Date',
      render: (it) => (
        <span className="text-xs text-slate-400">
          {it.createdAt ? new Date(it.createdAt).toLocaleString('vi-VN') : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (it) => (
        <Button size="sm" variant="ghost" onClick={() => openModal(it)} className="text-xs hover:bg-orange-500/10">
          <ShieldAlert size={14} className="mr-1" /> Handle
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Incidents</h1>
          <p className="mt-1 text-sm text-slate-400">Review and resolve incidents reported by users and staff</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-orange-500">{filtered.length}</div>
          <p className="text-xs text-slate-400">incidents</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-white/8 bg-slate-800/30 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <Input
            placeholder="Search by code, type, note, plate, or reporter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', ...STATUS_OPTIONS] as const).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className="text-xs capitalize"
            >
              {s === 'all' ? 'All' : s}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-white/8 bg-slate-800/20">
        {loading ? (
          <div className="py-8 text-center text-slate-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle2 size={32} className="mx-auto mb-2 text-slate-600" />
            <p className="text-slate-400">No incidents found</p>
          </div>
        ) : (
          <DataTable title="Incident List" columns={columns} rows={filtered} />
        )}
      </div>

      <Modal
        open={selected !== null}
        onOpenChange={(open) => { if (!open && !isUpdating) setSelected(null); }}
        title={selected ? `Handle Incident ${selected.code || ''}` : 'Handle Incident'}
      >
        {selected && (
          <div className="grid max-h-[75vh] gap-4 overflow-y-auto pr-1">
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-white">{selected.type || '—'}</span>
                <StatusBadge status={selected.status || 'open'} />
              </div>
              {selected.note && <p className="mt-2 text-slate-300">{selected.note}</p>}
              {selected.slot?.code && <p className="mt-1 text-xs text-slate-400">Slot: {selected.slot.code}</p>}
              {selected.target && <p className="mt-1 text-xs text-slate-400">Target: {selected.target}</p>}
              <p className="mt-1 text-xs text-slate-500">
                Reported by {selected.reportedBy?.fullName || 'Unknown'}
                {selected.createdAt ? ` · ${new Date(selected.createdAt).toLocaleString('vi-VN')}` : ''}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Status
                </label>
                <select
                  value={resolveStatus}
                  onChange={(e) => setResolveStatus(e.target.value as ManagerIncidentStatus)}
                  className="h-10 w-full rounded-md border border-white/10 bg-slate-800/60 px-3 text-sm text-slate-100 outline-none focus:border-orange-500/50"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Violator plate
                </label>
                <Input
                  value={violatorPlate}
                  onChange={(e) => setViolatorPlate(e.target.value.toUpperCase())}
                  placeholder="e.g. 59G2-038.80"
                  className="h-10"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Resolution note
              </label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                rows={3}
                placeholder="How was this incident handled..."
                className="w-full resize-none rounded-md border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-orange-500/50"
              />
            </div>

            <div className="rounded-xl border border-rose-400/15 bg-rose-500/5 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-rose-300">Penalize violator</p>
              <p className="mt-1 text-xs text-slate-400">
                Force check-out the offending vehicle, charge a penalty fee, and resolve this incident.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Input
                  type="number"
                  min={0}
                  value={penaltyFee}
                  onChange={(e) => setPenaltyFee(e.target.value)}
                  placeholder="Penalty fee (VND)"
                  className="h-10"
                />
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as 'cash' | 'wallet' | 'qr')}
                  className="h-10 w-full rounded-md border border-white/10 bg-slate-800/60 px-3 text-sm text-slate-100 outline-none focus:border-orange-500/50"
                >
                  <option value="cash">Cash</option>
                  <option value="wallet">Wallet</option>
                  <option value="qr">QR</option>
                </select>
              </div>
            </div>

            {modalError && (
              <div className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300">
                {modalError}
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                disabled={isUpdating}
                onClick={() => submitUpdate(true)}
                className="gap-1.5 border-rose-400/25 text-rose-300 hover:bg-rose-500/10"
              >
                <ShieldAlert size={14} /> Penalize &amp; Resolve
              </Button>
              <Button disabled={isUpdating} onClick={() => submitUpdate(false)} className="gap-1.5">
                <CheckCircle2 size={14} /> Update Status
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
