import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ModalForm } from '@/components/shared/ModalForm';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type Gate, type VehicleType } from '@/services/manager/managerApi';

interface FormState {
  code: string;
  name: string;
  direction: Gate['direction'];
  status: Gate['status'];
  allowedVehicleTypes: string[];
}

const empty: FormState = {
  code: '',
  name: '',
  direction: 'both',
  status: 'active',
  allowedVehicleTypes: [],
};

export function ManagerGatesPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<Gate[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Gate | null>(null);
  const [form, setForm] = useState<FormState>(empty);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [gates, vts] = await Promise.all([
        managerApi.gates.list(buildingId),
        managerApi.vehicleTypes.list(buildingId),
      ]);
      setItems(gates.data.items);
      setVehicleTypes(vts.data.items);
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

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setModalOpen(true);
  };

  const openEdit = (row: Gate) => {
    setEditing(row);
    setForm({
      code: row.code,
      name: row.name,
      direction: row.direction,
      status: row.status,
      allowedVehicleTypes: row.allowedVehicleTypes.map((v) =>
        typeof v === 'string' ? v : v._id
      ),
    });
    setModalOpen(true);
  };

  const onSubmit = async () => {
    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      direction: form.direction,
      status: form.status,
      allowedVehicleTypes: form.allowedVehicleTypes,
    };
    try {
      if (editing) {
        await managerApi.gates.update(buildingId, editing._id, payload as Parameters<typeof managerApi.gates.update>[2]);
      } else {
        await managerApi.gates.create(buildingId, payload as Parameters<typeof managerApi.gates.create>[1]);
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lưu thất bại');
    }
  };

  const onDelete = async (row: Gate) => {
    if (!window.confirm(`Xóa cổng ${row.code}?`)) return;
    try {
      await managerApi.gates.remove(buildingId, row._id);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  };

  const directionLabel: Record<Gate['direction'], string> = {
    in: 'Vào',
    out: 'Ra',
    both: 'Hai chiều',
  };

  const columns: DataColumn<Gate>[] = [
    { key: 'code', title: 'Mã' },
    { key: 'name', title: 'Tên' },
    { key: 'direction', title: 'Hướng', render: (row) => directionLabel[row.direction] },
    {
      key: 'allowedVehicleTypes',
      title: 'Loại xe',
      render: (row) =>
        row.allowedVehicleTypes
          .map((v) => (typeof v === 'string' ? v : v.code))
          .join(', ') || '—',
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      title: '',
      render: (row) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
            <Pencil size={14} />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(row)}>
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  const toggleType = (id: string) => {
    setForm((f) => ({
      ...f,
      allowedVehicleTypes: f.allowedVehicleTypes.includes(id)
        ? f.allowedVehicleTypes.filter((x) => x !== id)
        : [...f.allowedVehicleTypes, id],
    }));
  };

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="gap-2">
          <Plus size={14} /> Thêm cổng
        </Button>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">Đang tải...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : (
        <DataTable title="Cổng" rows={items} columns={columns} />
      )}
      <ModalForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Sửa cổng' : 'Thêm cổng'}
        onSubmit={onSubmit}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Mã</label>
            <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Tên</label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Hướng</label>
            <select
              className="h-10 rounded-md border border-border bg-card px-3 text-sm"
              value={form.direction}
              onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value as Gate['direction'] }))}
            >
              <option value="both">Hai chiều</option>
              <option value="in">Chỉ vào</option>
              <option value="out">Chỉ ra</option>
            </select>
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Trạng thái</label>
            <select
              className="h-10 rounded-md border border-border bg-card px-3 text-sm"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Gate['status'] }))}
            >
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
              <option value="maintenance">Bảo trì</option>
            </select>
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-xs uppercase text-muted-foreground">Loại xe được phép qua</label>
            <div className="flex flex-wrap gap-2">
              {vehicleTypes.length === 0 ? (
                <p className="text-xs text-muted-foreground">Chưa có loại xe.</p>
              ) : (
                vehicleTypes.map((vt) => {
                  const active = form.allowedVehicleTypes.includes(vt._id);
                  return (
                    <button
                      type="button"
                      key={vt._id}
                      onClick={() => toggleType(vt._id)}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        active
                          ? 'border-primary bg-primary/15 text-primary'
                          : 'border-border bg-muted/40 text-muted-foreground'
                      }`}
                    >
                      {vt.code}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </ModalForm>
    </div>
  );
}
