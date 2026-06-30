import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { staffApi, extractShifts, type MyShift } from '@/services/staff/staffApi';

export function StaffShiftsPage() {
  const [items, setItems] = useState<MyShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const refresh = useCallback(() => {
    setLoading(true);
    staffApi
      .myShifts({ from: from || undefined, to: to || undefined })
      .then((res) => {
        setItems(extractShifts(res));
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [from, to]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const columns: DataColumn<MyShift>[] = [
    {
      key: 'workDate',
      title: 'Date',
      render: (row) => new Date(row.workDate).toLocaleDateString('vi-VN'),
    },
    {
      key: 'shift',
      title: 'Ca',
      render: (row) => `${row.shift.code} — ${row.shift.startTime}–${row.shift.endTime}`,
    },
    { key: 'building', title: 'Building', render: (row) => row.building.name },
    {
      key: 'status',
      title: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    { key: 'note', title: 'Note', render: (row) => row.note ?? '—' },
  ];

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3">
        <div className="grid gap-1">
          <label className="text-xs uppercase text-muted-foreground">From date</label>
          <input
            type="date"
            className="h-9 rounded-md border border-border bg-card px-3 text-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="grid gap-1">
          <label className="text-xs uppercase text-muted-foreground">To date</label>
          <input
            type="date"
            className="h-9 rounded-md border border-border bg-card px-3 text-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        {from || to ? (
          <Button variant="ghost" size="sm" onClick={() => { setFrom(''); setTo(''); }}>
            Reset
          </Button>
        ) : null}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No shifts found in this date range.
          </CardContent>
        </Card>
      ) : (
        <DataTable title={`Shifts (${items.length})`} rows={items} columns={columns} />
      )}
    </div>
  );
}
