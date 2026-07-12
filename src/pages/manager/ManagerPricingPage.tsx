import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ModalForm } from '@/components/modals/ModalForm';
import { CustomSelect } from '@/components/ui/select';
import { TimePicker } from '@/components/ui/time-picker';
import { DatePicker } from '@/components/ui/date-picker';
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
  regular: 'Regular hours',
  peak: 'Peak hours',
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
      alert('Select a vehicle type first');
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
      alert(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const deactivate = async (row: PricePolicy) => {
    if (!window.confirm(`Deactivate policy "${row.name}"?`)) return;
    try {
      await managerApi.pricePolicies.deactivate(buildingId, row._id);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const columns: DataColumn<PricePolicy>[] = [
    { key: 'name', title: 'Policy name' },
    {
      key: 'vehicleType',
      title: 'Vehicle type',
      render: (row) => (typeof row.vehicleType === 'string' ? row.vehicleType : row.vehicleType.code),
    },
    {
      key: 'type',
      title: 'Rate type',
      render: (row) => TYPE_LABEL[(row.type === 'peak' ? 'peak' : 'regular') as PricingType],
    },
    {
      key: 'hourlyRate',
      title: 'Rate/hour',
      render: (row) => `${row.hourlyRate.toLocaleString('vi-VN')} đ`,
    },
    {
      key: 'timeWindow',
      title: 'Time window',
      render: (row) =>
        row.timeWindow ? `${row.timeWindow.from} – ${row.timeWindow.to}` : '—',
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
          <Plus size={14} /> Create pricing policy
        </Button>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : (
        <DataTable title="Price list" rows={items} columns={columns} />
      )}

      <ModalForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Edit pricing policy' : 'Create pricing policy'}
        onSubmit={onSubmit}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-xs uppercase text-muted-foreground">Name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Vehicle type</label>
            <CustomSelect
              value={form.vehicleType}
              onChange={(val) => setForm((f) => ({ ...f, vehicleType: val }))}
              options={[
                { value: '', label: 'Select vehicle type' },
                ...vts.map((vt) => ({
                  value: vt._id,
                  label: `${vt.code} - ${vt.name}`,
                })),
              ]}
              placeholder="Select vehicle type..."
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Rate type</label>
            <CustomSelect
              value={form.type}
              onChange={(val) => setForm((f) => ({ ...f, type: val as PricingType }))}
              options={[
                { value: 'regular', label: 'Regular hours' },
                { value: 'peak', label: 'Peak hours' },
              ]}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Rate/hour (VND)</label>
            <Input
              type="number"
              min={0}
              value={form.hourlyRate}
              onChange={(e) => setForm((f) => ({ ...f, hourlyRate: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">From</label>
            <TimePicker
              value={form.fromTime}
              onChange={(val) => setForm((f) => ({ ...f, fromTime: val }))}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">To</label>
            <TimePicker
              value={form.toTime}
              onChange={(val) => setForm((f) => ({ ...f, toTime: val }))}
            />
          </div>
          <p className="md:col-span-2 text-[11px] text-muted-foreground">
            "Regular hours" applies by default; "Peak hours" applies within the From–To window. Fee = total parking hours × rate/hour for the matching window.
          </p>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Effective from</label>
            <DatePicker
              value={form.effectiveFrom}
              onChange={(val) => setForm((f) => ({ ...f, effectiveFrom: val }))}
            />
            <p className="text-[11px] text-muted-foreground">Leave blank = apply immediately.</p>
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Effective to</label>
            <DatePicker
              value={form.effectiveTo}
              onChange={(val) => setForm((f) => ({ ...f, effectiveTo: val }))}
            />
            <p className="text-[11px] text-muted-foreground">Leave blank = no expiry.</p>
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            <span>Currently applied</span>
          </label>
        </div>
      </ModalForm>
    </div>
  );
}
