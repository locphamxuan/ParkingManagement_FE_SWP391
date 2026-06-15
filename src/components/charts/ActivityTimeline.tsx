interface ActivityTimelineProps {
  title: string;
  items: string[];
}

export function ActivityTimeline({ title, items }: ActivityTimelineProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 font-mono">{title}</h3>
        <span className="px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-[9px] font-black text-orange-400 font-mono uppercase tracking-wider">
          {items.length} log
        </span>
      </div>
      <div className="max-h-[360px] overflow-y-auto pr-1">
        <ul className="space-y-1 relative pl-2">
          {/* Vertical line connecting the timeline dots */}
          <div className="absolute left-[3px] top-1.5 bottom-1.5 w-[1px] bg-slate-800" />
          
          {items.map((item, idx) => {
            const parts = item.split(': ');
            const hasType = parts.length > 1;
            const type = hasType ? parts[0] : '';
            const desc = hasType ? parts.slice(1).join(': ') : item;

            return (
              <li
                key={idx}
                className="relative pl-6 pb-4 last:pb-0 text-xs leading-relaxed group"
              >
                {/* Dot with glow on hover */}
                <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.6)] group-hover:scale-110 transition-transform duration-200" />
                
                <div className="min-w-0">
                  {hasType ? (
                    <div>
                      <span className="font-mono font-black text-orange-400 uppercase tracking-wide block">
                        {type}
                      </span>
                      <p className="mt-1 text-slate-300 font-medium leading-normal break-words">
                        {desc}
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-300 font-medium leading-normal break-words">
                      {desc}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
