import { AlertCircle, Car, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LivePlateCamera } from '@/components/staff/LivePlateCamera';
import { LivePortraitCamera } from '@/components/staff/LivePortraitCamera';
import { LiveQRCamera } from '@/components/staff/LiveQRCamera';
import { normalizePlate } from '@/utils/plate';
import { VehicleTypeSelector } from '@/components/staff/checkin/VehicleTypeSelector';
import { SlotSelector } from '@/components/staff/checkin/SlotSelector';
import type { CheckInWorkflow } from '@/hooks/staff/useCheckInWorkflow';

type MultiCameraCheckInProps = Pick<
  CheckInWorkflow,
  | 'plateCamRef' | 'portraitCamRef' | 'qrCamRef' | 'handlePlateDetected' | 'handleResolveIdQr'
  | 'loading' | 'assignment' | 'distinctDeviceCount' | 'buildingId'
  | 'plateNumber' | 'setPlateNumber' | 'onCheckIn' | 'vehicleBrand' | 'plateAccountInfo' | 'checkInKind'
  | 'vehicleType' | 'setVehicleType' | 'allowedTypes' | 'plateTypeWarning' | 'buildingSupportWarning' | 'vehicleTypeMismatch'
  | 'needsSlotSelection' | 'hasActivePackage' | 'freeSlots' | 'selectedSlotId' | 'setSelectedSlotId'
  | 'plateImage' | 'setRejectOpen'
>;

// Chế độ nhiều camera — mở cả 3 camera cùng lúc để chụp đồng thời (quầy có nhiều camera vật lý).
export function MultiCameraCheckIn({
  plateCamRef, portraitCamRef, qrCamRef, handlePlateDetected, handleResolveIdQr,
  loading, assignment, distinctDeviceCount, buildingId,
  plateNumber, setPlateNumber, onCheckIn, vehicleBrand, plateAccountInfo, checkInKind,
  vehicleType, setVehicleType, allowedTypes, plateTypeWarning, buildingSupportWarning, vehicleTypeMismatch,
  needsSlotSelection, hasActivePackage, freeSlots, selectedSlotId, setSelectedSlotId,
  plateImage, setRejectOpen,
}: MultiCameraCheckInProps) {
  const disableCheckIn =
    !plateNumber.trim() ||
    loading ||
    !!buildingSupportWarning ||
    // Gói có slot cố định (needsSlotSelection=false) → BE tự gán, không bắt chọn slot.
    (hasActivePackage && needsSlotSelection && !selectedSlotId) ||
    (checkInKind === 'standard' && !plateImage) ||
    (checkInKind === 'standard' && freeSlots.length > 0 && !selectedSlotId);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 lg:grid-cols-3">
        <LivePlateCamera ref={plateCamRef} onDetected={handlePlateDetected} buildingId={buildingId} busy={loading} deviceId={assignment.plate} />
        <LivePortraitCamera ref={portraitCamRef} deviceId={assignment.portrait} />
        <LiveQRCamera ref={qrCamRef} onResult={handleResolveIdQr} deviceId={assignment.qr} />
      </div>

      {distinctDeviceCount < 2 && (
        <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-[11px] text-amber-300">
          One webcam is being used for all 3 roles, so the frames are identical. Connect more cameras and assign each role in Camera Settings to capture plate and portrait at the same time.
        </p>
      )}

      {/* License Plate + tài khoản */}
      <div className="grid gap-1.5">
        <label htmlFor="plate-number-multicam" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">License Plate</label>
        <Input
          id="plate-number-multicam"
          value={plateNumber}
          onChange={(e) => setPlateNumber(e.target.value)}
          onBlur={(e) => { const n = normalizePlate(e.target.value); if (n) setPlateNumber(n); }}
          placeholder="59G2-038.80"
          onKeyDown={(e) => { if (e.key === 'Enter' && !disableCheckIn) onCheckIn(); }}
        />
        {vehicleBrand && (
          <span className="inline-flex w-fit items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-300">
            <Car size={11} /> Vehicle brand: {vehicleBrand}
          </span>
        )}
        {plateNumber.trim().length >= 7 && plateAccountInfo?.hasAccount && (
          <div className="mt-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs text-emerald-400">
            Member: <strong className="text-foreground">{plateAccountInfo.user?.fullName}</strong>
            {plateAccountInfo.registeredVehicle?.categoryLabel
              ? ` · registered ${plateAccountInfo.registeredVehicle.categoryLabel}${plateAccountInfo.registeredVehicle.brand ? ` ${plateAccountInfo.registeredVehicle.brand}` : ''}`
              : ''}
          </div>
        )}
        {plateNumber.trim().length >= 7 && plateAccountInfo && !plateAccountInfo.hasAccount && (
          <div className="mt-1 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-300">
            <strong className="text-foreground">Walk-in Customer</strong> (no account).
          </div>
        )}
        {/* Gói slot cố định → báo slot tự gán; gói floating → nhắc chọn slot bên dưới */}
        {plateNumber.trim().length >= 7 && checkInKind === 'package' && plateAccountInfo?.activePackage?.slot && (
          <div className="mt-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-300">
            🅿️ Long-term package{plateAccountInfo.activePackage.name ? ` "${plateAccountInfo.activePackage.name}"` : ''} with
            {' '}<strong>reserved slot {plateAccountInfo.activePackage.slot.code}</strong> — auto-assigned at check-in.
          </div>
        )}
        {plateNumber.trim().length >= 7 && checkInKind === 'package' && !plateAccountInfo?.activePackage?.slot && (
          <div className="mt-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300">
            🅿️ Vehicle has a long-term package{plateAccountInfo?.activePackage?.name ? ` "${plateAccountInfo.activePackage.name}"` : ''} — select an available slot below.
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
      />

      {needsSlotSelection && (
        <SlotSelector
          hasActivePackage={hasActivePackage}
          freeSlots={freeSlots}
          selectedSlotId={selectedSlotId}
          onChange={setSelectedSlotId}
          label={hasActivePackage ? 'Vehicle has a long-term package - select an available slot:' : 'Select a parking slot for the customer:'}
          emptyStateText="This building has no fixed slots. Vehicles park by shared capacity."
        />
      )}

      {checkInKind === 'standard' && !plateImage && (
        <p className="text-[11px] text-rose-300 flex items-center gap-1">
          <AlertCircle size={12} /> Please click <strong>"Capture &amp; Recognize"</strong> on the license plate camera before check-in.
        </p>
      )}

      <p className="text-[11px] text-muted-foreground">The portrait is captured automatically from the portrait camera when you click Check-in.</p>

      <div className="flex gap-2">
        <Button
          onClick={onCheckIn}
          disabled={disableCheckIn}
          className="flex-1 h-11 gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60"
        >
          <ScanLine size={16} /> Check-in
        </Button>
        <Button type="button" variant="outline" onClick={() => setRejectOpen(true)} disabled={loading || !plateNumber.trim()}
          className="h-11 border-rose-500/40 text-rose-400 hover:bg-rose-500/10">
          Reject
        </Button>
      </div>
    </div>
  );
}
