import { useEffect, useState } from 'react';
import { X, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { managerApi, type StaffShift, type Gate } from '@/services/manager/managerApi';

interface AssignStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    staff: string;
    shift: string;
    workDate: string;
    gate?: string | null;
    note?: string;
  }) => Promise<void>;
  buildingId: string;
  editingData?: StaffShift | null;
  isSubmitting?: boolean;
}

const directionLabel: Record<Gate['direction'], string> = {
  in: 'Cổng vào',
  out: 'Cổng ra',
  both: 'Hai chiều',
};

interface Staff {
  _id: string;
  fullName: string;
  email: string;
  role: string;
}

interface Shift {
  _id: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
}

export function AssignStaffModal({
  isOpen,
  onClose,
  onSubmit,
  buildingId,
  editingData,
  isSubmitting = false,
}: AssignStaffModalProps) {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [shiftList, setShiftList] = useState<Shift[]>([]);
  const [gateList, setGateList] = useState<Gate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [selectedGate, setSelectedGate] = useState('');
  const [workDate, setWorkDate] = useState('');
  const [note, setNote] = useState('');

  // Load staff, shifts and gates on mount
  useEffect(() => {
    if (!isOpen || !buildingId) return;

    setLoading(true);
    setError(null);

    Promise.all([
      managerApi.shifts.listStaff(buildingId),
      managerApi.shifts.list(buildingId),
      managerApi.gates.list(buildingId),
    ])
      .then(([staffRes, shiftsRes, gatesRes]) => {
        setStaffList(staffRes.data.items);
        setShiftList(shiftsRes.data.items);
        setGateList(gatesRes.data.items);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Tải dữ liệu thất bại');
      })
      .finally(() => setLoading(false));
  }, [isOpen, buildingId]);

  // Populate form when editing
  useEffect(() => {
    if (editingData) {
      setSelectedStaff(editingData.staff._id);
      setSelectedShift(editingData.shift._id);
      setSelectedGate(editingData.gate?._id ?? '');
      setWorkDate(editingData.workDate);
      setNote(editingData.note || '');
    } else {
      // Reset form for creating new
      setSelectedStaff('');
      setSelectedShift('');
      setSelectedGate('');
      setWorkDate('');
      setNote('');
    }
  }, [editingData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!selectedStaff) {
      setError('Vui lòng chọn nhân viên');
      return;
    }
    if (!selectedShift) {
      setError('Vui lòng chọn ca trực');
      return;
    }
    if (!workDate) {
      setError('Vui lòng chọn ngày làm việc');
      return;
    }

    try {
      await onSubmit({
        staff: selectedStaff,
        shift: selectedShift,
        workDate,
        gate: selectedGate || null,
        note: note.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi lưu');
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {editingData ? 'Sửa Gán Ca' : 'Gán Staff Vào Ca'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="animate-spin mr-2" size={20} />
            <span className="text-sm text-muted-foreground">Đang tải dữ liệu...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4">
            {/* Staff Selection */}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">
                Nhân Viên <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="">-- Chọn nhân viên --</option>
                {staffList.map((staff) => (
                  <option key={staff._id} value={staff._id}>
                    {staff.fullName} ({staff.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Shift Selection */}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">
                Ca Trực <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="">-- Chọn ca --</option>
                {shiftList.map((shift) => (
                  <option key={shift._id} value={shift._id}>
                    {shift.code} — {shift.name} ({shift.startTime}–{shift.endTime})
                  </option>
                ))}
              </select>
            </div>

            {/* Gate Selection */}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">
                Cổng phụ trách
              </label>
              <select
                value={selectedGate}
                onChange={(e) => setSelectedGate(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="">-- Không phân công cổng --</option>
                {gateList.map((gate) => (
                  <option key={gate._id} value={gate._id}>
                    {gate.code}{gate.name ? ` — ${gate.name}` : ''} ({directionLabel[gate.direction]})
                  </option>
                ))}
              </select>
            </div>

            {/* Work Date */}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">
                Ngày Làm Việc <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Note */}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">
                Ghi Chú (Tùy Chọn)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={isSubmitting}
                placeholder="VD: On duty, special notes..."
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm resize-none"
                rows={3}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 gap-2"
              >
                {isSubmitting && <Loader size={16} className="animate-spin" />}
                {isSubmitting
                  ? 'Đang lưu...'
                  : editingData
                    ? 'Cập Nhật'
                    : 'Gán Staff'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
