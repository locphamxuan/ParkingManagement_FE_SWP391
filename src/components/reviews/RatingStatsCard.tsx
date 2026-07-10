import { StarRating } from '@/components/reviews/StarRating';

interface RatingStatsCardProps {
  avg: number;
  total: number;
}

/** Average rating summary card shown next to the review filters. */
export function RatingStatsCard({ avg, total }: RatingStatsCardProps) {
  return (
    <div className="rounded-3xl border border-white/8 bg-white/3 p-6 flex flex-col justify-center items-center text-center">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Average Rating</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-5xl font-black text-white">{avg}</span>
        <span className="text-slate-500 text-lg">/ 5.0</span>
      </div>
      <div className="mt-3 flex gap-1 text-orange-400">
        <StarRating rating={Math.round(avg)} size={18} inactiveClassName="text-slate-650" />
      </div>
      <p className="mt-2 text-xs text-slate-400">Based on {total} reviews</p>
    </div>
  );
}
