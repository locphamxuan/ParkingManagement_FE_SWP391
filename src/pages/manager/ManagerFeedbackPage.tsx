import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, MessageSquare, RefreshCw, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type Feedback } from '@/services/manager/managerApi';

const STATUS_LABELS: Record<Feedback['status'], string> = {
  open: 'Chờ xử lý',
  in_progress: 'Đang xử lý',
  resolved: 'Đã giải quyết',
  closed: 'Đã đóng',
};

const fmtDate = (s: string) =>
  new Date(s).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

function RatingStars({ rating }: { rating?: number | null }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{rating}/5</span>
    </div>
  );
}

export function ManagerFeedbackPage() {
  const { buildingId } = useBuildingContext();

  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [newStatus, setNewStatus] = useState<Feedback['status'] | ''>('');
  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    if (!buildingId) return;
    setLoading(true);
    setError(null);
    try {
      const q = statusFilter ? { status: statusFilter } : undefined;
      const res = await managerApi.feedbacks.list(buildingId, q);
      const list = (res as { data?: { items: Feedback[] } })?.data?.items ?? [];
      setItems(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải phản hồi.');
    } finally {
      setLoading(false);
    }
  }, [buildingId, statusFilter]);

  useEffect(() => { void load(); }, [load]);

  const selected = items.find((i) => i._id === selectedId) ?? null;

  const handleSend = async () => {
    if (!selectedId || !responseText.trim()) return;
    setIsSending(true);
    setNotice(null);
    try {
      await managerApi.feedbacks.respond(buildingId, selectedId, {
        response: responseText.trim(),
        ...(newStatus ? { status: newStatus as Feedback['status'] } : {}),
      });
      setResponseText('');
      setNewStatus('');
      setNotice({ type: 'ok', text: 'Đã gửi phản hồi thành công.' });
      await load();
    } catch (err) {
      setNotice({ type: 'err', text: err instanceof Error ? err.message : 'Gửi phản hồi thất bại.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr,360px]">
      {/* Left: danh sách */}
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-primary" />
            <h2 className="text-base font-semibold text-foreground">Phản hồi khách hàng</h2>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Tất cả</option>
              <option value="open">Chờ xử lý</option>
              <option value="in_progress">Đang xử lý</option>
              <option value="resolved">Đã giải quyết</option>
              <option value="closed">Đã đóng</option>
            </select>
            <Button variant="secondary" size="sm" onClick={load} className="gap-1.5">
              <RefreshCw size={13} /> Làm mới
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-500">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
            Đang tải...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            <MessageSquare size={28} className="mx-auto mb-2 text-muted-foreground/40" />
            Không có phản hồi nào.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => { setSelectedId(item._id); setResponseText(''); setNewStatus(''); setNotice(null); }}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  selectedId === item._id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-card/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {item.subject || 'Không có tiêu đề'}
                      </p>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.user?.fullName ?? '—'} · {fmtDate(item.createdAt)}
                    </p>
                    <RatingStars rating={item.rating} />
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.content}</p>
                  </div>
                  {item.response && (
                    <CheckCircle2 size={14} className="shrink-0 text-emerald-500 mt-1" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: chi tiết + respond */}
      <div className="space-y-4">
        {selected ? (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Chi tiết phản hồi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Khách hàng</p>
                  <p className="mt-1 font-medium text-foreground">{selected.user?.fullName ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{selected.user?.email ?? ''}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tiêu đề</p>
                  <p className="mt-1 text-foreground">{selected.subject || 'Không có tiêu đề'}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nội dung</p>
                  <p className="mt-1 text-foreground whitespace-pre-wrap">{selected.content}</p>
                </div>

                {selected.rating != null && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Đánh giá</p>
                    <div className="mt-1"><RatingStars rating={selected.rating} /></div>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trạng thái</p>
                  <div className="mt-1"><StatusBadge status={selected.status} /></div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ngày gửi</p>
                  <p className="mt-1 text-xs text-muted-foreground">{fmtDate(selected.createdAt)}</p>
                </div>

                {selected.response && (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/8 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Đã phản hồi</p>
                    <p className="mt-1 text-sm text-foreground">{selected.response}</p>
                    {selected.respondedAt && (
                      <p className="mt-1 text-xs text-muted-foreground">{fmtDate(selected.respondedAt)}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Trả lời khách hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                  placeholder="Nhập câu trả lời cho khách hàng..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary resize-none"
                />
                <div className="grid gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Cập nhật trạng thái</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as Feedback['status'])}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Giữ nguyên ({STATUS_LABELS[selected.status]})</option>
                    <option value="in_progress">Đang xử lý</option>
                    <option value="resolved">Đã giải quyết</option>
                    <option value="closed">Đóng</option>
                  </select>
                </div>

                {notice && (
                  <div className={`rounded-lg border px-3 py-2 text-sm ${notice.type === 'ok' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600' : 'border-rose-500/25 bg-rose-500/10 text-rose-500'}`}>
                    {notice.text}
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleSend}
                  disabled={isSending || !responseText.trim()}
                >
                  {isSending ? 'Đang gửi...' : 'Gửi phản hồi'}
                </Button>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              <MessageSquare size={24} className="mx-auto mb-2 text-muted-foreground/40" />
              Chọn một phản hồi ở bên trái để xem chi tiết và trả lời.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
