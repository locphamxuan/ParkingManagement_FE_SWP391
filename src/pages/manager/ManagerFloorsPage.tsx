import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ModalForm } from '@/components/modals/ModalForm';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type Floor, type VehicleType } from '@/services/manager/managerApi';

interface FormState {
  code: string;
  capacity: string;
  status: Floor['status'];
  allowedVehicleTypes: string[];
}

const empty: FormState = {
  code: '',
  capacity: '0',
  status: 'active',
  allowedVehicleTypes: [],
};

export function ManagerFloorsPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<Floor[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Floor | null>(null);
  const [form, setForm] = useState<FormState>(empty);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [floors, vts] = await Promise.all([
        managerApi.floors.list(buildingId),
        managerApi.vehicleTypes.list(buildingId),
      ]);
      setItems(floors.data.items);
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

  const openEdit = (row: Floor) => {
    setEditing(row);
    setForm({
      code: row.code,
      capacity: String(row.capacity),
      status: row.status,
      allowedVehicleTypes: row.allowedVehicleTypes.map((v) => (typeof v === 'string' ? v : v._id)),
    });
    setModalOpen(true);
  };

  const onSubmit = async () => {
    const payload = {
      code: form.code.trim().toUpperCase(),
      capacity: Number(form.capacity),
      status: form.status,
      allowedVehicleTypes: form.allowedVehicleTypes,
    };
    try {
      if (editing) {
        await managerApi.floors.update(buildingId, editing._id, payload as Parameters<typeof managerApi.floors.update>[2]);
      } else {
        await managerApi.floors.create(buildingId, payload as Parameters<typeof managerApi.floors.create>[1]);
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lưu thất bại');
    }
  };

  const onDelete = async (row: Floor) => {
    if (!window.confirm(`Xóa tầng ${row.code}? Tầng phải không có ô đỗ.`)) return;
    try {
      await managerApi.floors.remove(buildingId, row._id);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  };

  const toggleType = (id: string) => {
    setForm((f) => ({
      ...f,
      allowedVehicleTypes: f.allowedVehicleTypes.includes(id)
        ? f.allowedVehicleTypes.filter((x) => x !== id)
        : [...f.allowedVehicleTypes, id],
    }));
  };

  const columns: DataColumn<Floor>[] = useMemo(
    () => [
      { key: 'code', title: 'Mã tầng' },
      { key: 'capacity', title: 'Sức chứa' },
      {
        key: 'allowedVehicleTypes',
        title: 'Loại xe cho phép',
        render: (row) =>
          row.allowedVehicleTypes
            .map((v) => (typeof v === 'string' ? v : `${v.code}`))
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
    ],
    [vehicleTypes]
  );

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="gap-2">
          <Plus size={14} /> Thêm tầng
        </Button>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">Đang tải...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : (
        <DataTable title="Tầng" rows={items} columns={columns} />
      )}
      <ModalForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Sửa tầng' : 'Thêm tầng'}
        onSubmit={onSubmit}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Mã tầng</label>
            <Input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Sức chứa</label>
            <Input
              type="number"
              min={0}
              value={form.capacity}
              onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-xs uppercase text-muted-foreground">Trạng thái</label>
            <select
              className="h-10 rounded-md border border-border bg-card px-3 text-sm"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Floor['status'] }))}
            >
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
              <option value="maintenance">Bảo trì</option>
            </select>
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-xs uppercase text-muted-foreground">Loại xe được phép</label>
            <div className="flex flex-wrap gap-2">
              {vehicleTypes.length === 0 ? (
                <p className="text-xs text-muted-foreground">Chưa có loại xe. Hãy tạo trước.</p>
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
                      {vt.code} - {vt.name}
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
