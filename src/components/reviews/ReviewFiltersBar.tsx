import { ChevronDown, RefreshCw } from 'lucide-react';

const RATING_OPTIONS = [
  { val: 'all', label: 'All ratings' },
  { val: '5', label: '5 stars ⭐⭐⭐⭐⭐' },
  { val: '4', label: '4 stars ⭐⭐⭐⭐' },
  { val: '3', label: '3 stars ⭐⭐⭐' },
  { val: '2', label: '2 stars ⭐⭐' },
  { val: '1', label: '1 star ⭐' },
] as const;

interface ReviewFiltersBarProps {
  buildings: { _id: string; name: string }[];
  selectedBuilding: string;
  setSelectedBuilding: (id: string) => void;
  selectedBuildingName: string;
  buildingDropdownOpen: boolean;
  setBuildingDropdownOpen: (open: boolean) => void;
  selectedRating: string;
  setSelectedRating: (rating: string) => void;
  selectedRatingLabel: string;
  ratingDropdownOpen: boolean;
  setRatingDropdownOpen: (open: boolean) => void;
}

/** Building + rating filter dropdowns for the reviews list, plus a reset button. */
export function ReviewFiltersBar({
  buildings,
  selectedBuilding,
  setSelectedBuilding,
  selectedBuildingName,
  buildingDropdownOpen,
  setBuildingDropdownOpen,
  selectedRating,
  setSelectedRating,
  selectedRatingLabel,
  ratingDropdownOpen,
  setRatingDropdownOpen,
}: ReviewFiltersBarProps) {
  return (
    <div className="md:col-span-2 rounded-3xl border border-white/8 bg-white/3 p-6 space-y-4">
      <p className="text-xs font-black uppercase tracking-wider text-slate-300">Review Filters</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="relative">
          <label className="text-[11px] font-bold text-slate-400 uppercase">Building / Parking Lot</label>
          <div className="relative mt-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setBuildingDropdownOpen(!buildingDropdownOpen);
                setRatingDropdownOpen(false);
              }}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs text-white focus:border-orange-500/50 focus:outline-none transition-all flex justify-between items-center cursor-pointer hover:border-white/20 hover:bg-slate-850"
            >
              <span className="font-semibold text-slate-200">{selectedBuildingName}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${buildingDropdownOpen ? 'transform rotate-180' : ''}`} />
            </button>

            {buildingDropdownOpen && (
              <div className="absolute z-30 w-full mt-1.5 rounded-xl border border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-2xl max-h-60 overflow-y-auto py-1 animate-in fade-in slide-in-from-top-1 duration-200">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBuilding('all');
                    setBuildingDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 text-xs transition-all cursor-pointer ${
                    selectedBuilding === 'all'
                      ? 'text-orange-400 bg-orange-500/10 font-bold'
                      : 'text-slate-355 hover:text-white hover:bg-white/5'
                  }`}
                >
                  All parking lots
                </button>
                {buildings.map((b) => (
                  <button
                    key={b._id}
                    type="button"
                    onClick={() => {
                      setSelectedBuilding(b._id);
                      setBuildingDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs transition-all cursor-pointer ${
                      selectedBuilding === b._id
                        ? 'text-orange-400 bg-orange-500/10 font-bold'
                        : 'text-slate-355 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <label className="text-[11px] font-bold text-slate-400 uppercase">Rating</label>
          <div className="relative mt-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setRatingDropdownOpen(!ratingDropdownOpen);
                setBuildingDropdownOpen(false);
              }}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs text-white focus:border-orange-500/50 focus:outline-none transition-all flex justify-between items-center cursor-pointer hover:border-white/20 hover:bg-slate-850"
            >
              <span className="font-semibold text-slate-200">{selectedRatingLabel}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${ratingDropdownOpen ? 'transform rotate-180' : ''}`} />
            </button>

            {ratingDropdownOpen && (
              <div className="absolute z-30 w-full mt-1.5 rounded-xl border border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-2xl py-1 animate-in fade-in slide-in-from-top-1 duration-200">
                {RATING_OPTIONS.map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => {
                      setSelectedRating(item.val);
                      setRatingDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs transition-all cursor-pointer ${
                      selectedRating === item.val
                        ? 'text-orange-400 bg-orange-500/10 font-bold'
                        : 'text-slate-355 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={() => {
            setSelectedBuilding('all');
            setSelectedRating('all');
          }}
          className="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <RefreshCw size={12} /> Reset Filters
        </button>
      </div>
    </div>
  );
}
