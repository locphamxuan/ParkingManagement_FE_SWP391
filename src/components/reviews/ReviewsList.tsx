import { MessageSquare, RefreshCw } from 'lucide-react';
import type { Feedback } from '@/services/user/userApi';
import { ReviewCard } from '@/components/reviews/ReviewCard';

interface ReviewsListProps {
  loading: boolean;
  reviews: Feedback[];
  selectedBuilding: string;
  selectedRating: string;
  currentUserId?: string;
  deletingId: string | null;
  onDelete: (feedbackId: string) => void;
  onWriteReview: () => void;
  page: number;
  totalPages: number;
  loadReviews: (page: number) => void;
}

/** Reviews grid with loading/empty states and pagination controls. */
export function ReviewsList({
  loading,
  reviews,
  selectedBuilding,
  selectedRating,
  currentUserId,
  deletingId,
  onDelete,
  onWriteReview,
  page,
  totalPages,
  loadReviews,
}: ReviewsListProps) {
  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <RefreshCw className="mx-auto animate-spin text-orange-500" size={32} />
        <p className="text-sm text-slate-450 font-medium">Loading reviews...</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-3xl border border-white/8 bg-white/3 p-16 text-center max-w-md mx-auto flex flex-col items-center">
        <MessageSquare size={48} className="mx-auto mb-4 text-slate-650" />
        <p className="text-base font-bold text-slate-300">No reviews yet</p>
        <p className="mt-1.5 text-xs text-slate-500 leading-relaxed max-w-xs">
          {selectedBuilding !== 'all' || selectedRating !== 'all'
            ? 'No reviews match the current filters.'
            : 'Be the first to share your parking experience!'}
        </p>
        <button
          type="button"
          onClick={onWriteReview}
          className="mt-5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all hover:scale-105 cursor-pointer shadow-lg shadow-orange-500/20"
        >
          Write the first review
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reviews Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {reviews.map((item) => (
          <ReviewCard
            key={item._id}
            item={item}
            currentUserId={currentUserId}
            deletingId={deletingId}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2.5 pt-4">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => loadReviews(page - 1)}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-40 hover:bg-white/10 transition-all"
          >
            ← Previous
          </button>
          <span className="text-xs text-slate-400 font-bold">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => loadReviews(page + 1)}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-40 hover:bg-white/10 transition-all"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
