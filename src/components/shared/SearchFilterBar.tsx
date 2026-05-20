import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchFilterBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  filterValue?: string;
  filterOptions?: string[];
  onFilterChange?: (value: string) => void;
}

export function SearchFilterBar({
  query,
  onQueryChange,
  filterValue,
  filterOptions,
  onFilterChange,
}: SearchFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card/80 p-3 md:flex-row md:items-center md:justify-between">
      <div className="relative w-full md:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Tìm kiếm..."
          className="pl-9"
        />
      </div>
      {filterOptions && onFilterChange ? (
        <select
          value={filterValue}
          onChange={(e) => onFilterChange(e.target.value)}
          className="h-10 rounded-md border border-border bg-secondary px-3 text-sm text-foreground outline-none"
        >
          {filterOptions.map((option) => {
            const map: Record<string, string> = {
              all: 'Tất cả',
              active: 'Hoạt động',
              inactive: 'Không hoạt động',
              maintenance: 'Bảo trì',
              warning: 'Cảnh báo',
              admin: 'Quản trị viên',
              manager: 'Quản lý',
              staff: 'Nhân viên',
              user: 'Người dùng',
              low: 'Thấp',
              medium: 'Trung bình',
              high: 'Cao',
              critical: 'Nguy cấp',
            };
            return (
              <option key={option} value={option}>
                {map[option] ?? option}
              </option>
            );
          })}
        </select>
      ) : null}
    </div>
  );
}
