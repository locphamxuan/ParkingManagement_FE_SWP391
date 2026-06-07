import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
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
        const msg = err instanceof Error ? err.message : 'Tải thất bại';
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
      alert(err instanceof Error ? err.message : 'Lưu thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDelete = async (row: StaffShift) => {
    if (!window.confirm(`Xóa assignment cho ${row.staff.fullName}?`)) return;
    try {
      await managerApi.shifts.removeStaffShift(buildingId, row._id);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  };

  const columns: DataColumn<StaffShift>[] = [
    {
      key: 'shift',
      title: 'Ca Trực',
      render: (row) => (
        <div>
          <div className="font-medium">{row.shift.code}</div>
          <div className="text-xs text-muted-foreground">
            {row.shift.startTime}–{row.shift.endTime}
          </div>
        </div>
      ),
    },
    {
      key: 'staff',
      title: 'Nhân Viên',
      render: (row) => (
        <div>
          <div className="font-medium">{row.staff.fullName}</div>
          <div className="text-xs text-muted-foreground">{row.staff.email}</div>
        </div>
      ),
    },
    {
      key: 'workDate',
      title: 'Ngày Làm',
      render: (row) => new Date(row.workDate).toLocaleDateString('vi-VN'),
    },
    {
      key: 'status',
      title: 'Trạng Thái',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'note',
      title: 'Ghi Chú',
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
        <h1 className="text-2xl font-bold">Gán Staff Vào Ca Trực</h1>
        <Button onClick={openCreate} className="gap-2" disabled={loading}>
          <Plus size={16} /> Gán Staff
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin mr-2" size={20} />
          <span className="text-muted-foreground">Đang tải...</span>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground mb-4">Chưa có staff được gán vào ca trực</p>
          <Button onClick={openCreate} className="gap-2">
            <Plus size={16} /> Gán Staff Đầu Tiên
          </Button>
        </div>
      ) : (
        <DataTable title="Danh Sách Gán Ca" rows={items} columns={columns} />
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
