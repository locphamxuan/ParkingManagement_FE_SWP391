import { Car } from 'lucide-react';

export default function Brand({ subtitle = 'Parking Management' }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 text-amber-950 shadow-lg shadow-yellow-200/60">
        <Car className="h-5 w-5" strokeWidth={2} />
      </div>
      <div>
        <p className="text-sm font-semibold leading-none tracking-tight text-amber-950">PBMS</p>
        <p className="mt-1 text-xs uppercase tracking-[0.24em] text-amber-700">{subtitle}</p>
      </div>
    </div>
  );
}
