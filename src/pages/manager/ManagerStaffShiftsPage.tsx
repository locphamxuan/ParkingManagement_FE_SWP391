import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type StaffShift } from '@/services/manager/managerApi';
import { AssignStaffModal } from '@/components/manager/AssignStaffModal';

export function ManagerStaffShiftsPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<StaffShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffShift | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refresh = useCallback(() => {
    if (!buildingId) return;
    
    setLoading(true);
    setError(null);
    
    managerApi.shifts
      .listStaffShifts(buildingId)
      .then((res) => setItems(res.data.items))
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Failed to load';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [buildingId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row: StaffShift) => {
    setEditing(row);
    setModalOpen(true);
  };

  const onSubmit = async (data: {
    staff: string;
    shift: string;
    workDate: string;
    gate?: string | null;
    note?: string;
  }) => {
    setIsSubmitting(true);
    try {
      if (editing) {
        await managerApi.shifts.updateStaffShift(buildingId, editing._id, {
          ...data,
        });
      } else {
        await managerApi.shifts.assignStaffShift(buildingId, data);
      }
      setModalOpen(false);
      setEditing(null);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDelete = async (row: StaffShift) => {
    if (!window.confirm(`Delete assignment for ${row.staff?.fullName ?? 'staff member'}?`)) return;
    try {
      await managerApi.shifts.removeStaffShift(buildingId, row._id);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const columns: DataColumn<StaffShift>[] = [
    {
      key: 'shift',
      title: 'Shift',
      render: (row) => (
        <div>
          <div className="font-medium">{row.shift?.code ?? '—'}</div>
          <div className="text-xs text-muted-foreground">
            {row.shift ? `${row.shift.startTime}–${row.shift.endTime}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'staff',
      title: 'Staff',
      render: (row) =>
        row.staff ? (
          <div>
            <div className="font-medium">{row.staff.fullName}</div>
            <div className="text-xs text-muted-foreground">{row.staff.email}</div>
          </div>
        ) : (
          <span className="text-xs italic text-muted-foreground">Staff member removed</span>
        ),
    },
    {
      key: 'gate',
      title: 'Gate',
      render: (row) =>
        row.gate ? (
          <div>
            <div className="font-medium">{row.gate.code}</div>
            <div className="text-xs text-muted-foreground">
              {row.gate.direction === 'in' ? 'Entry Gate' : row.gate.direction === 'out' ? 'Exit Gate' : 'Bidirectional'}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'workDate',
      title: 'Work Date',
      render: (row) => new Date(row.workDate).toLocaleDateString('vi-VN'),
    },
    {
      key: 'status',
      title: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'note',
      title: 'Note',
      render: (row) => row.note ? <span className="text-sm">{row.note}</span> : <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'actions',
      title: '',
      render: (row) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openEdit(row)}
            disabled={isSubmitting}
          >
            <Pencil size={14} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(row)}
            disabled={isSubmitting}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Assign Staff to Shift</h1>
        <Button onClick={openCreate} className="gap-2" disabled={loading}>
          <Plus size={16} /> Assign Staff
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin mr-2" size={20} />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground mb-4">No staff have been assigned to a shift yet</p>
          <Button onClick={openCreate} className="gap-2">
            <Plus size={16} /> Assign First Staff
          </Button>
        </div>
      ) : (
        <DataTable title="Shift Assignments" rows={items} columns={columns} />
      )}

      <AssignStaffModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={onSubmit}
        buildingId={buildingId}
        editingData={editing}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
