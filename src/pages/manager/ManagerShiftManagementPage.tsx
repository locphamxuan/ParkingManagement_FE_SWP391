import { useState } from 'react';
import { CalendarClock, Users } from 'lucide-react';
import { ManagerShiftsPage } from '@/pages/manager/ManagerShiftsPage';
import { ManagerStaffShiftsPage } from '@/pages/manager/ManagerStaffShiftsPage';

type Tab = 'shifts' | 'assign';

const TABS: { value: Tab; label: string; icon: React.ElementType }[] = [
  { value: 'shifts', label: 'Shifts', icon: CalendarClock },
  { value: 'assign', label: 'Assign Staff to Shift', icon: Users },
];

/**
 * Combined "Ca trực & Gán ca" tab — định nghĩa ca trực và phân công nhân viên
 * vào ca (kèm cổng phụ trách) trong cùng một trang.
 */
export function ManagerShiftManagementPage() {
  const [tab, setTab] = useState<Tab>('shifts');

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Shifts &amp; Assignments</h1>
        <p className="text-sm text-muted-foreground">
          Manage the list of shifts and assign staff to shifts (with gate responsibility).
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex w-fit gap-1.5 rounded-lg border border-border bg-card p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                tab === t.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'shifts' ? <ManagerShiftsPage /> : <ManagerStaffShiftsPage />}
    </div>
  );
}
