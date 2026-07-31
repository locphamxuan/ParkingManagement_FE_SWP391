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
  theme?: 'dark' | 'light';
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an item...',
  className,
  disabled = false,
  theme = 'dark',
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

  // Không có Escape thì danh sách đang mở nuốt mọi cú click vào phần dưới form —
  // người dùng bàn phím không còn cách nào đóng nó ngoài việc chọn đại một mục.
  useEffect(() => {
    if (!isOpen) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      setIsOpen(false);
      containerRef.current?.querySelector('button')?.focus();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const isLight = theme === 'light';

  return (
    <div ref={containerRef} className={cn('relative w-full h-12', className)}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-full w-full items-center justify-between rounded-xl border px-4 text-sm font-semibold outline-none transition-all duration-300",
          isLight
            ? "border-slate-200 bg-white text-slate-800 hover:border-slate-350"
            : "border-slate-700/80 bg-[#070b12] text-white hover:border-slate-500",
          isOpen && (isLight ? "border-orange-500 ring-4 ring-orange-500/10" : "border-orange-300/60 ring-4 ring-orange-300/10"),
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <span className="truncate text-left block w-full">
          {selectedOption ? (
            selectedOption.label
          ) : (
            <span className={isLight ? "text-slate-400 font-medium" : "text-slate-500"}>{placeholder}</span>
          )}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-orange-500 shrink-0 ml-2"
        >
          <ChevronDown size={16} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              "pointer-events-auto absolute left-0 z-50 max-h-60 w-full overflow-y-auto rounded-2xl p-1.5 backdrop-blur-xl custom-scrollbar",
              isLight
                ? "border border-slate-200 bg-white/95 shadow-xl text-slate-700"
                : "border border-slate-700/80 bg-[#070b12]/95 shadow-[0_18px_60px_rgba(0,0,0,0.45)] text-slate-300"
            )}
            style={{ top: '100%' }}
          >
            {options.length === 0 ? (
              <li className="px-3.5 py-2.5 text-xs font-semibold text-slate-500 text-center">
                No options available
              </li>
            ) : (
              options.map((opt) => {
                const isSelected = opt.value === value;
                const isDisabled = opt.disabled === true;
                return (
                  <li
                    key={String(opt.value)}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isDisabled}
                    tabIndex={isDisabled ? -1 : 0}
                    onClick={() => {
                      if (isDisabled) return;
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (isDisabled) return;
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onChange(opt.value);
                        setIsOpen(false);
                      }
                    }}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150",
                      isLight
                        ? "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        : "text-slate-300 hover:bg-white/[0.06] hover:text-white",
                      isSelected && (
                        isLight
                          ? "bg-orange-500 text-white hover:bg-orange-600 font-black"
                          : "bg-orange-300 text-slate-950 hover:bg-orange-200 hover:text-slate-950 font-black"
                      ),
                      isDisabled && "cursor-not-allowed opacity-40 hover:bg-transparent"
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
