import { useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/ui/select';

interface SearchFilterBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  filterValue?: string;
  filterOptions?: string[];
  onFilterChange?: (value: string) => void;
}

const optionMap: Record<string, string> = {
  all: 'All',
  active: 'Active',
  inactive: 'Inactive',
  maintenance: 'Maintenance',
  warning: 'Warning',
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff',
  user: 'User',
  blocked: 'Blocked',
  pending: 'Pending',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export function SearchFilterBar({
  query,
  onQueryChange,
  filterValue = 'all',
  filterOptions,
  onFilterChange,
}: SearchFilterBarProps) {
  const selectOptions = useMemo(() => {
    if (!filterOptions) return [];
    return filterOptions.map((opt) => ({
      value: opt,
      label: optionMap[opt] ?? opt,
    }));
  }, [filterOptions]);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card/80 p-3 md:flex-row md:items-center md:justify-between">
      <div className="relative w-full md:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search..."
          className="pl-9"
        />
      </div>
      {filterOptions && onFilterChange ? (
        <CustomSelect
          className="h-10 w-full md:w-48"
          value={filterValue}
          onChange={onFilterChange}
          options={selectOptions}
        />
      ) : null}
    </div>
  );
}
