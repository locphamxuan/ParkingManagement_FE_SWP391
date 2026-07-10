import { Star } from 'lucide-react';

interface StarRatingInputProps {
  value: number;
  hoveredRating: number | null;
  onHover: (index: number | null) => void;
  onChange: (index: number) => void;
}

/** Interactive 5-star input used in the "Write a review" form. */
export function StarRatingInput({ value, hoveredRating, onHover, onChange }: StarRatingInputProps) {
  return (
    <div className="flex gap-1.5 py-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const index = i + 1;
        const active = hoveredRating !== null ? index <= hoveredRating : index <= value;

        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(index)}
            onMouseEnter={() => onHover(index)}
            onMouseLeave={() => onHover(null)}
            className="text-slate-700 hover:scale-110 active:scale-95 transition-all focus:outline-none cursor-pointer"
          >
            <Star
              size={28}
              fill={active ? '#f97316' : 'none'}
              className={active ? 'text-orange-500' : 'text-slate-800'}
            />
          </button>
        );
      })}
      <span className="ml-3 font-mono font-black text-orange-400 self-center text-xs">
        {value} / 5 stars
      </span>
    </div>
  );
}
