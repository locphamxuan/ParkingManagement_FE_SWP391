import { AlertCircle, ArrowLeft, Car, Image as ImageIcon, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { normalizePlate } from '@/utils/plate';
import { VehicleTypeSelector } from '@/components/staff/checkin/VehicleTypeSelector';
import { SlotSelector } from '@/components/staff/checkin/SlotSelector';
import type { CheckInWorkflow } from '@/hooks/staff/useCheckInWorkflow';

type ConfirmCheckInStepProps = Pick<
  CheckInWorkflow,
  | 'checkInKind' | 'plateAccountInfo' | 'plateImage' | 'portraitImage' | 'plateNumber' | 'setPlateNumber'
  | 'vehicleBrand' | 'vehicleType' | 'setVehicleType' | 'allowedTypes' | 'plateTypeWarning' | 'buildingSupportWarning'
  | 'vehicleTypeMismatch' | 'needsSlotSelection' | 'hasActivePackage' | 'freeSlots' | 'selectedSlotId' | 'setSelectedSlotId'
  | 'setStep' | 'onCheckIn' | 'loading' | 'setRejectOpen'
>;

// Bước 3 — xem lại ảnh + thông tin, chọn slot (nếu cần), rồi xác nhận check-in.
export function ConfirmCheckInStep({
  checkInKind, plateAccountInfo, plateImage, portraitImage, plateNumber, setPlateNumber,
  vehicleBrand, vehicleType, setVehicleType, allowedTypes, plateTypeWarning, buildingSupportWarning,
  vehicleTypeMismatch, needsSlotSelection, hasActivePackage, freeSlots, selectedSlotId, setSelectedSlotId,
  setStep, onCheckIn, loading, setRejectOpen,
}: ConfirmCheckInStepProps) {
  const disableCheckIn =
    !plateNumber.trim() ||
    loading ||
    !!buildingSupportWarning ||
    !portraitImage ||
    // Gói có slot cố định (needsSlotSelection=false) → BE tự gán, không bắt chọn slot.
    (hasActivePackage && needsSlotSelection && !selectedSlotId) ||
    (checkInKind === 'standard' && !plateImage) ||
    (checkInKind === 'standard' && freeSlots.length > 0 && !selectedSlotId);

  return (
    <div className="space-y-5">
      {/* Banner loại check-in đã nhận diện */}
      {checkInKind === 'package' && plateAccountInfo?.activePackage?.slot && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-300">
          🅿️ Long-term package{plateAccountInfo.activePackage.name ? ` "${plateAccountInfo.activePackage.name}"` : ''} with a
          {' '}<strong>reserved slot {plateAccountInfo.activePackage.slot.code}</strong>
          {plateAccountInfo.activePackage.slot.floor?.name ? ` (Floor ${plateAccountInfo.activePackage.slot.floor.name})` : ''} — confirm to check in.
        </div>
      )}
      {checkInKind === 'package' && !plateAccountInfo?.activePackage?.slot && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300">
          🅿️ Vehicle has a long-term package{plateAccountInfo?.activePackage?.name ? ` "${plateAccountInfo.activePackage.name}"` : ''} — select an available slot below, then check in.
        </div>
      )}

      {/* Ảnh đã chụp — chân dung bắt buộc cho mọi loại; biển bắt buộc với vãng lai/user thường */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            License Plate Photo{checkInKind !== 'standard' ? ' (optional)' : ''}
          </p>
          <div className="aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted/40 flex items-center justify-center">
            {plateImage ? (
              <img src={plateImage} alt="License plate" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon size={20} className="text-muted-foreground/40" />
            )}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Portrait Photo</p>
          <div className="aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted/40 flex items-center justify-center">
            {portraitImage ? (
              <img src={portraitImage} alt="Portrait" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon size={20} className="text-muted-foreground/40" />
            )}
          </div>
        </div>
      </div>

      {/* License Plate + tài khoản */}
      <div className="grid gap-1.5">
        <label htmlFor="plate-number-confirm" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">License Plate</label>
        <Input
          id="plate-number-confirm"
          value={plateNumber}
          onChange={(e) => setPlateNumber(e.target.value)}
          onBlur={(e) => {
            const n = normalizePlate(e.target.value);
            if (n) setPlateNumber(n);
          }}
          placeholder="59G2-038.80"
        />
        {vehicleBrand && (
          <span className="inline-flex w-fit items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-300">
            <Car size={11} /> Vehicle brand: {vehicleBrand}
          </span>
        )}
        {plateNumber.trim().length >= 7 && plateAccountInfo?.hasAccount && (
          <div className="mt-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {/* Xem ghi chú ở IdentifyVehicleStep: không có email trong payload này. */}
            <p className="text-xs text-emerald-400">
              Member: <strong className="text-foreground">{plateAccountInfo.user?.fullName}</strong>
              {plateAccountInfo.registeredVehicle?.categoryLabel
                ? ` · registered ${plateAccountInfo.registeredVehicle.categoryLabel}${plateAccountInfo.registeredVehicle.brand ? ` ${plateAccountInfo.registeredVehicle.brand}` : ''}`
                : ''}
            </p>
          </div>
        )}
        {plateNumber.trim().length >= 7 && plateAccountInfo && !plateAccountInfo.hasAccount && (
          <div className="mt-1 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <p className="text-xs text-amber-300">
              License Plate <strong className="text-foreground">{plateNumber.toUpperCase()}</strong> — <strong>Walk-in Customer</strong> (no account).
            </p>
          </div>
        )}
      </div>

      <VehicleTypeSelector
        vehicleType={vehicleType}
        onChange={setVehicleType}
        allowedTypes={allowedTypes}
        plateTypeWarning={plateTypeWarning}
        buildingSupportWarning={buildingSupportWarning}
        mismatch={vehicleTypeMismatch}
        registeredVehicleKind={plateAccountInfo?.registeredVehicleKind}
        onRejectMismatch={() => setRejectOpen(true)}
      />

      {/* Chọn ô đỗ: bắt buộc với gói dài hạn và check-in thường (khách vãng lai / user) */}
      {needsSlotSelection && (
        <SlotSelector
          hasActivePackage={hasActivePackage}
          freeSlots={freeSlots}
          selectedSlotId={selectedSlotId}
          onChange={setSelectedSlotId}
          label={
            hasActivePackage
              ? `Vehicle has a long-term package${plateAccountInfo?.activePackage?.name ? ` "${plateAccountInfo.activePackage.name}"` : ''}${plateAccountInfo?.activePackage?.maxHoursPerDay ? ` · free ${plateAccountInfo.activePackage.maxHoursPerDay}h/day` : ''} - select an available slot:`
              : 'Select a parking slot for the customer (required if the building has slots):'
          }
          emptyStateText="This building has no fixed slots. Vehicles will park by shared capacity."
        />
      )}

      {/* Nhắc thiếu ảnh: chân dung bắt buộc mọi loại; biển bắt buộc với vãng lai/user thường */}
      {(!portraitImage || (checkInKind === 'standard' && !plateImage)) && (
        <p className="text-[11px] text-rose-300 flex items-center gap-1">
          <AlertCircle size={12} /> A <strong>portrait photo</strong> is required
          {checkInKind === 'standard' ? <> and a <strong>license plate photo</strong></> : null} before check-in. Go back to the previous step to capture it.
        </p>
      )}

      {/* Nút hành động */}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => setStep(2)} className="h-11 gap-1">
          <ArrowLeft size={16} /> Back
        </Button>
        <Button
          onClick={onCheckIn}
          disabled={disableCheckIn}
          className="flex-1 h-11 gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60"
        >
          <ScanLine size={16} /> Check-in
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setRejectOpen(true)}
          disabled={loading || !plateNumber.trim()}
          className="h-11 border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
        >
          Reject
        </Button>
      </div>
    </div>
  );
}
