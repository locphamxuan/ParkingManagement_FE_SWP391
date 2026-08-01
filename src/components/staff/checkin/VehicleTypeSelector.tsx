import { AlertCircle, Bike, Car } from 'lucide-react';

export type VehicleKind = 'car' | 'motorcycle';

interface VehicleTypeSelectorProps {
  vehicleType: VehicleKind;
  onChange: (type: VehicleKind) => void;
  allowedTypes: string[];
  plateTypeWarning: string | null;
  buildingSupportWarning: string | null;
  /** Registered type differs from what's selected — shown only when the plate lookup found a mismatch. */
  mismatch?: boolean;
  registeredVehicleKind?: VehicleKind | null;
  /** When provided, the mismatch banner also offers a quick Reject action (used in the Confirm step). */
  onRejectMismatch?: () => void;
}

export function VehicleTypeSelector({
  vehicleType,
  onChange,
  allowedTypes,
  plateTypeWarning,
  buildingSupportWarning,
  mismatch,
  registeredVehicleKind,
  onRejectMismatch,
}: VehicleTypeSelectorProps) {
  return (
    <div className="grid gap-1.5">
      <span id="vehicle-type-label" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Vehicle Type</span>
      <div role="group" aria-labelledby="vehicle-type-label" className="flex gap-2 p-1 rounded-lg bg-muted border border-border">
        <button
          type="button"
          disabled={!allowedTypes.includes('CAR')}
          onClick={() => onChange('car')}
          className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-bold transition-all ${vehicleType === 'car' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground disabled:opacity-30'}`}
        >
          <Car size={13} /> Car
        </button>
        <button
          type="button"
          disabled={!allowedTypes.includes('MOTORCYCLE')}
          onClick={() => onChange('motorcycle')}
          className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-bold transition-all ${vehicleType === 'motorcycle' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground disabled:opacity-30'}`}
        >
          <Bike size={13} /> Motorcycle
        </button>
      </div>
      {plateTypeWarning && <p className="text-[11px] text-amber-400 flex items-center gap-1"><AlertCircle size={11} /> {plateTypeWarning}</p>}
      {buildingSupportWarning && <p className="text-[11px] text-rose-400 flex items-center gap-1"><AlertCircle size={11} /> {buildingSupportWarning}</p>}
      {mismatch && (
        onRejectMismatch ? (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-[11px] text-rose-300 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1">
              <AlertCircle size={12} /> Vehicle type does not match the registration (registered: <strong>{registeredVehicleKind === 'car' ? 'Car' : 'Motorcycle'}</strong>).
            </span>
            <button type="button" onClick={onRejectMismatch} className="shrink-0 rounded-md bg-rose-500 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-rose-400">
              Reject
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-rose-300 flex items-center gap-1">
            <AlertCircle size={12} /> Vehicle type does not match the registration (registered: <strong>{registeredVehicleKind === 'car' ? 'Car' : 'Motorcycle'}</strong>).
          </p>
        )
      )}
    </div>
  );
}
