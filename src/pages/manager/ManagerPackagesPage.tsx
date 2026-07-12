import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ModalForm } from '@/components/modals/ModalForm';
import { CustomSelect } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type LongTermPackage, type VehicleType } from '@/services/manager/managerApi';

interface FormState {
  code: string;
  name: string;
  vehicleType: string;
  durationDays: string;
  price: string;
  maxHoursPerDay: string;
  description: string;
  benefits: string;
  isActive: boolean;
}

const empty: FormState = {
  code: '',
  name: '',
  vehicleType: '',
  durationDays: '30',
  price: '0',
  maxHoursPerDay: '',
  description: '',
  benefits: '',
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
      setError(err instanceof Error ? err.message : 'Failed to load');
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
      maxHoursPerDay: row.maxHoursPerDay != null ? String(row.maxHoursPerDay) : '',
      description: row.description ?? '',
      benefits: (row.benefits ?? []).join('\n'),
      isActive: row.isActive,
    });
    setModalOpen(true);
  };

  const onSubmit = async () => {
    if (!form.vehicleType) {
      alert('Select a vehicle type first');
      return;
    }
    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      vehicleType: form.vehicleType,
      durationDays: Number(form.durationDays),
      price: Number(form.price),
      // Để trống → BE tự đặt mặc định theo thời hạn (tuần 5 / tháng 7 / năm 10).
      ...(form.maxHoursPerDay.trim() !== '' ? { maxHoursPerDay: Number(form.maxHoursPerDay) } : {}),
      description: form.description.trim(),
      benefits: form.benefits
        .split('\n')
        .map((b) => b.trim())
        .filter(Boolean),
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
      alert(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const onDelete = async (row: LongTermPackage) => {
    if (!window.confirm(`Delete package "${row.name}"?`)) return;
    try {
      await managerApi.packages.remove(buildingId, row._id);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const columns: DataColumn<LongTermPackage>[] = [
    { key: 'code', title: 'Code' },
    { key: 'name', title: 'Name' },
    {
      key: 'vehicleType',
      title: 'Vehicle type',
      render: (row) => (typeof row.vehicleType === 'string' ? row.vehicleType : row.vehicleType.code),
    },
    { key: 'durationDays', title: 'Duration (days)' },
    {
      key: 'price',
      title: 'Price',
      render: (row) => `${row.price.toLocaleString('vi-VN')} đ`,
    },
    {
      key: 'maxHoursPerDay',
      title: 'Free hours/day',
      render: (row) =>
        row.maxHoursPerDay && row.maxHoursPerDay > 0 ? `${row.maxHoursPerDay}h` : 'Unlimited',
    },
    {
      key: 'benefits',
      title: 'Perks',
      render: (row) => (
        <span className="text-xs text-slate-400">
          {(row.benefits?.length ?? 0) > 0 ? `${row.benefits!.length} perks` : '—'}
        </span>
      ),
    },
    {
      key: 'isActive',
      title: 'Status',
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
          <Plus size={14} /> Add package
        </Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner label="Loading packages..." />
        </div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : (
        <DataTable title="Long-term packages" rows={items} columns={columns} />
      )}

      <ModalForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Edit long-term package' : 'Add long-term package'}
        onSubmit={onSubmit}
      >
        <div className="grid gap-3 md:grid-cols-2 text-slate-100">
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 font-mono">Code</label>
            <Input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-orange-500/40"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 font-mono">Name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-orange-500/40"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Vehicle type</label>
            <CustomSelect
              value={form.vehicleType}
              onChange={(val) => setForm((f) => ({ ...f, vehicleType: val }))}
              options={[
                { value: '', label: 'Select' },
                ...vts.map((vt) => ({
                  value: vt._id,
                  label: `${vt.code} - ${vt.name}`,
                })),
              ]}
              placeholder="Select vehicle type..."
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 font-mono">Duration (days)</label>
            <Input
              type="number"
              min={1}
              value={form.durationDays}
              onChange={(e) => setForm((f) => ({ ...f, durationDays: e.target.value }))}
              className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-orange-500/40"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 font-mono">Price (VND)</label>
            <Input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-orange-500/40"
            />
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 font-mono">Free hours / day</label>
            <Input
              type="number"
              min={0}
              placeholder="Leave blank = auto by duration"
              value={form.maxHoursPerDay}
              onChange={(e) => setForm((f) => ({ ...f, maxHoursPerDay: e.target.value }))}
              className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-orange-500/40 placeholder-slate-600"
            />
            <p className="text-[11px] text-slate-400">
              Free parking hours per day. Extra hours are charged at the regular rate. Leave blank → defaults to 5h/week, 7h/month, 10h/year. 0 = unlimited.
              Packages do NOT hold a fixed slot — staff assign an available slot at check-in.
            </p>
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 font-mono">Description</label>
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-orange-500/40"
            />
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 font-mono">
              Package perks (one per line)
            </label>
            <textarea
              value={form.benefits}
              onChange={(e) => setForm((f) => ({ ...f, benefits: e.target.value }))}
              rows={4}
              placeholder={'Unlimited free parking\nPriority slot near the elevator\nFree car wash once a month'}
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-orange-500/40 placeholder-slate-600"
            />
            <p className="text-[11px] text-slate-400">
              These perks are shown to customers when choosing a package.
            </p>
          </div>
          <label className="flex items-center gap-3 text-xs font-bold text-slate-300 md:col-span-2 select-none">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="w-4 h-4 rounded border-white/10 bg-slate-950 text-orange-500 focus:ring-0 cursor-pointer"
            />
            <span>Available for sale</span>
          </label>
        </div>
      </ModalForm>
    </div>
  );
}
