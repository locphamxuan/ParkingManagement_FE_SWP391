import { useState, useMemo, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface TimeScrollerProps {
  selected: string;
  onSelect: (t: string) => void;
}

const TIME_SLOTS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    TIME_SLOTS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

function getSectionForTime(t: string): string {
  const hour = parseInt(t.split(':')[0], 10);
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 24) return 'evening';
  return 'night';
}

export function TimeScroller({ selected, onSelect }: TimeScrollerProps) {
  const initialSection = useMemo(() => getSectionForTime(selected), [selected]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    morning: initialSection === 'morning',
    afternoon: initialSection === 'afternoon',
    evening: initialSection === 'evening',
    night: initialSection === 'night',
  });

  // Keep section expanded when selected time changes externally
  useEffect(() => {
    const sec = getSectionForTime(selected);
    setOpenSections((prev) => ({ ...prev, [sec]: true }));
  }, [selected]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const sections = useMemo(() => {
    const morning: string[] = [];
    const afternoon: string[] = [];
    const evening: string[] = [];
    const night: string[] = [];

    TIME_SLOTS.forEach((t) => {
      const sec = getSectionForTime(t);
      if (sec === 'morning') morning.push(t);
      else if (sec === 'afternoon') afternoon.push(t);
      else if (sec === 'evening') evening.push(t);
      else night.push(t);
    });

    return [
      { id: 'morning', label: '☀️ Sáng (06:00 - 11:30)', slots: morning },
      { id: 'afternoon', label: '🌤️ Trưa - Chiều (12:00 - 17:30)', slots: afternoon },
      { id: 'evening', label: '🌙 Tối (18:00 - 23:30)', slots: evening },
      { id: 'night', label: '🌌 Đêm (00:00 - 05:30)', slots: night },
    ];
  }, []);

  return (
    <div className="space-y-2">
      {sections.map((sec) => {
        const isOpen = openSections[sec.id];
        return (
          <div
            key={sec.id}
            className="rounded-2xl border border-white/[0.04] bg-[#0c1220]/25 overflow-hidden transition-all duration-200"
          >
            <button
              type="button"
              onClick={() => toggleSection(sec.id)}
              className="flex w-full items-center justify-between px-4 py-3.5 text-xs font-black uppercase tracking-wider text-slate-300 hover:bg-white/[0.03] transition duration-200"
            >
              <span>{sec.label}</span>
              <ChevronDown
                size={16}
                className={`text-slate-500 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-cyan-400' : ''
                }`}
              />
            </button>
            {isOpen && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-4 border-t border-white/[0.04]">
                {sec.slots.map((t) => {
                  const isSelected = selected === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onSelect(t)}
                      className={`rounded-xl py-2.5 text-xs font-bold transition-all duration-200 ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_4px_12px_rgba(6,182,212,0.3)] scale-105'
                          : 'border border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-cyan-300/30 hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
