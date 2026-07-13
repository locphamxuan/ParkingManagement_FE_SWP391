import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ModalForm } from '@/components/modals/ModalForm';
import { CustomSelect } from '@/components/ui/select';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type Floor, type VehicleType } from '@/services/manager/managerApi';

interface FormState {
  name: string;
  capacity: string;
  status: Floor['status'];
  allowedVehicleTypes: string[];
}

const empty: FormState = {
  name: '',
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
    setForm(empty);
    setModalOpen(true);
  };

  const openEdit = (row: Floor) => {
    setEditing(row);
    setForm({
      name: row.name || row.code,
      capacity: String(row.capacity),
      status: row.status,
      allowedVehicleTypes: row.allowedVehicleTypes.map((v) => (typeof v === 'string' ? v : v._id)),
    });
    setModalOpen(true);
  };

  const onSubmit = async () => {
    const payload = {
      name: form.name.trim(),
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
      alert(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const onDelete = async (row: Floor) => {
    if (!window.confirm(`Delete floor ${row.name || row.code}? The floor must have no slots.`)) return;
    try {
      await managerApi.floors.remove(buildingId, row._id);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
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

  // Không memo hóa: mảng cấu hình cột rẻ, memo với closure cũ dễ gây stale handler.
  const columns: DataColumn<Floor>[] = [
      { key: 'name', title: 'Floor Name', render: (row) => row.name || row.code },
      { key: 'code', title: 'Code' },
      { key: 'capacity', title: 'Capacity' },
      {
        key: 'allowedVehicleTypes',
        title: 'Allowed Vehicle Types',
        render: (row) =>
          row.allowedVehicleTypes
            .map((v) => (typeof v === 'string' ? v : `${v.code}`))
            .join(', ') || '—',
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
      <div className="flex justify-end">
        <Button onClick={openCreate} className="gap-2">
          <Plus size={14} /> Add Floor
        </Button>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : (
        <DataTable title="Floors" rows={items} columns={columns} />
      )}
      <ModalForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Edit Floor' : 'Add Floor'}
        onSubmit={onSubmit}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Floor Name</label>
            <Input
              placeholder="e.g. Level 1, Basement B1"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Capacity</label>
            <Input
              type="number"
              min={0}
              value={form.capacity}
              onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-xs uppercase text-muted-foreground">Status</label>
            <CustomSelect
              value={form.status}
              onChange={(val) => setForm((f) => ({ ...f, status: val as Floor['status'] }))}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'maintenance', label: 'Maintenance' },
              ]}
            />
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-xs uppercase text-muted-foreground">Allowed Vehicle Types</label>
            <div className="flex flex-wrap gap-2">
              {vehicleTypes.length === 0 ? (
                <p className="text-xs text-muted-foreground">No vehicle types yet. Create one first.</p>
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
