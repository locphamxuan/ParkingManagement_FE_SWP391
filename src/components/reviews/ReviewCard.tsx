import { Quote, RefreshCw, Trash2 } from 'lucide-react';
import type { Feedback } from '@/services/user/userApi';
import { StarRating } from '@/components/reviews/StarRating';
import { fmtTime } from '@/hooks/useReviews';

interface ReviewCardProps {
  item: Feedback;
  currentUserId?: string;
  deletingId: string | null;
  onDelete: (feedbackId: string) => void;
}

/** Single review card: reviewer info, star rating, comment and optional staff reply. */
export function ReviewCard({ item, currentUserId, deletingId, onDelete }: ReviewCardProps) {
  const userInitials = item.user?.fullName
    ? item.user.fullName
        .split(' ')
        .slice(-2)
        .map((word) => word[0])
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <div className="group relative rounded-3xl border border-white/6 bg-white/3 p-6 hover:border-orange-500/20 hover:bg-white/5 transition-all duration-350 shadow-lg hover:shadow-orange-500/2 shadow-slate-950/20 hover:scale-[1.01]">
      {/* Background decoration inside card */}
      <div className="absolute top-0 right-0 p-4 text-white/5 group-hover:text-orange-500/5 transition-colors">
        <Quote size={40} className="transform rotate-180" />
      </div>

      {currentUserId && item.user?._id === currentUserId && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item._id);
          }}
          disabled={deletingId === item._id}
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/25 bg-red-950/20 text-red-400 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all duration-200 disabled:opacity-40 cursor-pointer shadow-lg hover:scale-105"
          title="Delete review"
        >
          {deletingId === item._id ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <Trash2 size={14} />
          )}
        </button>
      )}

      <div className="flex items-start gap-4">
        {/* Avatar */}
        {item.user?.avatar ? (
          <img
            src={item.user.avatar}
            alt={item.user?.fullName || 'User'}
            className="h-11 w-11 rounded-full object-cover border border-white/10"
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-600 text-white font-bold text-sm shadow-md shadow-orange-500/10">
            {userInitials}
          </div>
        )}

        {/* Header details */}
        <div className="space-y-1">
          <p className="font-bold text-white leading-tight">
            {item.user?.fullName || item.user?.email || 'Anonymous user'}
          </p>
          <p className="text-[10px] font-semibold text-slate-450 tracking-wide">
            Customer · {item.building?.name || 'Parking lot'}
          </p>
        </div>
      </div>

      {/* Rating stars & Date */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-0.5 text-orange-400">
          <StarRating rating={item.rating} size={14} />
          <span className="ml-1.5 text-xs font-black text-slate-350">{item.rating}.0</span>
        </div>
        <span className="text-[10px] text-slate-500 font-semibold">{fmtTime(item.createdAt)}</span>
      </div>

      {/* Comment text */}
      <p className="mt-3 text-sm text-slate-300 leading-relaxed font-medium">
        {item.comment}
      </p>

      {/* Manager's reply */}
      {item.staffReply && (
        <div className="mt-4 rounded-2xl border border-orange-500/15 bg-orange-500/5 p-4 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
            <p className="text-[10px] font-black uppercase tracking-wider text-orange-400">
              Reply from administrator
            </p>
            {item.repliedBy?.fullName && (
              <span className="text-[10px] text-slate-450">({item.repliedBy.fullName})</span>
            )}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            {item.staffReply}
          </p>
        </div>
      )}
    </div>
  );
}
