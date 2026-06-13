import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ModalForm } from '@/components/modals/ModalForm';
import { CustomSelect } from '@/components/ui/select';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type PricePolicy, type VehicleType } from '@/services/manager/managerApi';

type PricingType = 'regular' | 'peak';

interface FormState {
  name: string;
  vehicleType: string;
  type: PricingType;
  hourlyRate: string;
  fromTime: string;
  toTime: string;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
}

const empty: FormState = {
  name: '',
  vehicleType: '',
  type: 'regular',
  hourlyRate: '',
  fromTime: '00:00',
  toTime: '23:59',
  effectiveFrom: '',
  effectiveTo: '',
  isActive: true,
};

const toDateInput = (v?: string | null) => (v ? new Date(v).toISOString().slice(0, 10) : '');

const TYPE_LABEL: Record<PricingType, string> = {
  regular: 'Giờ thường',
  peak: 'Cao điểm',
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
      type: row.type === 'peak' ? 'peak' : 'regular',
      hourlyRate: String(row.hourlyRate),
      fromTime: row.timeWindow?.from ?? '00:00',
      toTime: row.timeWindow?.to ?? '23:59',
      effectiveFrom: toDateInput(row.effectiveFrom),
      effectiveTo: toDateInput(row.effectiveTo),
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
      type: form.type,
      hourlyRate: Number(form.hourlyRate),
      timeWindow: { from: form.fromTime, to: form.toTime },
      ...(form.effectiveFrom ? { effectiveFrom: form.effectiveFrom } : {}),
      effectiveTo: form.effectiveTo ? form.effectiveTo : null,
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
      key: 'type',
      title: 'Loại giá',
      render: (row) => TYPE_LABEL[(row.type === 'peak' ? 'peak' : 'regular') as PricingType],
    },
    {
      key: 'hourlyRate',
      title: 'Giá/giờ',
      render: (row) => `${row.hourlyRate.toLocaleString('vi-VN')} đ`,
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
            <CustomSelect
              value={form.vehicleType}
              onChange={(val) => setForm((f) => ({ ...f, vehicleType: val }))}
              options={[
                { value: '', label: 'Chọn loại xe' },
                ...vts.map((vt) => ({
                  value: vt._id,
                  label: `${vt.code} - ${vt.name}`,
                })),
              ]}
              placeholder="Chọn loại xe..."
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Loại giá</label>
            <CustomSelect
              value={form.type}
              onChange={(val) => setForm((f) => ({ ...f, type: val as PricingType }))}
              options={[
                { value: 'regular', label: 'Giờ thường' },
                { value: 'peak', label: 'Cao điểm' },
              ]}
            />
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
          <p className="md:col-span-2 text-[11px] text-muted-foreground">
            “Giờ thường” áp dụng mặc định; “Cao điểm” áp dụng trong khung giờ Từ–Đến. Phí = tổng giờ đỗ × giá/giờ theo khung.
          </p>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Hiệu lực từ</label>
            <Input
              type="date"
              value={form.effectiveFrom}
              onChange={(e) => setForm((f) => ({ ...f, effectiveFrom: e.target.value }))}
            />
            <p className="text-[11px] text-muted-foreground">Để trống = áp dụng ngay.</p>
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Hiệu lực đến</label>
            <Input
              type="date"
              value={form.effectiveTo}
              onChange={(e) => setForm((f) => ({ ...f, effectiveTo: e.target.value }))}
            />
            <p className="text-[11px] text-muted-foreground">Để trống = không giới hạn.</p>
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
