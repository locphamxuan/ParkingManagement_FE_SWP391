import { useEffect, useMemo, useState } from 'react';
import { Plus, Zap, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { CustomSelect } from '@/components/ui/select';
import { type Floor, type ParkingSlot, type Zone } from '@/services/manager/managerApi';

const ZONE_USAGE_LABELS: Record<string, string> = {
  account: 'Dãy khách account',
  package: 'Dãy khách đăng ký package',
  transient: 'Dãy cho khách vãng lai',
};

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
  defaultFloor?: string;
  defaultQuantity?: number;
}

const MAX_BATCH = 50;
const QUANTITY_PRESETS = [5, 10, 15, 20, 30];

const zoneFloorId = (z: Zone) => (typeof z.floor === 'string' ? z.floor : z.floor._id);

export function MultiSlotForm({
  isOpen,
  onClose,
  onSubmit,
  floors,
  zones,
  defaultFloor = '',
  defaultQuantity = 5,
}: MultiSlotFormProps) {
  const [floor, setFloor] = useState('');
  const [zone, setZone] = useState('');
  const [quantity, setQuantity] = useState('5');
  const [status, setStatus] = useState<ParkingSlot['status']>('available');
  const [reservable, setReservable] = useState(true);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-initialize defaults when modal opens
  useEffect(() => {
    if (isOpen) {
      const activeFloor = defaultFloor && floors.some(f => f._id === defaultFloor)
        ? defaultFloor
        : (floors[0]?._id || '');
      setFloor(activeFloor);
      setQuantity(defaultQuantity ? String(defaultQuantity) : '5');
      setStatus('available');
      setReservable(true);
      setNote('');
      setError(null);
    }
  }, [isOpen, defaultFloor, defaultQuantity, floors]);

  const floorZones = useMemo(
    () => zones.filter((z) => zoneFloorId(z) === floor),
    [zones, floor]
  );

  // Auto-select first available non-full zone when floor changes
  useEffect(() => {
    if (floorZones.length > 0) {
      const firstAvailableZone = floorZones.find(
        (z) => (z.capacity ?? 0) === 0 || (z.slotCount ?? 0) < (z.capacity ?? 0)
      ) || floorZones[0];
      setZone(firstAvailableZone?._id || '');
    } else {
      setZone('');
    }
  }, [floor, floorZones]);

  const selectedZone = floorZones.find((z) => z._id === zone);
  const zoneRemaining = selectedZone
    ? Math.max(0, (selectedZone.capacity ?? 0) - (selectedZone.slotCount ?? 0))
    : null;

  // Code generation preview
  const codePreview = useMemo(() => {
    if (!selectedZone) return null;
    const qty = Math.min(Math.max(Number(quantity) || 1, 1), MAX_BATCH);
    const startIdx = (selectedZone.slotCount || 0) + 1;
    const endIdx = startIdx + qty - 1;
    const prefix = selectedZone.code || 'SLOT';
    const fmt = (n: number) => String(n).padStart(2, '0');
    return qty === 1
      ? `${prefix}-${fmt(startIdx)}`
      : `${prefix}-${fmt(startIdx)} ➔ ${prefix}-${fmt(endIdx)}`;
  }, [selectedZone, quantity]);

  const reset = () => {
    setFloor('');
    setZone('');
    setQuantity('5');
    setStatus('available');
    setReservable(true);
    setNote('');
    setError(null);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    const qty = Number(quantity);
    if (!floor) return setError('Please select a floor');
    if (!zone) return setError('Please select a zone');
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_BATCH) {
      return setError(`Quantity must be an integer between 1 and ${MAX_BATCH}`);
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ floor, zone, quantity: qty, status, reservable, note: note.trim() });
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Add new slots in batch (Quick Batch Creator)"
      open={isOpen}
      onOpenChange={handleClose}
    >
      <div className="flex flex-col gap-4 max-h-[78vh] text-slate-800">
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-1.5 custom-scrollbar space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs font-bold text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-650 uppercase tracking-wide">Floor *</label>
              <CustomSelect
                value={floor}
                onChange={(val) => setFloor(val)}
                options={[
                  { value: '', label: '-- Select floor --' },
                  ...floors.map((f) => ({ value: f._id, label: f.name ? `${f.code} — ${f.name}` : f.code })),
                ]}
                disabled={submitting || floors.length === 0}
                placeholder="-- Select floor --"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-650 uppercase tracking-wide">Zone *</label>
              <CustomSelect
                value={zone}
                onChange={setZone}
                options={[
                  { value: '', label: '-- Select zone --' },
                  ...floorZones.map((z) => {
                    const used = z.slotCount ?? 0;
                    const cap = z.capacity ?? 0;
                    const full = cap > 0 && used >= cap;
                    return {
                      value: z._id,
                      label: `${z.code} · ${ZONE_USAGE_LABELS[z.usageType]} · ${used}/${cap}${full ? ' (full)' : ''}`,
                    };
                  }),
                ]}
                disabled={submitting || !floor}
                placeholder="-- Select zone --"
              />
            </div>
          </div>

          {/* Quick Quantity Presets */}
          <div className="flex flex-col gap-1.5 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/70">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Zap size={13} className="text-amber-500 fill-amber-500" />
                Quantity to create *
              </label>
              <span className="text-[11px] font-mono font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                {Number(quantity) || 0} slot(s)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1 sm:grid-cols-6">
              <Input
                type="number"
                min={1}
                max={MAX_BATCH}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={submitting}
                className="h-9 rounded-xl font-bold font-mono text-center col-span-1 sm:col-span-1"
              />
              <div className="col-span-1 sm:col-span-5 flex items-center gap-1.5 flex-wrap">
                {QUANTITY_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQuantity(String(preset))}
                    disabled={submitting}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black font-mono transition-all duration-150 cursor-pointer ${
                      Number(quantity) === preset
                        ? 'bg-orange-500 text-slate-950 shadow-sm shadow-orange-500/30 border border-orange-500'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200'
                    }`}
                  >
                    +{preset}
                  </button>
                ))}
                {zoneRemaining != null && zoneRemaining > 0 && (
                  <button
                    type="button"
                    onClick={() => setQuantity(String(Math.min(zoneRemaining, MAX_BATCH)))}
                    disabled={submitting}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-all cursor-pointer"
                  >
                    Fill ({zoneRemaining})
                  </button>
                )}
              </div>
            </div>

            {zoneRemaining != null && (
              <p className="text-[10px] font-bold text-slate-500 mt-1">
                Zone {selectedZone?.code}: {zoneRemaining} slot(s) remaining in capacity.
              </p>
            )}
          </div>

          {/* Code Preview Badge */}
          {codePreview && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-emerald-800">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              <span>
                Auto-generated Codes: <strong className="font-mono text-emerald-950 font-black">{codePreview}</strong>
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-650 uppercase tracking-wide">Status</label>
              <CustomSelect
                value={status ?? 'available'}
                onChange={(val) => setStatus(val as ParkingSlot['status'])}
                options={[
                  { value: 'available', label: 'Available (Green)' },
                  { value: 'maintenance', label: 'Maintenance (Amber)' },
                ]}
                disabled={submitting}
              />
            </div>

            <div className="flex flex-col gap-1.5 justify-center pt-5">
              <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={reservable}
                  onChange={(e) => setReservable(e.target.checked)}
                  disabled={submitting}
                  className="w-4 h-4 rounded border-slate-200 text-orange-500 focus:ring-orange-500/20 cursor-pointer"
                />
                <span>Let users pick this slot for packages</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-650 uppercase tracking-wide">Note</label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Near stairs, VIP area"
              disabled={submitting}
              className="h-10 rounded-xl"
            />
          </div>
        </div>

        {/* Footer Area */}
        <div className="flex justify-end gap-2.5 border-t border-border pt-3.5 mt-1 shrink-0">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-xl px-5 py-2 font-bold text-xs transition-all duration-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !floor || !zone}
            className="rounded-xl px-6 py-2 font-bold text-xs bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black hover:brightness-110 shadow-md shadow-orange-500/20 transition-all duration-200 hover:scale-[1.01]"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-950/30 border-t-slate-950 animate-spin mr-1.5" />
                Creating {Number(quantity) || 0} slots...
              </>
            ) : (
              <>
                <Plus size={14} className="mr-1.5 stroke-[3]" />
                Create {Number(quantity) || 0} Slot(s) Now
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
