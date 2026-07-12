import { useCallback, useEffect, useState } from 'react';
import { ArrowRightLeft, LogIn, LogOut, Plus, Pencil, Trash2, X, Loader } from 'lucide-react';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { CustomSelect } from '@/components/ui/select';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type Gate } from '@/services/manager/managerApi';

const directionLabel: Record<Gate['direction'], string> = {
  in: 'Entry Gate',
  out: 'Exit Gate',
  both: 'Two-way',
};

const directionIcon: Record<Gate['direction'], React.ReactNode> = {
  in: <LogIn size={14} className="text-emerald-400" />,
  out: <LogOut size={14} className="text-rose-400" />,
  both: <ArrowRightLeft size={14} className="text-blue-400" />,
};

const GATE_STATUSES: Gate['status'][] = ['active', 'inactive', 'maintenance'];
const statusLabel: Record<Gate['status'], string> = {
  active: 'Active',
  inactive: 'Inactive',
  maintenance: 'Maintenance',
};

interface GateForm {
  code: string;
  name: string;
  direction: Gate['direction'];
  status: Gate['status'];
}

const emptyForm: GateForm = { code: '', name: '', direction: 'in', status: 'active' };

export function ManagerGatesPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<Gate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Gate | null>(null);
  const [form, setForm] = useState<GateForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const gates = await managerApi.gates.list(buildingId);
      setItems(gates.data.items);
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
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (row: Gate) => {
    setEditing(row);
    setForm({ code: row.code, name: row.name || '', direction: row.direction, status: row.status });
    setFormError(null);
    setModalOpen(true);
  };

  const onStatusChange = async (row: Gate, status: Gate['status']) => {
    setSavingId(row._id);
    setItems((prev) => prev.map((g) => (g._id === row._id ? { ...g, status } : g)));
    try {
      await managerApi.gates.updateStatus(buildingId, row._id, status);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
      refresh();
    } finally {
      setSavingId(null);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.code.trim()) {
      setFormError('Please enter a gate code');
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        direction: form.direction,
        status: form.status,
      };
      if (editing) {
        await managerApi.gates.update(buildingId, editing._id, body);
      } else {
        await managerApi.gates.create(buildingId, body);
      }
      setModalOpen(false);
      setEditing(null);
      refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (row: Gate) => {
    if (!window.confirm(`Delete gate ${row.code}?`)) return;
    try {
      await managerApi.gates.remove(buildingId, row._id);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const columns: DataColumn<Gate>[] = [
    { key: 'code', title: 'Code' },
    { key: 'name', title: 'Name', render: (row) => row.name || '—' },
    {
      key: 'direction',
      title: 'Gate Type',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-sm">
          {directionIcon[row.direction]} {directionLabel[row.direction]}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (row) => (
        <CustomSelect
          value={row.status}
          disabled={savingId === row._id}
          onChange={(val) => onStatusChange(row, val as Gate['status'])}
          options={GATE_STATUSES.map((s) => ({
            value: s,
            label: statusLabel[s],
          }))}
          className="h-8 w-28 text-xs font-semibold"
        />
      ),
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Entry / Exit Gates</h1>
          <p className="text-sm text-muted-foreground">Create gates and select a type: entry, exit, or two-way.</p>
        </div>
        <Button onClick={openCreate} className="gap-2" disabled={loading}>
          <Plus size={16} /> Add Gate
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No gates yet. Click "Add Gate" to create one.
        </div>
      ) : (
        <DataTable title="Entry / Exit Gates" rows={items} columns={columns} />
      )}

      <Modal isOpen={modalOpen} onClose={() => !submitting && setModalOpen(false)}>
        <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">{editing ? 'Edit Gate' : 'Add Gate'}</h2>
            <button onClick={() => !submitting && setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Gate Code <span className="text-red-500">*</span></label>
              <Input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="e.g. IN, OUT, G1"
                disabled={submitting}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Gate Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Main Entrance"
                disabled={submitting}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Gate Type <span className="text-red-500">*</span></label>
              <CustomSelect
                value={form.direction}
                onChange={(val) => setForm((f) => ({ ...f, direction: val as Gate['direction'] }))}
                options={[
                  { value: 'in', label: 'Entry Gate' },
                  { value: 'out', label: 'Exit Gate' },
                  { value: 'both', label: 'Two-way' },
                ]}
                disabled={submitting}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Status</label>
              <CustomSelect
                value={form.status}
                onChange={(val) => setForm((f) => ({ ...f, status: val as Gate['status'] }))}
                options={GATE_STATUSES.map((s) => ({
                  value: s,
                  label: statusLabel[s],
                }))}
                disabled={submitting}
              />
            </div>

            {formError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">{formError}</div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={submitting} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1 gap-2">
                {submitting && <Loader size={16} className="animate-spin" />}
                {submitting ? 'Saving...' : editing ? 'Update' : 'Add Gate'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
