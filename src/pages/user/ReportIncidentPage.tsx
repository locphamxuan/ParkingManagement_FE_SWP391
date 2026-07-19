import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { userApi, type UserIncident, type UserIncidentType } from '@/services/user/userApi';
import { resolveErrorMessage } from '@/utils/apiErrors';

const INCIDENT_TYPES: { value: UserIncidentType; label: string }[] = [
  { value: 'slot_occupied', label: 'Someone is parked in my slot' },
  { value: 'slot_blocked', label: 'My slot is blocked / obstructed' },
  { value: 'vehicle_damaged', label: 'My vehicle was damaged while parked' },
  { value: 'facility_issue', label: 'Facility issue (flooding, lighting, floor...)' },
  { value: 'wrong_scan', label: 'Wrong plate scan / vehicle mismatch' },
  { value: 'payment_dispute', label: 'Payment / fee dispute' },
  { value: 'lost_ticket', label: 'Lost ticket / QR' },
  { value: 'security', label: 'Security concern (theft, suspicious person)' },
  { value: 'other', label: 'Other' },
];

const STATUS_BADGE: Record<string, string> = {
  open: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  investigating: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  escalated: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
  resolved: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  closed: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
};

const typeLabel = (t: string) => INCIDENT_TYPES.find((x) => x.value === t)?.label ?? t;
const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleString('en-US') : '—');

export default function ReportIncidentPage() {
  const { session } = useAuth();

  const [type, setType] = useState<UserIncidentType>('slot_occupied');
  const [note, setNote] = useState('');
  const [violatorPlate, setViolatorPlate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [items, setItems] = useState<UserIncident[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userApi.incidents.listMine({ limit: 20 });
      setItems(res.data.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) void refresh();
  }, [session, refresh]);

  if (!session) return <Navigate to="/auth/login" replace />;

  const handleSubmit = async () => {
    setMessage(null);
    if (!note.trim()) {
      setMessage({ type: 'err', text: 'Please describe the incident.' });
      return;
    }
    setSubmitting(true);
    try {
      await userApi.incidents.create({
        type,
        note: note.trim(),
        violatorPlate: type === 'slot_occupied' ? violatorPlate.trim() || undefined : undefined,
      });
      setMessage({ type: 'ok', text: 'Incident reported. Staff and the building manager will handle it.' });
      setNote('');
      setViolatorPlate('');
      await refresh();
    } catch (err) {
      setMessage({ type: 'err', text: resolveErrorMessage(err, 'Failed to report incident.') });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative z-10">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-2xl font-black text-white">
            <ShieldAlert size={20} className="text-cyan-400" /> Report an Incident
          </h1>
          <p className="mt-1 text-xs font-semibold text-slate-400">Tell us what happened — on-site staff will handle it and you will be notified.</p>
        </div>

        {/* Form */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/55 p-6">
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Incident type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as UserIncidentType)}
            className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-white"
          >
            {INCIDENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {type === 'slot_occupied' && (
            <div className="mt-4">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Offending vehicle plate (optional)
              </label>
              <input
                value={violatorPlate}
                onChange={(e) => setViolatorPlate(e.target.value.toUpperCase())}
                placeholder="e.g. 59G2-038.80"
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-orange-400/60"
              />
            </div>
          )}

          <div className="mt-4">
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Description</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Describe what happened..."
              className="w-full resize-none rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-orange-400/60"
            />
          </div>

          {message && (
            <div
              className={`mt-4 flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold ${
                message.type === 'ok'
                  ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-rose-400/30 bg-rose-500/10 text-rose-300'
              }`}
            >
              {message.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              {message.text}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-black uppercase tracking-wider text-white transition-all hover:bg-orange-500 disabled:opacity-60"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
            {submitting ? 'Reporting...' : 'Submit Report'}
          </button>
        </div>

        {/* My incidents */}
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-white">My Incidents</h2>
          {loading ? (
            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 text-center text-xs text-slate-400">
              <Loader2 size={16} className="mx-auto mb-2 animate-spin text-orange-300" /> Loading...
            </div>
          ) : items.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-slate-900/50 p-4 text-center text-xs text-slate-500">
              You have not reported any incidents.
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((it) => (
                <div key={it._id} className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-black text-orange-300">{it.code}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${STATUS_BADGE[it.status] ?? STATUS_BADGE.open}`}>
                      {it.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-200">{typeLabel(it.type)}</p>
                  {it.note && <p className="mt-1 text-[11px] text-slate-400">{it.note}</p>}
                  {it.slot?.code && <p className="mt-1 text-[10px] text-slate-500">Slot: {it.slot.code}</p>}
                  {it.resolutionNote && (
                    <p className="mt-1 text-[11px] text-emerald-300/90">Resolution: {it.resolutionNote}</p>
                  )}
                  <p className="mt-1 text-[10px] text-slate-500">{fmtDate(it.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
