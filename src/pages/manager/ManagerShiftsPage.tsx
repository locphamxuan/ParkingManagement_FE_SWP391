import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ModalForm } from '@/components/modals/ModalForm';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { TimePicker } from '@/components/ui/time-picker';
import { managerApi, type Shift } from '@/services/manager/managerApi';

interface FormState {
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

const empty: FormState = {
  code: '',
  name: '',
  startTime: '06:00',
  endTime: '14:00',
  isActive: true,
};

export function ManagerShiftsPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [form, setForm] = useState<FormState>(empty);

  const refresh = useCallback(() => {
    setLoading(true);
    managerApi.shifts
      .list(buildingId)
      .then((res) => setItems(res.data.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [buildingId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setModalOpen(true);
  };

  const openEdit = (row: Shift) => {
    setEditing(row);
    setForm({
      code: row.code,
      name: row.name,
      startTime: row.startTime,
      endTime: row.endTime,
      isActive: row.isActive,
    });
    setModalOpen(true);
  };

  const onSubmit = async () => {
    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      startTime: form.startTime,
      endTime: form.endTime,
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await managerApi.shifts.update(buildingId, editing._id, payload);
      } else {
        await managerApi.shifts.create(buildingId, payload);
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const onDelete = async (row: Shift) => {
    if (!window.confirm(`Delete shift ${row.code}?`)) return;
    try {
      await managerApi.shifts.remove(buildingId, row._id);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const columns: DataColumn<Shift>[] = [
    { key: 'code', title: 'Code' },
    { key: 'name', title: 'Shift Name' },
    { key: 'startTime', title: 'Start' },
    { key: 'endTime', title: 'End' },
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
          <Plus size={14} /> Add Shift
        </Button>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : (
        <DataTable title="Shifts" rows={items} columns={columns} />
      )}

      <ModalForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Edit Shift' : 'Add Shift'}
        onSubmit={onSubmit}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Code</label>
            <Input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Shift Name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Start</label>
            <TimePicker
              value={form.startTime}
              onChange={(val) => setForm((f) => ({ ...f, startTime: val }))}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">End</label>
            <TimePicker
              value={form.endTime}
              onChange={(val) => setForm((f) => ({ ...f, endTime: val }))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            <span>Active</span>
          </label>
        </div>
      </ModalForm>
    </div>
  );
}
