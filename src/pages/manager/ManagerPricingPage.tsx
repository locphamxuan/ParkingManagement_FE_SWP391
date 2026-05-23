import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ModalForm } from '@/components/shared/ModalForm';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type PricePolicy, type VehicleType } from '@/services/manager/managerApi';

interface FormState {
  name: string;
  vehicleType: string;
  hourlyRate: string;
  dailyCap: string;
  minRate: string;
  maxRate: string;
  fromTime: string;
  toTime: string;
  isActive: boolean;
}

const empty: FormState = {
  name: '',
  vehicleType: '',
  hourlyRate: '',
  dailyCap: '',
  minRate: '',
  maxRate: '',
  fromTime: '00:00',
  toTime: '23:59',
  isActive: true,
};

export function ManagerPricingPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<PricePolicy[]>([]);
  const [vts, setVts] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PricePolicy | null>(null);
  const [form, setForm] = useState<FormState>(empty);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [list, vtList] = await Promise.all([
        managerApi.pricePolicies.list(buildingId),
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

  const openEdit = (row: PricePolicy) => {
    setEditing(row);
    setForm({
      name: row.name,
      vehicleType: typeof row.vehicleType === 'string' ? row.vehicleType : row.vehicleType._id,
      hourlyRate: String(row.hourlyRate),
      dailyCap: row.dailyCap != null ? String(row.dailyCap) : '',
      minRate: String(row.minRate ?? 0),
      maxRate: row.maxRate != null ? String(row.maxRate) : '',
      fromTime: row.timeWindow?.from ?? '00:00',
      toTime: row.timeWindow?.to ?? '23:59',
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
      name: form.name.trim(),
      vehicleType: form.vehicleType,
      hourlyRate: Number(form.hourlyRate),
      dailyCap: form.dailyCap ? Number(form.dailyCap) : null,
      minRate: form.minRate ? Number(form.minRate) : 0,
      maxRate: form.maxRate ? Number(form.maxRate) : null,
      timeWindow: { from: form.fromTime, to: form.toTime },
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await managerApi.pricePolicies.update(buildingId, editing._id, payload);
      } else {
        await managerApi.pricePolicies.create(buildingId, payload);
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lưu thất bại');
    }
  };

  const deactivate = async (row: PricePolicy) => {
    if (!window.confirm(`Vô hiệu hóa chính sách "${row.name}"?`)) return;
    try {
      await managerApi.pricePolicies.deactivate(buildingId, row._id);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Thất bại');
    }
  };

  const columns: DataColumn<PricePolicy>[] = [
    { key: 'name', title: 'Tên chính sách' },
    {
      key: 'vehicleType',
      title: 'Loại xe',
      render: (row) => (typeof row.vehicleType === 'string' ? row.vehicleType : row.vehicleType.code),
    },
    {
      key: 'hourlyRate',
      title: 'Giá/giờ',
      render: (row) => `${row.hourlyRate.toLocaleString('vi-VN')} đ`,
    },
    {
      key: 'dailyCap',
      title: 'Tối đa/ngày',
      render: (row) =>
        row.dailyCap != null ? `${row.dailyCap.toLocaleString('vi-VN')} đ` : '—',
    },
    {
      key: 'timeWindow',
      title: 'Khung giờ',
      render: (row) =>
        row.timeWindow ? `${row.timeWindow.from} – ${row.timeWindow.to}` : '—',
    },
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
          <Button size="sm" variant="ghost" onClick={() => deactivate(row)}>
            <PowerOff size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="gap-2">
          <Plus size={14} /> Tạo chính sách giá
        </Button>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">Đang tải...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : (
        <DataTable title="Bảng giá" rows={items} columns={columns} />
      )}

      <ModalForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Sửa chính sách giá' : 'Tạo chính sách giá'}
        onSubmit={onSubmit}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5 md:col-span-2">
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
              <option value="">Chọn loại xe</option>
              {vts.map((vt) => (
                <option key={vt._id} value={vt._id}>
                  {vt.code} - {vt.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Giá/giờ (VND)</label>
            <Input
              type="number"
              min={0}
              value={form.hourlyRate}
              onChange={(e) => setForm((f) => ({ ...f, hourlyRate: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Tối đa/ngày (tùy chọn)</label>
            <Input
              type="number"
              min={0}
              value={form.dailyCap}
              onChange={(e) => setForm((f) => ({ ...f, dailyCap: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Giá sàn</label>
            <Input
              type="number"
              min={0}
              value={form.minRate}
              onChange={(e) => setForm((f) => ({ ...f, minRate: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Giá trần</label>
            <Input
              type="number"
              min={0}
              value={form.maxRate}
              onChange={(e) => setForm((f) => ({ ...f, maxRate: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Từ</label>
            <Input
              type="time"
              value={form.fromTime}
              onChange={(e) => setForm((f) => ({ ...f, fromTime: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Đến</label>
            <Input
              type="time"
              value={form.toTime}
              onChange={(e) => setForm((f) => ({ ...f, toTime: e.target.value }))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            <span>Đang áp dụng</span>
          </label>
        </div>
      </ModalForm>
    </div>
  );
}
