import { useCallback, useEffect, useState } from 'react';
import { ArrowRightLeft, LogIn, LogOut, Info } from 'lucide-react';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type Gate } from '@/services/manager/managerApi';

// Cổng ra/vào là cố định do hệ thống cấu hình — manager chỉ xem + đổi trạng thái.
const directionLabel: Record<Gate['direction'], string> = {
  in: 'Cổng vào',
  out: 'Cổng ra',
  both: 'Hai chiều',
};

const directionIcon: Record<Gate['direction'], React.ReactNode> = {
  in: <LogIn size={14} className="text-emerald-400" />,
  out: <LogOut size={14} className="text-rose-400" />,
  both: <ArrowRightLeft size={14} className="text-blue-400" />,
};

const GATE_STATUSES: Gate['status'][] = ['active', 'inactive', 'maintenance'];
const statusLabel: Record<Gate['status'], string> = {
  active: 'Hoạt động',
  inactive: 'Tạm ngưng',
  maintenance: 'Bảo trì',
};

export function ManagerGatesPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<Gate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const gates = await managerApi.gates.list(buildingId);
      setItems(gates.data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tải thất bại');
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onStatusChange = async (row: Gate, status: Gate['status']) => {
    setSavingId(row._id);
    // Optimistic update
    setItems((prev) => prev.map((g) => (g._id === row._id ? { ...g, status } : g)));
    try {
      await managerApi.gates.updateStatus(buildingId, row._id, status);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Cập nhật trạng thái thất bại');
      refresh();
    } finally {
      setSavingId(null);
    }
  };

  const columns: DataColumn<Gate>[] = [
    { key: 'code', title: 'Mã' },
    { key: 'name', title: 'Tên', render: (row) => row.name || '—' },
    {
      key: 'direction',
      title: 'Loại cổng',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-sm">
          {directionIcon[row.direction]} {directionLabel[row.direction]}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) => (
        <select
          className="h-8 rounded-lg border border-white/10 bg-slate-900 text-white px-2 text-xs disabled:opacity-50"
          value={row.status}
          disabled={savingId === row._id}
          onChange={(e) => onStatusChange(row, e.target.value as Gate['status'])}
        >
          {GATE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel[s]}
            </option>
          ))}
        </select>
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      <div className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-xs text-blue-400">
        <Info size={14} className="mt-0.5 shrink-0" />
        <span>
          Cổng ra / cổng vào là cố định do hệ thống cấu hình, áp dụng cho mọi loại xe. Manager chỉ
          có thể đổi trạng thái cổng (Hoạt động / Tạm ngưng / Bảo trì).
        </span>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Đang tải...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Chưa có cổng nào được cấu hình cho tòa nhà này.
        </div>
      ) : (
        <DataTable title="Cổng ra / vào" rows={items} columns={columns} />
      )}
    </div>
  );
}
