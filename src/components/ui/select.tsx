import { useState, useRef, useEffect, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Chọn một mục...',
  className,
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-xl border border-white/10 bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg outline-none transition-all duration-300 hover:border-orange-500/30",
          isOpen && "border-orange-500/60 ring-2 ring-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.15)]",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <span className="truncate text-left block w-full">
          {selectedOption ? selectedOption.label : <span className="text-slate-500">{placeholder}</span>}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-orange-400 shrink-0 ml-2"
        >
          <ChevronDown size={16} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 z-50 max-h-60 w-full overflow-y-auto rounded-xl border border-white/10 bg-slate-950/95 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl pointer-events-auto custom-scrollbar"
            style={{ top: '100%' }}
          >
            {options.length === 0 ? (
              <li className="px-3.5 py-2.5 text-xs font-semibold text-slate-500 text-center">
                Không có lựa chọn nào
              </li>
            ) : (
              options.map((opt) => {
                const isSelected = opt.value === value;
                const isDisabled = opt.disabled === true;
                return (
                  <li
                    key={String(opt.value)}
                    onClick={() => {
                      if (isDisabled) return;
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-lg px-3.5 py-2.5 text-xs font-semibold text-slate-300 transition-all duration-150 hover:bg-orange-500/10 hover:text-white",
                      isSelected && "bg-orange-500 text-slate-950 hover:bg-orange-600 hover:text-slate-950 font-black shadow-[0_0_10px_rgba(249,115,22,0.25)]",
                      isDisabled && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-slate-300"
                    )}
                  >
                    {opt.label}
                  </li>
                );
              })
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
