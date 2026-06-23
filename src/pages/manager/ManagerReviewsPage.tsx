import { useCallback, useEffect, useState } from 'react';
import { MessageSquare, Star, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi } from '@/services/manager/managerApi';
import type { Feedback } from '@/services/user/userApi';
import { Modal } from '@/components/ui/modal';

interface ReplyFormState {
  reviewId: string;
  staffReply: string;
}

export function ManagerReviewsPage() {
  const { buildingId } = useBuildingContext();
  const [reviews, setReviews] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Feedback | null>(null);
  const [replyForm, setReplyForm] = useState<ReplyFormState>({ reviewId: '', staffReply: '' });
  const [replying, setReplying] = useState(false);

  const refresh = useCallback(async () => {
    if (!buildingId) return;
    setLoading(true);
    try {
      const query: Record<string, string | undefined> = {};
      if (statusFilter !== 'all') {
        query.status = statusFilter;
      }
      const result = await managerApi.feedbacks.list(buildingId, query);
      setReviews(result.data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tải thất bại');
    } finally {
      setLoading(false);
    }
  }, [buildingId, statusFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleReplyClick = (review: Feedback) => {
    setSelectedReview(review);
    setReplyForm({ reviewId: review._id, staffReply: review.staffReply || '' });
    setReplyModalOpen(true);
  };

  const handleReplySubmit = async () => {
    if (!buildingId) {
      alert('Không tìm thấy thông tin tòa nhà');
      return;
    }
    if (!replyForm.staffReply.trim()) {
      alert('Vui lòng nhập phản hồi');
      return;
    }

    setReplying(true);
    try {
      await managerApi.feedbacks.respond(buildingId, replyForm.reviewId, {
        staffReply: replyForm.staffReply.trim(),
        status: 'resolved',
      });

      await refresh();
      setReplyModalOpen(false);
      setReplyForm({ reviewId: '', staffReply: '' });
      setSelectedReview(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gửi phản hồi thất bại');
    } finally {
      setReplying(false);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (review.user?.fullName ?? '').toLowerCase().includes(searchLower) ||
      (review.user?.email ?? '').toLowerCase().includes(searchLower) ||
      (review.parkingSession?.plateNumber ?? '').toLowerCase().includes(searchLower) ||
      (review.comment ?? '').toLowerCase().includes(searchLower)
    );
  });

  const columns: DataColumn<Feedback>[] = [
    {
      key: 'user',
      title: 'Người dùng',
      render: (item) => (
        <div>
          <p className="font-medium text-slate-100">{item.user?.fullName ?? '—'}</p>
          <p className="text-xs text-slate-400">{item.user?.email ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'plateNumber',
      title: 'Biển số',
      render: (item) => (
        <span className="inline-block rounded bg-slate-800/50 px-2.5 py-1 font-mono text-sm text-amber-300">
          {item.parkingSession?.plateNumber ?? '—'}
        </span>
      ),
    },
    {
      key: 'rating',
      title: 'Đánh giá',
      render: (item) => (
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={14}
              className={i < item.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}
            />
          ))}
          <span className="ml-2 text-xs font-semibold text-slate-300">{item.rating}/5</span>
        </div>
      ),
    },
    {
      key: 'comment',
      title: 'Bình luận',
      render: (item) => (
        <p className="line-clamp-2 text-sm text-slate-300">{item.comment}</p>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (item) => {
        const resolved = item.status === 'resolved';
        const Icon = resolved ? CheckCircle : Clock;
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
              resolved
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
            }`}
          >
            <Icon size={12} />
            {resolved ? 'Đã trả lời' : 'Chờ trả lời'}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      title: 'Ngày',
      render: (item) => (
        <span className="text-xs text-slate-400">
          {new Date(item.createdAt).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      render: (item) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleReplyClick(item)}
          className="text-xs hover:bg-orange-500/10"
        >
          <MessageSquare size={14} className="mr-1" />
          {item.status === 'resolved' ? 'Chỉnh sửa' : 'Trả lời'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Xem Đánh giá</h1>
          <p className="mt-1 text-sm text-slate-400">Quản lý và trả lời đánh giá từ người dùng</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-orange-500">{filteredReviews.length}</div>
          <p className="text-xs text-slate-400">tổng số đánh giá</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-xl border border-white/8 bg-slate-800/30 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <Input
            placeholder="Tìm kiếm theo tên, email, biển số hoặc nội dung..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
            className="text-xs"
          >
            Tất cả
          </Button>
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('pending')}
            className="text-xs"
          >
            Chờ trả lời
          </Button>
          <Button
            variant={statusFilter === 'resolved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('resolved')}
            className="text-xs"
          >
            Đã trả lời
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Data Table */}
      <div className="rounded-xl border border-white/8 bg-slate-800/20 overflow-hidden">
        {loading ? (
          <div className="py-8 text-center text-slate-400">Đang tải...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-12 text-center">
            <MessageSquare size={32} className="mx-auto mb-2 text-slate-600" />
            <p className="text-slate-400">Không có đánh giá nào</p>
          </div>
        ) : (
          <DataTable title="Danh sách đánh giá" columns={columns} rows={filteredReviews} />
        )}
      </div>

      {/* Reply Modal */}
      <Modal isOpen={replyModalOpen} onClose={() => !replying && setReplyModalOpen(false)}>
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
          <div className="border-b border-white/8 p-6">
            <h2 className="text-xl font-bold text-slate-100">Trả lời đánh giá</h2>
            {selectedReview && (
              <div className="mt-4 space-y-3 rounded-lg bg-slate-800/40 p-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400">NGƯỜI DÙNG</p>
                  <p className="mt-1 font-medium text-slate-100">{selectedReview.user?.fullName ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">ĐÁNH GIÁ</p>
                  <div className="mt-1 flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < selectedReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}
                      />
                    ))}
                    <span className="ml-2 text-sm font-semibold text-slate-300">
                      {selectedReview.rating}/5
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">BÌNH LUẬN</p>
                  <p className="mt-1 text-sm text-slate-300">{selectedReview.comment}</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 p-6">
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Phản hồi của bạn *
              </label>
              <textarea
                value={replyForm.staffReply}
                onChange={(e) =>
                  setReplyForm({ ...replyForm, staffReply: e.target.value })
                }
                placeholder="Nhập phản hồi cho đánh giá này..."
                rows={5}
                className="w-full rounded-lg border border-white/10 bg-slate-800/60 px-4 py-2 text-slate-100 placeholder-slate-500 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/20"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => !replying && setReplyModalOpen(false)}
                disabled={replying}
              >
                Hủy
              </Button>
              <Button
                onClick={handleReplySubmit}
                disabled={replying || !replyForm.staffReply.trim()}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {replying ? 'Đang gửi...' : 'Gửi phản hồi'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
