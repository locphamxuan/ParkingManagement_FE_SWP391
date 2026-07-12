import { useCallback, useEffect, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi } from '@/services/manager/managerApi';

interface StaffMember {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  isActive?: boolean;
}

export function ManagerStaffPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!buildingId) return;
    setLoading(true);
    setError(null);
    managerApi.shifts
      .listStaff(buildingId)
      .then((res) => {
        const raw = res.data?.items ?? (Array.isArray(res.data) ? (res.data as StaffMember[]) : []);
        setItems(raw as StaffMember[]);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load staff list'))
      .finally(() => setLoading(false));
  }, [buildingId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const columns: DataColumn<StaffMember>[] = [
    { key: 'fullName', title: 'Full Name' },
    { key: 'email', title: 'Email' },
    { key: 'phone', title: 'Phone Number', render: (row) => row.phone || '—' },
    {
      key: 'isActive',
      title: 'Status',
      render: (row) => <StatusBadge status={row.isActive !== false ? 'active' : 'inactive'} />,
    },
  ];

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Building Staff</h2>
        <Button variant="ghost" size="sm" className="gap-1" onClick={refresh}>
          <RefreshCcw size={14} /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading staff list...</div>
      ) : error ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No staff have been assigned to this building yet.
          <br />
          <span className="text-xs">Admin needs to use the "Members" function to assign staff.</span>
        </div>
      ) : (
        <DataTable title={`Staff (${items.length})`} rows={items} columns={columns} />
      )}
    </div>
  );
}
