import { Building2, Zap } from 'lucide-react';
import { CustomSelect } from '@/components/ui/select';
import type { Building } from '@/services/user/userApi';
import type { VehicleKind } from '@/pages/user/packagePurchaseHelper';

interface PlateOption {
  plateNumber: string;
  vehicleType?: string;
}

interface BasicInfoPanelProps {
  rows: Array<{ building: Building }>;
  selectedBuildingId: string;
  onBuildingChange: (id: string) => void;
  selectedVehicleType: VehicleKind | '';
  onVehicleTypeChange: (val: VehicleKind | '') => void;
  selectedPlate: string;
  onPlateChange: (val: string) => void;
  plateOptions: PlateOption[];
}

export function BasicInfoPanel({
  rows,
  selectedBuildingId,
  onBuildingChange,
  selectedVehicleType,
  onVehicleTypeChange,
  selectedPlate,
  onPlateChange,
  plateOptions,
}: BasicInfoPanelProps) {
  return (
    <div className="glass-panel-white rounded-3xl p-6 relative z-30">
      <div className="flex items-center gap-2 mb-4">
        <Building2 size={16} className="text-cyan-400" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">Basic Information</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 relative z-20">
        <div>
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Building</span>
          <CustomSelect
            value={selectedBuildingId}
            onChange={onBuildingChange}
            options={[
              { value: '', label: '-- Select building --' },
              ...rows.map((r) => ({ value: r.building._id, label: r.building.name })),
            ]}
            placeholder="-- Select building --"
          />
        </div>
        <div>
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Vehicle Type</span>
          <CustomSelect
            value={selectedVehicleType}
            onChange={(val) => onVehicleTypeChange(val as VehicleKind | '')}
            options={[
              { value: '', label: '-- Select vehicle type --' },
              { value: 'car', label: '🚗 Car' },
              { value: 'motorcycle', label: '🏍️ Motorcycle' },
            ]}
            placeholder="-- Select vehicle type --"
          />
        </div>
      </div>

      {/* Plate selection right below vehicle type */}
      <div className={`mt-4 relative z-10 transition-all duration-200 ${!selectedVehicleType ? 'opacity-40' : ''}`}>
        {!selectedVehicleType && (
          <div className="absolute inset-0 bg-transparent cursor-not-allowed z-20" title="Please select vehicle type before selecting plate." />
        )}
        <div className="flex items-center gap-2 mb-2">
          <Zap size={14} className="text-amber-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">License Plate</span>
        </div>
        <CustomSelect
          value={selectedPlate}
          onChange={onPlateChange}
          disabled={!selectedVehicleType || plateOptions.length === 0}
          options={[
            { value: '', label: !selectedVehicleType ? '-- Please select vehicle type first --' : (plateOptions.length === 0 ? '-- All matching plates already reserved --' : '-- Select plate --') },
            ...plateOptions.map((p) => ({
              value: p.plateNumber,
              label: `${p.plateNumber} — ${p.vehicleType === 'motorcycle' ? '🏍️ Motorcycle' : '🚗 Car'}`,
            })),
          ]}
          placeholder="-- Select plate --"
        />
      </div>
    </div>
  );
}
