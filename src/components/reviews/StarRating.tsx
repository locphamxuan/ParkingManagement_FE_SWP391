import { Star } from 'lucide-react';

interface StarRatingProps {
  /** Number of filled stars (0-5). */
  rating: number;
  size?: number;
  inactiveClassName?: string;
}

/** Read-only row of 5 stars, filled up to `rating`. Used by the stats card and review cards. */
export function StarRating({ rating, size = 16, inactiveClassName = 'text-slate-700' }: StarRatingProps) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          fill={i < rating ? 'currentColor' : 'none'}
          className={i < rating ? 'text-orange-400' : inactiveClassName}
        />
      ))}
    </>
  );
}
