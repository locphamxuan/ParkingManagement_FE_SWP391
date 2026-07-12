import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { CustomSelect } from '@/components/ui/select';
import type { Floor, Zone } from '@/services/manager/managerApi';

export interface SlotFormRow {
  id: string;
  code: string;
  floor: string;
  zone: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  reservable: boolean;
  note: string;
}

interface MultiSlotFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rows: SlotFormRow[]) => Promise<void>;
  floors: Floor[];
  zones: Zone[];
  loading?: boolean;
}

const emptyRow = (): SlotFormRow => ({
  id: Math.random().toString(36),
  code: '',
  floor: '',
  zone: '',
  status: 'available',
  reservable: true,
  note: '',
});

export function MultiSlotForm({ isOpen, onClose, onSubmit, floors, zones }: MultiSlotFormProps) {
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
      rows.map((r) => {
        if (r.id !== id) return r;
        // When floor changes, reset zone so the user picks a valid one.
        if (field === 'floor') return { ...r, floor: value as string, zone: '' };
        return { ...r, [field]: value };
      })
    );
  };

  const zonesForRow = (floorId: string) =>
    zones.filter((z) => {
      const zFloorId = typeof z.floor === 'string' ? z.floor : (z.floor as Floor)._id;
      return zFloorId === floorId;
    });

  const handleSubmit = async () => {
    for (const row of rows) {
      if (!row.code.trim()) { setError('Slot code cannot be empty'); return; }
      if (!row.floor) { setError('A floor must be selected for each slot'); return; }
      if (!row.zone) { setError('A zone must be selected for each slot'); return; }
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(rows);
      setRows([emptyRow()]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
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
            <h2 className="text-lg font-bold text-slate-100">Add New Slots</h2>
            <p className="text-xs text-slate-400 mt-1">Create one or more parking slots at once</p>
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

          <div className="space-y-3 max-h-[calc(90vh-300px)] overflow-y-auto">
            {rows.map((row, index) => {
              const floorZones = zonesForRow(row.floor);
              return (
                <div
                  key={row.id}
                  className="rounded-xl border border-white/10 bg-slate-800/40 p-4 space-y-3 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-block bg-orange-500/10 border border-orange-500/30 text-orange-300 px-2.5 py-1 rounded-lg text-xs font-bold">
                      Slot #{index + 1}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Mã Ô */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">Slot Code *</label>
                      <Input
                        value={row.code}
                        onChange={(e) => handleRowChange(row.id, 'code', e.target.value.toUpperCase())}
                        placeholder="e.g. A01, B12"
                        disabled={submitting}
                        className="text-sm"
                      />
                    </div>

                    {/* Tầng */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">Floor *</label>
                      <CustomSelect
                        value={row.floor}
                        onChange={(val) => handleRowChange(row.id, 'floor', val)}
                        options={[
                          { value: '', label: '-- Select Floor --' },
                          ...floors.map((f) => ({ value: f._id, label: f.code })),
                        ]}
                        disabled={submitting || floors.length === 0}
                        placeholder="-- Select Floor --"
                      />
                    </div>

                    {/* Dãy (Zone) */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">Zone *</label>
                      {!row.floor ? (
                        <p className="text-xs text-slate-500 rounded border border-white/8 px-3 py-2.5">Select a floor first</p>
                      ) : floorZones.length === 0 ? (
                        <p className="text-xs text-amber-400 rounded border border-amber-500/20 px-3 py-2.5">This floor has no zones yet</p>
                      ) : (
                        <CustomSelect
                          value={row.zone}
                          onChange={(val) => handleRowChange(row.id, 'zone', val)}
                          options={[
                            { value: '', label: '-- Select Zone --' },
                            ...floorZones.map((z) => ({ value: z._id, label: z.code })),
                          ]}
                          disabled={submitting}
                          placeholder="-- Select Zone --"
                        />
                      )}
                    </div>

                    {/* Trạng Thái */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">Status</label>
                      <CustomSelect
                        value={row.status}
                        onChange={(val) => handleRowChange(row.id, 'status', val)}
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
                        value={row.reservable ? 'yes' : 'no'}
                        onChange={(val) => handleRowChange(row.id, 'reservable', val === 'yes')}
                        options={[
                          { value: 'yes', label: 'Yes' },
                          { value: 'no', label: 'No' },
                        ]}
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  {/* Ghi Chú */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">Note</label>
                    <Input
                      value={row.note}
                      onChange={(e) => handleRowChange(row.id, 'note', e.target.value)}
                      placeholder="e.g. Near stairs, special spot"
                      disabled={submitting}
                      className="text-sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleAddRow}
            disabled={submitting}
            className="w-full rounded-xl border-2 border-dashed border-orange-500/30 hover:border-orange-500/60 py-3 text-orange-300 hover:text-orange-200 font-semibold text-sm uppercase tracking-wide transition-colors disabled:opacity-50 flex items-center justify-center gap-2 group"
          >
            <Plus size={18} className="group-hover:scale-110 transition-transform" />
            Add Another Slot
          </button>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 border-t border-white/8 bg-slate-800/95 px-6 py-4 flex gap-3 justify-end backdrop-blur-md">
          <Button variant="outline" onClick={handleClose} disabled={submitting} className="text-sm">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || rows.length === 0}
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
                Create {rows.length} Slot{rows.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
