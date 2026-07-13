import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ModalForm } from '@/components/modals/ModalForm';
import { CustomSelect } from '@/components/ui/select';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type Floor, type VehicleType, type Zone } from '@/services/manager/managerApi';

const USAGE_TYPE_LABELS: Record<Zone['usageType'], string> = {
  walk_in: 'Walk-in',
  registered: 'Member',
  subscriber: 'Subscription',
  reserved: 'Reserved',
};

interface FormState {
  name: string;
  floor: string;
  vehicleType: string;
  usageType: Zone['usageType'];
  capacity: string;
  status: Zone['status'];
}

const empty: FormState = {
  name: '',
  floor: '',
  vehicleType: '',
  usageType: 'walk_in',
  capacity: '10',
  status: 'active',
};

export function ManagerZonesPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<Zone[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [floorFilter, setFloorFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Zone | null>(null);
  const [form, setForm] = useState<FormState>(empty);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [zonesRes, floorsRes, vtRes] = await Promise.all([
        managerApi.zones.list(buildingId, { floor: floorFilter || undefined }),
        managerApi.floors.list(buildingId),
        managerApi.vehicleTypes.list(buildingId),
      ]);
      setItems(zonesRes.data.items);
      setFloors(floorsRes.data.items);
      setVehicleTypes(vtRes.data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [buildingId, floorFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // When floor in form changes, reset vehicleType (must re-pick from allowed types on that floor).
  const onFormFloorChange = (val: string) => {
    setForm((f) => ({ ...f, floor: val, vehicleType: '' }));
  };

  // VehicleTypes allowed on the currently selected floor in the form.
  const allowedVehicleTypes = useMemo(() => {
    const fl = floors.find((f) => f._id === form.floor);
    if (!fl) return vehicleTypes;
    const allowed = fl.allowedVehicleTypes as Array<VehicleType | string>;
    if (!allowed.length) return vehicleTypes;
    const ids = new Set(allowed.map((v) => (typeof v === 'string' ? v : v._id)));
    return vehicleTypes.filter((vt) => ids.has(vt._id));
  }, [form.floor, floors, vehicleTypes]);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setModalOpen(true);
  };

  const openEdit = (row: Zone) => {
    const floorId = typeof row.floor === 'string' ? row.floor : row.floor._id;
    const vtId = typeof row.vehicleType === 'string' ? row.vehicleType : row.vehicleType._id;
    setEditing(row);
    setForm({
      name: row.name || row.code,
      floor: floorId,
      vehicleType: vtId,
      usageType: row.usageType,
      capacity: String(row.capacity),
      status: row.status,
    });
    setModalOpen(true);
  };

  const onSubmit = async () => {
    if (!form.floor) { alert('Select a floor first'); return; }
    if (!form.vehicleType) { alert('Select a vehicle type first'); return; }
    if (!form.name.trim()) { alert('Zone name is required'); return; }
    const payload = {
      name: form.name.trim(),
      floor: form.floor,
      vehicleType: form.vehicleType,
      usageType: form.usageType,
      capacity: Number(form.capacity),
      status: form.status,
    };
    try {
      if (editing) {
        await managerApi.zones.update(buildingId, editing._id, payload);
      } else {
        await managerApi.zones.create(buildingId, payload);
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const onDelete = async (row: Zone) => {
    if (!window.confirm(`Delete zone ${row.name || row.code}? The zone must have no remaining slots.`)) return;
    try {
      await managerApi.zones.remove(buildingId, row._id);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  // Không memo hóa: mảng cấu hình cột rẻ, memo với closure cũ dễ gây stale handler.
  const columns: DataColumn<Zone>[] = [
      { key: 'name', title: 'Zone Name', render: (row) => row.name || row.code },
      { key: 'code', title: 'Code' },
      {
        key: 'floor',
        title: 'Floor',
        render: (row) => {
          const fl = typeof row.floor === 'string' ? floors.find((f) => f._id === row.floor) : row.floor;
          return (fl as Floor)?.name ?? (fl as Floor)?.code ?? '—';
        },
      },
      {
        key: 'vehicleType',
        title: 'Vehicle Type',
        render: (row) => {
          const vt = typeof row.vehicleType === 'string'
            ? vehicleTypes.find((v) => v._id === row.vehicleType)
            : row.vehicleType as VehicleType;
          return vt ? `${vt.code} — ${vt.name}` : '—';
        },
      },
      {
        key: 'usageType',
        title: 'Usage',
        render: (row) => USAGE_TYPE_LABELS[row.usageType] ?? row.usageType,
      },
      {
        key: 'capacity',
        title: 'Capacity',
        render: (row) => `${row.slotCount ?? 0} / ${row.capacity}`,
      },
      {
        key: 'status',
        title: 'Status',
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

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CustomSelect
          value={floorFilter}
          onChange={setFloorFilter}
          options={[
            { value: '', label: 'All Floors' },
            ...floors.map((f) => ({ value: f._id, label: f.name || f.code })),
          ]}
          className="w-40"
        />
        <Button onClick={openCreate} className="gap-2">
          <Plus size={14} /> Add Zone
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : (
        <DataTable title={`Zones (${items.length})`} rows={items} columns={columns} />
      )}

      <ModalForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Edit Zone' : 'Add Zone'}
        onSubmit={onSubmit}
      >
        <div className="grid gap-3 md:grid-cols-2">
          {/* Tầng — chọn trước để lọc loại xe */}
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-xs uppercase text-muted-foreground">Floor *</label>
            <CustomSelect
              value={form.floor}
              onChange={onFormFloorChange}
              options={[
                { value: '', label: '-- Select Floor --' },
                ...floors.map((f) => ({ value: f._id, label: f.name || f.code })),
              ]}
            />
          </div>

          {/* Tên dãy — code do BE tự sinh từ tên */}
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Zone Name *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Walk-in Zone, VIP Zone"
            />
            <p className="text-[10px] text-muted-foreground">Zone code is generated automatically from the name.</p>
          </div>

          {/* Loại xe — lọc theo tầng đã chọn */}
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Vehicle Type *</label>
            {allowedVehicleTypes.length === 0 ? (
              <p className="text-xs text-muted-foreground rounded border border-border p-2">
                {form.floor ? 'This floor has no vehicle types configured.' : 'Select a floor first.'}
              </p>
            ) : (
              <CustomSelect
                value={form.vehicleType}
                onChange={(val) => setForm((f) => ({ ...f, vehicleType: val }))}
                options={[
                  { value: '', label: '-- Select Vehicle Type --' },
                  ...allowedVehicleTypes.map((vt) => ({ value: vt._id, label: `${vt.code} — ${vt.name}` })),
                ]}
              />
            )}
          </div>

          {/* Đối tượng sử dụng */}
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Usage *</label>
            <CustomSelect
              value={form.usageType}
              onChange={(val) => setForm((f) => ({ ...f, usageType: val as Zone['usageType'] }))}
              options={[
                { value: 'walk_in', label: 'Walk-in' },
                { value: 'registered', label: 'Member' },
                { value: 'subscriber', label: 'Subscription' },
                { value: 'reserved', label: 'Reserved' },
              ]}
            />
          </div>

          {/* Sức chứa */}
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Capacity *</label>
            <Input
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
            />
          </div>

          {/* Trạng thái */}
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Status</label>
            <CustomSelect
              value={form.status}
              onChange={(val) => setForm((f) => ({ ...f, status: val as Zone['status'] }))}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'maintenance', label: 'Maintenance' },
              ]}
            />
          </div>

          {/* Info note */}
          <div className="md:col-span-2">
            <p className="rounded-xl border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-[11px] text-sky-300">
              Every slot must belong to a zone. The zone determines the <strong>vehicle type</strong> and <strong>usage</strong> for all slots within it — changes here will sync down to every slot.
            </p>
          </div>
        </div>
      </ModalForm>
    </div>
  );
}
