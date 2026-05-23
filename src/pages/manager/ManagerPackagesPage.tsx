import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ModalForm } from '@/components/shared/ModalForm';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type LongTermPackage, type VehicleType } from '@/services/manager/managerApi';

interface FormState {
  code: string;
  name: string;
  vehicleType: string;
  durationDays: string;
  price: string;
  reservedSlots: string;
  description: string;
  isActive: boolean;
}

const empty: FormState = {
  code: '',
  name: '',
  vehicleType: '',
  durationDays: '30',
  price: '0',
  reservedSlots: '0',
  description: '',
  isActive: true,
};

export function ManagerPackagesPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<LongTermPackage[]>([]);
  const [vts, setVts] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LongTermPackage | null>(null);
  const [form, setForm] = useState<FormState>(empty);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [list, vtList] = await Promise.all([
        managerApi.packages.list(buildingId),
        managerApi.vehicleTypes.list(buildingId),
      ]);
      setItems(list.data.items);
      setVts(vtList.data.items);
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
    setForm({ ...empty, vehicleType: vts[0]?._id ?? '' });
    setModalOpen(true);
  };

  const openEdit = (row: LongTermPackage) => {
    setEditing(row);
    setForm({
      code: row.code,
      name: row.name,
      vehicleType: typeof row.vehicleType === 'string' ? row.vehicleType : row.vehicleType._id,
      durationDays: String(row.durationDays),
      price: String(row.price),
      reservedSlots: String(row.reservedSlots),
      description: row.description ?? '',
      isActive: row.isActive,
    });
    setModalOpen(true);
  };

  const onSubmit = async () => {
    if (!form.vehicleType) {
      alert('Chọn loại xe trước');
      return;
    }
    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      vehicleType: form.vehicleType,
      durationDays: Number(form.durationDays),
      price: Number(form.price),
      reservedSlots: Number(form.reservedSlots),
      description: form.description.trim(),
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await managerApi.packages.update(buildingId, editing._id, payload);
      } else {
        await managerApi.packages.create(buildingId, payload);
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lưu thất bại');
    }
  };

  const onDelete = async (row: LongTermPackage) => {
    if (!window.confirm(`Xóa gói "${row.name}"?`)) return;
    try {
      await managerApi.packages.remove(buildingId, row._id);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  };

  const columns: DataColumn<LongTermPackage>[] = [
    { key: 'code', title: 'Mã' },
    { key: 'name', title: 'Tên' },
    {
      key: 'vehicleType',
      title: 'Loại xe',
      render: (row) => (typeof row.vehicleType === 'string' ? row.vehicleType : row.vehicleType.code),
    },
    { key: 'durationDays', title: 'Thời hạn (ngày)' },
    {
      key: 'price',
      title: 'Giá',
      render: (row) => `${row.price.toLocaleString('vi-VN')} đ`,
    },
    { key: 'reservedSlots', title: 'Slot dành riêng' },
    {
      key: 'isActive',
      title: 'Trạng thái',
      render: (row) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} />,
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

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="gap-2">
          <Plus size={14} /> Thêm gói
        </Button>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">Đang tải...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : (
        <DataTable title="Gói dài hạn" rows={items} columns={columns} />
      )}

      <ModalForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Sửa gói dài hạn' : 'Thêm gói dài hạn'}
        onSubmit={onSubmit}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Mã</label>
            <Input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Tên</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Loại xe</label>
            <select
              className="h-10 rounded-md border border-border bg-card px-3 text-sm"
              value={form.vehicleType}
              onChange={(e) => setForm((f) => ({ ...f, vehicleType: e.target.value }))}
            >
              <option value="">Chọn</option>
              {vts.map((vt) => (
                <option key={vt._id} value={vt._id}>
                  {vt.code} - {vt.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Thời hạn (ngày)</label>
            <Input
              type="number"
              min={1}
              value={form.durationDays}
              onChange={(e) => setForm((f) => ({ ...f, durationDays: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Giá (VND)</label>
            <Input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Số slot dành riêng</label>
            <Input
              type="number"
              min={0}
              value={form.reservedSlots}
              onChange={(e) => setForm((f) => ({ ...f, reservedSlots: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-xs uppercase text-muted-foreground">Mô tả</label>
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            <span>Đang mở bán</span>
          </label>
        </div>
      </ModalForm>
    </div>
  );
}
