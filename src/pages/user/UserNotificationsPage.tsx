import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { notificationApi, type AppNotification, NOTIFICATION_TYPE_LABEL } from '@/services/notificationApi';

export default function UserNotificationsPage() {
  const { session } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    notificationApi
      .list()
      .then((res) => {
        const d = (res as { data?: { items?: AppNotification[]; unread?: number } })?.data;
        setItems(d?.items ?? []);
        setUnread(d?.unread ?? 0);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const markAll = async () => {
    try {
      await notificationApi.markAllRead();
      setItems((p) => p.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch {
      /* ignore */
    }
  };

  const markOne = async (n: AppNotification) => {
    if (n.isRead) return;
    try {
      await notificationApi.markRead(n._id);
      setItems((p) => p.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
    } catch {
      /* ignore */
    }
  };

  if (!session) return <Navigate to="/auth/login" replace />;

  return (
    <main className="relative z-10">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-cyan-300" />
            <h1 className="text-2xl font-black text-white">Notifications</h1>
            {unread > 0 && (
              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white">{unread} new</span>
            )}
          </div>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAll}
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20"
            >
              <CheckCheck size={13} /> Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <p className="rounded-2xl border border-white/10 bg-slate-900/50 p-8 text-center text-sm text-slate-400">
            Loading...
          </p>
        ) : items.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-slate-900/50 p-12 text-center text-sm text-slate-400">
            You have no notifications.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((n) => (
              <button
                key={n._id}
                type="button"
                onClick={() => markOne(n)}
                className={`block w-full rounded-2xl border p-4 text-left transition-colors ${
                  n.isRead ? 'border-white/10 bg-slate-900/40' : 'border-rose-500/30 bg-rose-500/5'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    {!n.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {NOTIFICATION_TYPE_LABEL[n.type] ?? 'Notification'}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] text-slate-500">
                    {new Date(n.createdAt).toLocaleString('en-US')}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-semibold text-slate-100">{n.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{n.message}</p>
                {n.plateNumber ? (
                  <p className="mt-1 font-mono text-[11px] text-slate-500">Plate: {n.plateNumber}</p>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
