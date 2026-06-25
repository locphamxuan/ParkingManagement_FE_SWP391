import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { CustomSelect } from '@/components/ui/select';
import type { Floor } from '@/services/manager/managerApi';

export interface SlotFormRow {
  id: string;
  code: string;
  floor: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  reservable: boolean;
  note: string;
}

interface MultiSlotFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rows: SlotFormRow[]) => Promise<void>;
  floors: Floor[];
  loading?: boolean;
}

const emptyRow = (): SlotFormRow => ({
  id: Math.random().toString(36),
  code: '',
  floor: '',
  status: 'available',
  reservable: true,
  note: '',
});

export function MultiSlotForm({ isOpen, onClose, onSubmit, floors }: MultiSlotFormProps) {
  const [rows, setRows] = useState<SlotFormRow[]>([emptyRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddRow = () => {
    setRows([...rows, emptyRow()]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((r) => r.id !== id));
    }
  };

  const handleRowChange = (id: string, field: keyof SlotFormRow, value: unknown) => {
    setRows(
      rows.map((r) =>
        r.id === id ? { ...r, [field]: value } : r
      )
    );
  };

  const handleSubmit = async () => {
    // Validation
    for (const row of rows) {
      if (!row.code.trim()) {
        setError('Mã ô không được để trống');
        return;
      }
      if (!row.floor) {
        setError('Phải chọn tầng cho từng ô');
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(rows);
      setRows([emptyRow()]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setRows([emptyRow()]);
      setError(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-white/8 bg-slate-800/95 px-6 py-4 flex items-center justify-between backdrop-blur-md">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Thêm Chỗ Đỗ Mới</h2>
            <p className="text-xs text-slate-400 mt-1">Tạo một hoặc nhiều chỗ đỗ cùng một lúc</p>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Slots List */}
          <div className="space-y-3 max-h-[calc(90vh-300px)] overflow-y-auto">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className="rounded-xl border border-white/10 bg-slate-800/40 p-4 space-y-3 hover:border-white/20 transition-colors"
              >
                {/* Slot Number */}
                <div className="flex items-center justify-between">
                  <span className="inline-block bg-orange-500/10 border border-orange-500/30 text-orange-300 px-2.5 py-1 rounded-lg text-xs font-bold">
                    Chỗ đỗ #{index + 1}
                  </span>
                  {rows.length > 1 && (
                    <button
                      onClick={() => handleRemoveRow(row.id)}
                      disabled={submitting}
                      className="text-slate-400 hover:text-rose-400 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                {/* Row Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Mã Ô */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">Mã Ô *</label>
                    <Input
                      value={row.code}
                      onChange={(e) => handleRowChange(row.id, 'code', e.target.value.toUpperCase())}
                      placeholder="VD: A01, B12"
                      disabled={submitting}
                      className="text-sm"
                    />
                  </div>

                  {/* Tầng */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">Tầng *</label>
                    <CustomSelect
                      value={row.floor}
                      onChange={(val) => handleRowChange(row.id, 'floor', val)}
                      options={[
                        { value: '', label: '-- Chọn tầng --' },
                        ...floors.map((f) => ({
                          value: f._id,
                          label: f.code,
                        })),
                      ]}
                      disabled={submitting || floors.length === 0}
                      placeholder="-- Chọn tầng --"
                    />
                  </div>

                  {/* Trạng Thái */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">Trạng Thái</label>
                    <CustomSelect
                      value={row.status}
                      onChange={(val) => handleRowChange(row.id, 'status', val)}
                      options={[
                        { value: 'available', label: 'Trống' },
                        { value: 'occupied', label: 'Đầy' },
                        { value: 'reserved', label: 'Đặt chỗ' },
                        { value: 'maintenance', label: 'Bảo trì' },
                      ]}
                      disabled={submitting}
                    />
                  </div>

                  {/* Cho Đặt Chỗ */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">Cho Đặt Chỗ</label>
                    <CustomSelect
                      value={row.reservable ? 'yes' : 'no'}
                      onChange={(val) => handleRowChange(row.id, 'reservable', val === 'yes')}
                      options={[
                        { value: 'yes', label: 'Có' },
                        { value: 'no', label: 'Không' },
                      ]}
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* Ghi Chú */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">Ghi Chú</label>
                  <Input
                    value={row.note}
                    onChange={(e) => handleRowChange(row.id, 'note', e.target.value)}
                    placeholder="VD: Gần cầu thang, Vị trí đặc biệt"
                    disabled={submitting}
                    className="text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add More Button */}
          <button
            onClick={handleAddRow}
            disabled={submitting}
            className="w-full rounded-xl border-2 border-dashed border-orange-500/30 hover:border-orange-500/60 py-3 text-orange-300 hover:text-orange-200 font-semibold text-sm uppercase tracking-wide transition-colors disabled:opacity-50 flex items-center justify-center gap-2 group"
          >
            <Plus size={18} className="group-hover:scale-110 transition-transform" />
            Thêm chỗ đỗ khác
          </button>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 border-t border-white/8 bg-slate-800/95 px-6 py-4 flex gap-3 justify-end backdrop-blur-md">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={submitting}
            className="text-sm"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || rows.length === 0}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Plus size={16} />
                Tạo {rows.length} chỗ đỗ
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
