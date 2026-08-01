import { motion } from 'framer-motion';
import { CalendarClock } from 'lucide-react';
import { PackageCard } from '@/components/user/PackageCard';
import { packageCategory, categoryColors, isCarPackage } from '@/pages/user/reservationsHelper';
import type { VehicleKind } from '@/pages/user/reservationsHelper';
import type { LongTermPackage } from '@/services/user/userApi';

interface PackageBookingPanelProps {
  disabled: boolean;
  packages: LongTermPackage[];
  isLoading: boolean;
  selectedPkg: LongTermPackage | null;
  onSelectPackage: (pkg: LongTermPackage) => void;
  selectedVehicleType: VehicleKind | '';
}

export function PackageBookingPanel({
  disabled,
  packages,
  isLoading,
  selectedPkg,
  onSelectPackage,
  selectedVehicleType,
}: PackageBookingPanelProps) {
  return (
    <motion.div
      key="package"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`space-y-5 transition-all duration-200 ${disabled ? 'opacity-30' : ''}`}
    >
      {/* Package Cards */}
      <div className="glass-panel-white rounded-3xl p-6 relative">
        {disabled && (
          <div className="absolute inset-0 bg-transparent cursor-not-allowed z-20" title="Please select vehicle type before selecting package." />
        )}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300/70">Select long-term package</span>
        </div>

        {packages.length === 0 ? (
          <p className="text-sm text-slate-500 font-semibold py-4 text-center">
            {isLoading ? 'Loading...' : 'No packages available for this building.'}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => {
              const cat = packageCategory(pkg);
              const colors = categoryColors[cat];
              const isSelected = selectedPkg?._id === pkg._id;
              const isCar = isCarPackage(pkg);
              // isLocked: only when a vehicle type IS selected and this package doesn't match
              const isLocked = !!selectedVehicleType && (selectedVehicleType === 'car' ? !isCar : isCar);
              return (
                <PackageCard
                  key={pkg._id}
                  pkg={pkg}
                  isSelected={isSelected}
                  isLocked={isLocked}
                  cat={cat}
                  colors={colors}
                  onClick={() => {
                    if (isLocked) return;
                    onSelectPackage(pkg);
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Package Date — always starts immediately at purchase time */}
      {selectedPkg && (
        <div className="glass-panel-white rounded-3xl p-6 relative">
          {disabled && (
            <div className="absolute inset-0 bg-transparent cursor-not-allowed z-20" title="Please select vehicle type before purchasing." />
          )}
          <div className="flex items-center gap-2 mb-2">
            <CalendarClock size={16} className="text-purple-300/70" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300/70">Package Start Date</span>
          </div>
          <p className="text-sm font-bold text-slate-200">Starts today, valid for {selectedPkg.durationDays} days.</p>
        </div>
      )}
    </motion.div>
  );
}
