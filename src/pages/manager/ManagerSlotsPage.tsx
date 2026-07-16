import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { ModalForm } from '@/components/modals/ModalForm';
import { CustomSelect } from '@/components/ui/select';
import { MultiSlotForm, type SlotBatchForm } from '@/components/manager/MultiSlotForm';
import { Slots3DMapView } from '@/components/manager/slots/Slots3DMapView';
import { SLOT_STATUSES, slotStatusLabel } from '@/components/manager/slots/slots.constants';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import {
  managerApi,
  type Floor,
  type ParkingSlot,
  type VehicleType,
  type Zone,
} from '@/services/manager/managerApi';

interface FormState {
  code: string;
  floor: string;
  zone: string;
  status: ParkingSlot['status'];
  reservable: boolean;
  note: string;
}

const empty: FormState = {
  code: '',
  floor: '',
  zone: '',
  status: 'available',
  reservable: true,
  note: '',
};

export function ManagerSlotsPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<ParkingSlot[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [floorFilter, setFloorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ParkingSlot | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [multiSlotModalOpen, setMultiSlotModalOpen] = useState(false);

  const [viewMode, setViewMode] = useState<'list' | '3d'>('3d');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [slotsRes, floorsRes, vtRes, zonesRes] = await Promise.all([
        managerApi.slots.list(buildingId, {
          floor: floorFilter || undefined,
          status: statusFilter || undefined,
        }),
        managerApi.floors.list(buildingId),
        managerApi.vehicleTypes.list(buildingId),
        managerApi.zones.list(buildingId),
      ]);
      setItems(slotsRes.data.items);
      setFloors(floorsRes.data.items);
      setVehicleTypes(vtRes.data.items);
      setZones(zonesRes.data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [buildingId, floorFilter, statusFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const floorMap = useMemo(() => {
    const map = new Map<string, Floor>();
    floors.forEach((f) => map.set(f._id, f));
    return map;
  }, [floors]);

  // Group slots by floor plate for vertical 3D rendering
  const slotsByFloor = useMemo(() => {
    const grouped: Record<string, ParkingSlot[]> = {};
    floors.forEach((f) => {
      grouped[f._id] = [];
    });
    items.forEach((item) => {
      const fId = typeof item.floor === 'string' ? item.floor : item.floor._id;
      if (grouped[fId]) {
        grouped[fId].push(item);
      } else {
        grouped[fId] = [item];
      }
    });
    return grouped;
  }, [items, floors]);

  const openCreate = () => {
    setMultiSlotModalOpen(true);
  };

  const openEdit = (row: ParkingSlot) => {
    const floorId = typeof row.floor === 'string' ? row.floor : row.floor._id;
    const zoneId = !row.zone ? '' : typeof row.zone === 'string' ? row.zone : row.zone._id;
    setEditing(row);
    setForm({
      code: row.code,
      floor: floorId,
      zone: zoneId,
      status: row.status,
      reservable: row.reservable,
      note: row.note ?? '',
    });
    setModalOpen(true);
  };

  // Zones filtered by the floor currently selected in the edit form.
  const zonesForFloor = useMemo(
    () => zones.filter((z) => {
      const zFloorId = typeof z.floor === 'string' ? z.floor : (z.floor as Floor)._id;
      return zFloorId === form.floor;
    }),
    [zones, form.floor],
  );

  const onSubmit = async () => {
    if (!form.floor) { alert('Select a floor first'); return; }
    if (!form.zone) { alert('Select a zone first'); return; }
    // code bất biến sau khi tạo — không gửi lên khi update.
    const payload = {
      floor: form.floor,
      zone: form.zone,
      status: form.status,
      reservable: form.reservable,
      note: form.note.trim(),
    };
    try {
      if (editing) {
        await managerApi.slots.update(buildingId, editing._id, payload);
      } else {
        await managerApi.slots.create(buildingId, payload);
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const onDelete = async (row: ParkingSlot) => {
    if (!window.confirm(`Delete slot ${row.code}?`)) return;
    try {
      await managerApi.slots.remove(buildingId, row._id);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const onMultiSlotSubmit = async (batch: SlotBatchForm) => {
    await managerApi.slots.createBatch(buildingId, {
      floor: batch.floor,
      zone: batch.zone,
      quantity: batch.quantity,
      status: batch.status,
      reservable: batch.reservable,
      note: batch.note.trim(),
    });
    refresh();
  };

  const onStatusChange = async (row: ParkingSlot, status: ParkingSlot['status']) => {
    try {
      await managerApi.slots.updateStatus(buildingId, row._id, status);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const columns: DataColumn<ParkingSlot>[] = [
    { key: 'code', title: 'Slot Code' },
    {
      key: 'floor',
      title: 'Floor',
      render: (row) => {
        const id = typeof row.floor === 'string' ? row.floor : row.floor._id;
        const fl = floorMap.get(id);
        return fl ? fl.code : '?';
      },
    },
    {
      key: 'zone',
      title: 'Zone',
      render: (row) => {
        if (!row.zone) return '—';
        if (typeof row.zone === 'string') {
          const z = zones.find((z) => z._id === row.zone);
          return z ? z.code : '—';
        }
        return row.zone.code;
      },
    },
    {
      key: 'vehicleType',
      title: 'Vehicle Type',
      render: (row) => {
        const vt = row.vehicleType;
        if (!vt) return '—';
        if (typeof vt === 'string') {
          const found = vehicleTypes.find((v) => v._id === vt);
          return found ? found.code : '—';
        }
        return (vt as VehicleType).code;
      },
    },
    {
      key: 'status',
      title: 'Status',
      render: (row) => (
        <CustomSelect
          value={row.status}
          onChange={(val) => onStatusChange(row, val as ParkingSlot['status'])}
          options={SLOT_STATUSES.map((s) => ({ value: s, label: slotStatusLabel(s) }))}
          className="h-8 w-28 text-xs font-semibold"
        />
      ),
    },
    {
      key: 'reservable',
      title: 'Reservable',
      render: (row) => (row.reservable ? 'Yes' : 'No'),
    },
    {
      key: 'actions',
      title: '',
      render: (row) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(row)} className="hover:bg-orange-500/10 hover:text-orange-400">
            <Pencil size={14} />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(row)} className="hover:bg-rose-500/10 hover:text-rose-400">
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-6 animate-fadeIn">
      
      {/* Sci-fi Controller & Toggle Row */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-4 glass-panel-dark p-4 rounded-3xl border border-white/5">
        <div className="flex flex-wrap items-center gap-3">
          <CustomSelect
            value={floorFilter}
            onChange={setFloorFilter}
            options={[
              { value: '', label: 'All Floors' },
              ...floors.map((f) => ({
                value: f._id,
                label: f.name || f.code,
              })),
            ]}
            className="w-40"
          />

          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: '', label: 'All Statuses' },
              ...SLOT_STATUSES.map((s) => ({
                value: s,
                label: s === 'available' ? 'Available (Green)' : s === 'occupied' ? 'Occupied (Orange)' : s === 'reserved' ? 'Reserved (Blue)' : 'Maintenance (Amber)',
              })),
            ]}
            className="w-48"
          />
        </div>

        {/* View Toggle */}
        <div className="inline-flex rounded-xl bg-slate-950/80 border border-white/5 p-1 backdrop-blur-md">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === 'list'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-[0_0_10px_rgba(249,115,22,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Table View
          </button>
          <button
            onClick={() => setViewMode('3d')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === '3d'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-[0_0_10px_rgba(249,115,22,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            3D Hologram Map
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={openCreate} className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] gap-2">
            <Plus size={14} className="stroke-[3]" /> Add Slot
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-400 flex items-center justify-center p-24 glass-panel-dark rounded-3xl border border-white/5">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent mr-2" />
          Loading slot data...
        </div>
      ) : error ? (
        <div className="text-sm text-rose-400 glass-panel-dark p-6 rounded-3xl border border-rose-500/10 bg-rose-950/15">{error}</div>
      ) : (
        <div>
          {viewMode === 'list' ? (
            <div className="glass-panel-dark rounded-3xl border border-white/5 p-6 backdrop-blur-md shadow-2xl">
              <DataTable title={`Slots (${items.length})`} rows={items} columns={columns} />
            </div>
          ) : (
            <Slots3DMapView
              floors={floors}
              slotsByFloor={slotsByFloor}
              items={items}
              floorFilter={floorFilter}
              statusFilter={statusFilter}
              vehicleTypes={vehicleTypes}
              onSlotClick={openEdit}
            />
          )}
        </div>
      )}

      {/* Standard modal form for adding/editing slots */}
      <ModalForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Edit Slot' : 'Add Slot'}
        onSubmit={onSubmit}
      >
        <div className="grid gap-4 md:grid-cols-2 text-slate-100">
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Slot Code (auto-generated)</label>
            <Input
              value={form.code}
              readOnly
              disabled
              className="bg-slate-950 border-white/10 text-slate-400 rounded-xl"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Floor</label>
            <CustomSelect
              value={form.floor}
              onChange={(val) => setForm((f) => ({ ...f, floor: val, zone: '' }))}
              options={[
                { value: '', label: 'Select floor' },
                ...floors.map((fl) => ({ value: fl._id, label: fl.name || fl.code })),
              ]}
              placeholder="Select floor..."
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Zone *</label>
            {!form.floor ? (
              <p className="text-xs text-slate-500 rounded border border-white/8 px-3 py-2">Select a floor first to see the list of zones.</p>
            ) : zonesForFloor.length === 0 ? (
              <p className="text-xs text-amber-400 rounded border border-amber-500/20 px-3 py-2">
                This floor has no zones yet. Create a zone in the <strong>Zones</strong> tab first.
              </p>
            ) : (
              <CustomSelect
                value={form.zone}
                onChange={(val) => setForm((f) => ({ ...f, zone: val }))}
                options={[
                  { value: '', label: '-- Select zone --' },
                  ...zonesForFloor.map((z) => ({ value: z._id, label: z.name || z.code })),
                ]}
              />
            )}
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Status</label>
            <CustomSelect
              value={form.status}
              onChange={(val) => setForm((f) => ({ ...f, status: val as ParkingSlot['status'] }))}
              options={SLOT_STATUSES.map((s) => ({ value: s, label: slotStatusLabel(s) }))}
            />
          </div>
          <label className="flex items-center gap-3 text-xs font-bold text-slate-300 md:col-span-2 select-none">
            <input
              type="checkbox"
              checked={form.reservable}
              onChange={(e) => setForm((f) => ({ ...f, reservable: e.target.checked }))}
              className="w-4 h-4 rounded border-white/10 bg-slate-950 text-orange-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span>Selectable as fixed slot for packages</span>
          </label>
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Note</label>
            <Input
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-orange-500/40"
            />
          </div>
        </div>
      </ModalForm>

      {/* Multi-slot form for batch creation */}
      <MultiSlotForm
        isOpen={multiSlotModalOpen}
        onClose={() => setMultiSlotModalOpen(false)}
        onSubmit={onMultiSlotSubmit}
        floors={floors}
        zones={zones}
        slots={items}
      />
    </div>
  );
}
