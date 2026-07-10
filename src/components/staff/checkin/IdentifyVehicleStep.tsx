import { ArrowRight, Car, QrCode, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LivePlateCamera } from '@/components/staff/LivePlateCamera';
import { LiveQRCamera } from '@/components/staff/LiveQRCamera';
import { normalizePlate } from '@/utils/plate';
import type { CheckInWorkflow } from '@/hooks/staff/useCheckInWorkflow';

type IdentifyVehicleStepProps = Pick<
  CheckInWorkflow,
  | 'identifyMode' | 'setIdentifyMode' | 'plateCamRef' | 'qrCamRef' | 'handlePlateDetected' | 'handleResolveIdQr'
  | 'loading' | 'assignment' | 'plateNumber' | 'setPlateNumber' | 'vehicleBrand' | 'plateAccountInfo'
  | 'checkInKind' | 'plateImage' | 'buildingSupportWarning' | 'proceedFromIdentify'
>;

// Bước 1 — nhận diện xe qua camera biển số (AI) hoặc quét QR, rồi tra cứu tài khoản/gói/đặt chỗ.
export function IdentifyVehicleStep({
  identifyMode, setIdentifyMode, plateCamRef, qrCamRef, handlePlateDetected, handleResolveIdQr,
  loading, assignment, plateNumber, setPlateNumber, vehicleBrand, plateAccountInfo,
  checkInKind, plateImage, buildingSupportWarning, proceedFromIdentify,
}: IdentifyVehicleStepProps) {
  const canProceed = plateNumber.trim().length >= 7 && !buildingSupportWarning && !(checkInKind === 'standard' && !plateImage);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 rounded-lg bg-muted border border-border">
        <button
          type="button"
          onClick={() => setIdentifyMode('plate')}
          className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md text-xs font-bold transition-all ${identifyMode === 'plate' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <ScanLine size={13} /> Scan Plate (AI)
        </button>
        <button
          type="button"
          onClick={() => setIdentifyMode('qr')}
          className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md text-xs font-bold transition-all ${identifyMode === 'qr' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <QrCode size={13} /> Scan QR
        </button>
      </div>

      {identifyMode === 'plate' ? (
        <LivePlateCamera ref={plateCamRef} onDetected={handlePlateDetected} busy={loading} deviceId={assignment.plate} />
      ) : (
        <LiveQRCamera ref={qrCamRef} onResult={handleResolveIdQr} deviceId={assignment.qr} />
      )}

      <div className="grid gap-1.5">
        <label htmlFor="plate-number-identify" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">License Plate (or manual entry)</label>
        <Input
          id="plate-number-identify"
          value={plateNumber}
          onChange={(e) => setPlateNumber(e.target.value)}
          onBlur={(e) => {
            const n = normalizePlate(e.target.value);
            if (n) setPlateNumber(n);
          }}
          placeholder="59G2-038.80"
          onKeyDown={(e) => { if (e.key === 'Enter' && canProceed) proceedFromIdentify(); }}
        />
        {vehicleBrand && (
          <span className="inline-flex w-fit items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-300">
            <Car size={11} /> Vehicle brand: {vehicleBrand}
          </span>
        )}
        {plateNumber.trim().length >= 7 && plateAccountInfo?.hasAccount && (
          <div className="mt-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <p className="text-xs text-emerald-400">
              Member: <strong className="text-foreground">{plateAccountInfo.user?.fullName}</strong> ({plateAccountInfo.user?.email})
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
        {/* Badge loại check-in đã nhận diện */}
        {plateNumber.trim().length >= 7 && checkInKind === 'package' && (
          <div className="mt-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300">
            🅿️ Vehicle has a <strong>long-term package</strong>{plateAccountInfo?.activePackage?.name ? ` "${plateAccountInfo.activePackage.name}"` : ''} — capture portrait and select an available slot in the next step.
          </div>
        )}
        {plateNumber.trim().length >= 7 && checkInKind === 'reservation' && (
          <div className="mt-1 rounded-lg border border-sky-500/30 bg-sky-500/10 p-2.5 text-xs text-sky-300">
            📅 Vehicle has a <strong>reservation</strong>{plateAccountInfo?.activeReservation?.code ? ` (code ${plateAccountInfo.activeReservation.code})` : ''} — capture portrait in the next step to confirm.
          </div>
        )}
        {plateNumber.trim().length >= 7 && checkInKind === 'standard' && !plateImage && (
          <div className="mt-1 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5 text-[11px] text-rose-300">
            A <strong>license plate photo</strong> is required: click "Capture &amp; Recognize" on the plate camera.
          </div>
        )}
      </div>

      <Button
        onClick={proceedFromIdentify}
        disabled={!canProceed}
        className="w-full h-11 gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60"
      >
        Continue <ArrowRight size={16} />
      </Button>
    </div>
  );
}
