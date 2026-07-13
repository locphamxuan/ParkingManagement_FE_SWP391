import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { CustomSelect } from '@/components/ui/select';
import type { Floor, ParkingSlot, Zone } from '@/services/manager/managerApi';

export interface SlotBatchForm {
  floor: string;
  zone: string;
  quantity: number;
  status: ParkingSlot['status'];
  reservable: boolean;
  note: string;
}

interface MultiSlotFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: SlotBatchForm) => Promise<void>;
  floors: Floor[];
  zones: Zone[];
  /** Slot hiện có — dùng để preview dải mã sẽ sinh (VD: VL-03 … VL-05). */
  slots?: ParkingSlot[];
  loading?: boolean;
}

const emptyForm = (): SlotBatchForm => ({
  floor: '',
  zone: '',
  quantity: 1,
  status: 'available',
  reservable: true,
  note: '',
});

export function MultiSlotForm({ isOpen, onClose, onSubmit, floors, zones, slots = [] }: MultiSlotFormProps) {
  const [form, setForm] = useState<SlotBatchForm>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const floorZones = zones.filter((z) => {
    const zFloorId = typeof z.floor === 'string' ? z.floor : (z.floor as Floor)._id;
    return zFloorId === form.floor;
  });
  const selectedZone = zones.find((z) => z._id === form.zone);

  // Preview dải mã BE sẽ sinh: đếm số lớn nhất của {zoneCode}-NN trên tầng đã chọn.
  const codePreview = useMemo(() => {
    if (!selectedZone || form.quantity < 1) return null;
    const pattern = new RegExp(`^${selectedZone.code}-(\\d+)$`);
    const maxN = slots
      .filter((s) => (typeof s.floor === 'string' ? s.floor : s.floor?._id) === form.floor)
      .reduce((max, s) => {
        const m = pattern.exec(s.code);
        return m ? Math.max(max, Number(m[1])) : max;
      }, 0);
    const first = `${selectedZone.code}-${String(maxN + 1).padStart(2, '0')}`;
    if (form.quantity === 1) return first;
    const last = `${selectedZone.code}-${String(maxN + form.quantity).padStart(2, '0')}`;
    return `${first} … ${last}`;
  }, [selectedZone, form.floor, form.quantity, slots]);

  const setField = <K extends keyof SlotBatchForm>(field: K, value: SlotBatchForm[K]) => {
    // Đổi tầng thì reset zone để buộc chọn lại zone thuộc tầng mới.
    if (field === 'floor') {
      setForm((f) => ({ ...f, floor: value as string, zone: '' }));
      return;
    }
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.floor) { setError('Select a floor first'); return; }
    if (!form.zone) { setError('Select a zone first'); return; }
    if (!Number.isInteger(form.quantity) || form.quantity < 1 || form.quantity > 50) {
      setError('Quantity must be between 1 and 50');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(form);
      setForm(emptyForm());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setForm(emptyForm());
      setError(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-white/8 bg-slate-800/95 px-6 py-4 flex items-center justify-between backdrop-blur-md">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Add New Slots</h2>
            <p className="text-xs text-slate-400 mt-1">Pick a zone and quantity — slot codes are generated automatically</p>
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
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Tầng */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">Floor *</label>
              <CustomSelect
                value={form.floor}
                onChange={(val) => setField('floor', val)}
                options={[
                  { value: '', label: '-- Select Floor --' },
                  ...floors.map((f) => ({ value: f._id, label: f.name || f.code })),
                ]}
                disabled={submitting || floors.length === 0}
                placeholder="-- Select Floor --"
              />
            </div>

            {/* Dãy (Zone) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">Zone *</label>
              {!form.floor ? (
                <p className="text-xs text-slate-500 rounded border border-white/8 px-3 py-2.5">Select a floor first</p>
              ) : floorZones.length === 0 ? (
                <p className="text-xs text-amber-400 rounded border border-amber-500/20 px-3 py-2.5">This floor has no zones yet</p>
              ) : (
                <CustomSelect
                  value={form.zone}
                  onChange={(val) => setField('zone', val)}
                  options={[
                    { value: '', label: '-- Select Zone --' },
                    ...floorZones.map((z) => ({ value: z._id, label: z.name || z.code })),
                  ]}
                  disabled={submitting}
                  placeholder="-- Select Zone --"
                />
              )}
            </div>

            {/* Số lượng */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">Quantity *</label>
              <Input
                type="number"
                min={1}
                max={50}
                value={String(form.quantity)}
                onChange={(e) => setField('quantity', Number(e.target.value))}
                disabled={submitting}
                className="text-sm"
              />
            </div>

            {/* Trạng Thái */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">Status</label>
              <CustomSelect
                value={form.status}
                onChange={(val) => setField('status', val as ParkingSlot['status'])}
                options={[
                  { value: 'available', label: 'Available' },
                  { value: 'occupied', label: 'Occupied' },
                  { value: 'reserved', label: 'Reserved' },
                  { value: 'maintenance', label: 'Maintenance' },
                ]}
                disabled={submitting}
              />
            </div>

            {/* Cho Đặt Chỗ */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">Reservable</label>
              <CustomSelect
                value={form.reservable ? 'yes' : 'no'}
                onChange={(val) => setField('reservable', val === 'yes')}
                options={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                ]}
                disabled={submitting}
              />
            </div>

            {/* Ghi Chú */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">Note</label>
              <Input
                value={form.note}
                onChange={(e) => setField('note', e.target.value)}
                placeholder="e.g. Near stairs, special spot"
                disabled={submitting}
                className="text-sm"
              />
            </div>
          </div>

          {codePreview && (
            <div className="rounded-lg bg-orange-500/10 border border-orange-500/30 px-4 py-3 text-sm text-orange-200">
              Codes to be generated: <span className="font-bold font-mono">{codePreview}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 border-t border-white/8 bg-slate-800/95 px-6 py-4 flex gap-3 justify-end backdrop-blur-md">
          <Button variant="outline" onClick={handleClose} disabled={submitting} className="text-sm">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus size={16} />
                Create {form.quantity} Slot{form.quantity > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
