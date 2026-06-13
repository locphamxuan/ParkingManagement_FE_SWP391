import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ModalForm } from '@/components/modals/ModalForm';
import { CustomSelect } from '@/components/ui/select';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type LongTermPackage, type VehicleType } from '@/services/manager/managerApi';

interface FormState {
  code: string;
  name: string;
  vehicleType: string;
  durationDays: string;
  price: string;
  reservedSlots: string;
  maxHoursPerDay: string;
  graceDays: string;
  description: string;
  benefits: string;
  allowDedicatedSlot: boolean;
  isActive: boolean;
}

const empty: FormState = {
  code: '',
  name: '',
  vehicleType: '',
  durationDays: '30',
  price: '0',
  reservedSlots: '0',
  maxHoursPerDay: '',
  graceDays: '7',
  description: '',
  benefits: '',
  allowDedicatedSlot: false,
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
      maxHoursPerDay: row.maxHoursPerDay != null ? String(row.maxHoursPerDay) : '',
      graceDays: row.graceDays != null ? String(row.graceDays) : '7',
      description: row.description ?? '',
      benefits: (row.benefits ?? []).join('\n'),
      allowDedicatedSlot: row.allowDedicatedSlot ?? false,
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
      // Để trống → BE tự đặt mặc định theo thời hạn (tuần 5 / tháng 7 / năm 10).
      ...(form.maxHoursPerDay.trim() !== '' ? { maxHoursPerDay: Number(form.maxHoursPerDay) } : {}),
      ...(form.graceDays.trim() !== '' ? { graceDays: Number(form.graceDays) } : {}),
      description: form.description.trim(),
      benefits: form.benefits
        .split('\n')
        .map((b) => b.trim())
        .filter(Boolean),
      allowDedicatedSlot: form.allowDedicatedSlot,
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
    {
      key: 'maxHoursPerDay',
      title: 'Giờ tối đa/ngày',
      render: (row) =>
        row.maxHoursPerDay && row.maxHoursPerDay > 0 ? `${row.maxHoursPerDay}h` : 'Không giới hạn',
    },
    {
      key: 'graceDays',
      title: 'Grace (ngày)',
      render: (row) => `${row.graceDays ?? 7} ngày`,
    },
    { key: 'reservedSlots', title: 'Slot dành riêng' },
    {
      key: 'benefits',
      title: 'Ưu đãi',
      render: (row) => (
        <span className="text-xs text-slate-400">
          {(row.benefits?.length ?? 0) > 0 ? `${row.benefits!.length} ưu đãi` : '—'}
          {row.allowDedicatedSlot ? ' · chỗ riêng' : ''}
        </span>
      ),
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
        <div className="grid gap-3 md:grid-cols-2 text-slate-100">
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 font-mono">Mã</label>
            <Input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-orange-500/40"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 font-mono">Tên</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-orange-500/40"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Loại xe</label>
            <CustomSelect
              value={form.vehicleType}
              onChange={(val) => setForm((f) => ({ ...f, vehicleType: val }))}
              options={[
                { value: '', label: 'Chọn' },
                ...vts.map((vt) => ({
                  value: vt._id,
                  label: `${vt.code} - ${vt.name}`,
                })),
              ]}
              placeholder="Chọn loại xe..."
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 font-mono">Thời hạn (ngày)</label>
            <Input
              type="number"
              min={1}
              value={form.durationDays}
              onChange={(e) => setForm((f) => ({ ...f, durationDays: e.target.value }))}
              className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-orange-500/40"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 font-mono">Giá (VND)</label>
            <Input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-orange-500/40"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 font-mono">Số slot dành riêng</label>
            <Input
              type="number"
              min={0}
              value={form.reservedSlots}
              onChange={(e) => setForm((f) => ({ ...f, reservedSlots: e.target.value }))}
              className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-orange-500/40"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 font-mono">Giờ tối đa / ngày</label>
            <Input
              type="number"
              min={0}
              placeholder="Để trống = tự theo thời hạn"
              value={form.maxHoursPerDay}
              onChange={(e) => setForm((f) => ({ ...f, maxHoursPerDay: e.target.value }))}
              className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-orange-500/40 placeholder-slate-600"
            />
            <p className="text-[11px] text-slate-400">
              Số giờ đỗ miễn phí/ngày. Vượt sẽ tính phí theo giá thường. Để trống → mặc định tuần 5h / tháng 7h / năm 10h. 0 = không giới hạn.
            </p>
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 font-mono">Giữ slot sau hết hạn (ngày)</label>
            <Input
              type="number"
              min={1}
              value={form.graceDays}
              onChange={(e) => setForm((f) => ({ ...f, graceDays: e.target.value }))}
              className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-orange-500/40"
            />
            <p className="text-[11px] text-slate-400">
              Sau khi gói hết hạn, giữ chỗ cố định cho khách thêm số ngày này (grace) trước khi thu hồi. Mặc định 7.
            </p>
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 font-mono">Mô tả</label>
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-orange-500/40"
            />
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 font-mono">
              Ưu đãi của gói (mỗi dòng 1 ưu đãi)
            </label>
            <textarea
              value={form.benefits}
              onChange={(e) => setForm((f) => ({ ...f, benefits: e.target.value }))}
              rows={4}
              placeholder={'Miễn phí giữ xe không giới hạn lượt\nƯu tiên chỗ gần thang máy\nMiễn phí rửa xe 1 lần/tháng'}
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-orange-500/40 placeholder-slate-600"
            />
            <p className="text-[11px] text-slate-400">
              Những ưu đãi này sẽ hiển thị cho khách hàng khi chọn mua gói.
            </p>
          </div>
          <label className="flex items-center gap-3 text-xs font-bold text-slate-300 md:col-span-2 select-none">
            <input
              type="checkbox"
              checked={form.allowDedicatedSlot}
              onChange={(e) => setForm((f) => ({ ...f, allowDedicatedSlot: e.target.checked }))}
              className="w-4 h-4 rounded border-white/10 bg-slate-950 text-orange-500 focus:ring-0 cursor-pointer"
            />
            <span>Cho phép giữ chỗ đỗ dành riêng (dedicated slot)</span>
          </label>
          <label className="flex items-center gap-3 text-xs font-bold text-slate-300 md:col-span-2 select-none">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="w-4 h-4 rounded border-white/10 bg-slate-950 text-orange-500 focus:ring-0 cursor-pointer"
            />
            <span>Đang mở bán</span>
          </label>
        </div>
      </ModalForm>
    </div>
  );
}
