import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Loader2, ParkingCircle, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  userApi,
  type BuildingViolationType,
  type IncidentReportType,
  type ParkingHistory,
  type UserIncident,
  type UserIncidentType,
} from '@/services/user/userApi';
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

const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleString('en-US') : '—');

export default function ReportIncidentPage() {
  const { session } = useAuth();

  const [type, setType] = useState<IncidentReportType>('slot_occupied');
  const [note, setNote] = useState('');
  const [violatorPlate, setViolatorPlate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [items, setItems] = useState<UserIncident[]>([]);
  const [loading, setLoading] = useState(true);

  // Chỉ xe ĐANG đỗ mới được báo sự cố (BE cũng chặn) — nên tải toàn bộ phiên
  // active, không dò trong trang lịch sử. Đỗ nhiều xe thì user tự chọn phiên.
  const [activeSessions, setActiveSessions] = useState<ParkingHistory[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [loadingSession, setLoadingSession] = useState(true);

  const activeSession = activeSessions.find((s) => s._id === sessionId) ?? null;

  // Bảng vi phạm do manager của chính tòa nhà đang đỗ cấu hình — mỗi tòa một bảng
  // khác nhau, nên phải tải lại mỗi khi user đổi sang xe đỗ ở tòa khác.
  const [violationTypes, setViolationTypes] = useState<BuildingViolationType[]>([]);
  const buildingId = activeSession?.building?._id;

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
    if (!session) return;
    void refresh();
    setLoadingSession(true);
    userApi.parkingHistory.list({ status: 'active', limit: 20 })
      .then((res) => {
        const found = res.data.items ?? [];
        setActiveSessions(found);
        setSessionId(found[0]?._id ?? '');
      })
      .catch(() => setActiveSessions([]))
      .finally(() => setLoadingSession(false));
  }, [session, refresh]);

  useEffect(() => {
    if (!buildingId) {
      setViolationTypes([]);
      return;
    }
    userApi.buildings
      .violationTypes(buildingId)
      .then((res) => setViolationTypes(res.data.items ?? []))
      .catch(() => setViolationTypes([]));
  }, [buildingId]);

  // Đổi xe sang tòa khác thì loại vi phạm đang chọn có thể không còn tồn tại ở
  // tòa mới — đưa về loại cố định để không gửi lên một code lạ.
  useEffect(() => {
    if (!INCIDENT_TYPES.some((t) => t.value === type) && !violationTypes.some((v) => v.code === type)) {
      setType('slot_occupied');
    }
  }, [violationTypes, type]);

  if (!session) return <Navigate to="/auth/login" replace />;

  const isViolationType = violationTypes.some((v) => v.code === type);
  // Người báo cáo cần khai biển số xe vi phạm cho cả nhóm "chiếm chỗ" lẫn mọi
  // loại vi phạm của tòa nhà — BE tra biển số này để quyết định escalate.
  const asksViolatorPlate = type === 'slot_occupied' || isViolationType;

  const typeLabel = (t: string) =>
    violationTypes.find((v) => v.code === t)?.label ??
    INCIDENT_TYPES.find((x) => x.value === t)?.label ??
    t;

  const handleSubmit = async () => {
    setMessage(null);
    if (!activeSession) {
      setMessage({ type: 'err', text: 'You can only report an incident while your vehicle is parked.' });
      return;
    }
    if (!note.trim()) {
      setMessage({ type: 'err', text: 'Please describe the incident.' });
      return;
    }
    setSubmitting(true);
    try {
      await userApi.incidents.create({
        type,
        note: note.trim(),
        violatorPlate: asksViolatorPlate ? violatorPlate.trim() || undefined : undefined,
        buildingId,
        sessionId: activeSession._id,
        slotId: activeSession.slot?._id,
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

        {/* Current parking session */}
        {loadingSession ? (
          <div className="mb-4 rounded-2xl border border-white/10 bg-slate-900/50 p-4 text-center text-xs text-slate-400">
            <Loader2 size={14} className="mx-auto mb-1 animate-spin text-cyan-300" /> Checking your active session...
          </div>
        ) : activeSession ? (
          <div className="mb-4 rounded-2xl border border-cyan-400/25 bg-cyan-500/10 p-4">
            <div className="flex items-center gap-3">
              <ParkingCircle size={20} className="shrink-0 text-cyan-300" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">This report will be linked to your parked vehicle</p>
                <p className="mt-0.5 text-sm font-semibold text-white">
                  {activeSession.plateNumber} · {activeSession.building?.name ?? 'Unknown building'}
                  {activeSession.slot?.code ? ` · Slot ${activeSession.slot.code}` : ''}
                </p>
              </div>
            </div>

            {activeSessions.length > 1 && (
              <div className="mt-3">
                <label
                  htmlFor="incident-session"
                  className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-cyan-300"
                >
                  Which parked vehicle?
                </label>
                <select
                  id="incident-session"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-orange-400/60"
                >
                  {activeSessions.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.plateNumber} — {s.building?.name ?? 'Unknown building'}
                      {s.slot?.code ? ` (Slot ${s.slot.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-4 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-xs font-semibold text-amber-300">
            You have no vehicle currently parked. Incidents can only be reported while your vehicle is inside a building.
          </div>
        )}

        {/* Bảng vi phạm của tòa nhà đang đỗ — mỗi manager tự cấu hình một bảng riêng. */}
        {activeSession && violationTypes.length > 0 && (
          <div className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/55">
            <div className="border-b border-white/10 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Violation rules at {activeSession.building?.name ?? 'this building'}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Set by the building manager. Select one below to report a violation.
              </p>
            </div>
            <ul className="divide-y divide-white/5">
              {violationTypes.map((v) => (
                <li key={v._id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="text-xs font-semibold text-slate-200">{v.label}</span>
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-slate-500">{v.code}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Form */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/55 p-6">
          <label
            htmlFor="incident-type"
            className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400"
          >
            Incident type
          </label>
          <select
            id="incident-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={!activeSession}
            className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            <optgroup label="General incidents">
              {INCIDENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </optgroup>
            {violationTypes.length > 0 && (
              <optgroup label={`Violations at ${activeSession?.building?.name ?? 'this building'}`}>
                {violationTypes.map((v) => (
                  <option key={v._id} value={v.code}>{v.label}</option>
                ))}
              </optgroup>
            )}
          </select>

          {asksViolatorPlate && (
            <div className="mt-4">
              <label
                htmlFor="incident-violator-plate"
                className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400"
              >
                Offending vehicle plate (optional)
              </label>
              <input
                id="incident-violator-plate"
                value={violatorPlate}
                onChange={(e) => setViolatorPlate(e.target.value.toUpperCase())}
                placeholder="e.g. 59G2-038.80"
                disabled={!activeSession}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-orange-400/60 disabled:opacity-50"
              />
            </div>
          )}

          <div className="mt-4">
            <label
              htmlFor="incident-note"
              className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400"
            >
              Description
            </label>
            <textarea
              id="incident-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Describe what happened..."
              disabled={!activeSession}
              className="w-full resize-none rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-orange-400/60 disabled:opacity-50"
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
            disabled={submitting || !activeSession}
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
