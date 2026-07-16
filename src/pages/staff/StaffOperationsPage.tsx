import { Car, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CameraSetupModal } from '@/components/staff/CameraSetupModal';
import { RejectModal } from '@/components/staff/RejectModal';
import { UserQrInfoModal } from '@/components/staff/UserQrInfoModal';
import { MultiCameraCheckIn } from '@/components/staff/checkin/MultiCameraCheckIn';
import { IdentifyVehicleStep } from '@/components/staff/checkin/IdentifyVehicleStep';
import { CapturePortraitStep } from '@/components/staff/checkin/CapturePortraitStep';
import { ConfirmCheckInStep } from '@/components/staff/checkin/ConfirmCheckInStep';
import { useCheckInWorkflow } from '@/hooks/staff/useCheckInWorkflow';

const STEP_LABELS = [
  { n: 1, label: 'Identify Vehicle' },
  { n: 2, label: 'Capture Portrait' },
  { n: 3, label: 'Confirm' },
] as const;

export function StaffOperationsPage() {
  const wf = useCheckInWorkflow();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="grid gap-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Operations Shift</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">Vehicle Check-in</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {wf.building ? `${wf.building.code} · ${wf.building.name}` : 'No Building Selected'}
            </p>
          </div>
          <Link
            to="/staff/parked"
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-md bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/80 lg:self-auto"
          >
            <Car size={14} /> Parked Vehicles
          </Link>
        </div>
      </section>

      {/* Check-in — chế độ Step-by-step (1 camera/bước) hoặc Multiple Cameras (mở cùng lúc) */}
      <section className={`mx-auto w-full space-y-4 ${wf.multiCamMode ? 'max-w-6xl' : 'max-w-3xl'}`}>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Vehicle Check-in</CardTitle>
              <div className="flex items-center gap-2">
                {/* Toggle chế độ */}
                <div className="flex rounded-lg border border-border bg-muted p-0.5 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => wf.setMultiCamMode(false)}
                    className={`rounded-md px-2.5 py-1 transition ${!wf.multiCamMode ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Step-by-step
                  </button>
                  <button
                    type="button"
                    onClick={() => wf.setMultiCamMode(true)}
                    className={`rounded-md px-2.5 py-1 transition ${wf.multiCamMode ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Multiple Cameras
                  </button>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => { wf.setCameraSettingsOpen(true); void wf.requestAndRefresh(); }}
                  className="gap-1.5 text-xs"
                  title="Assign cameras by role when multiple cameras are available"
                >
                  <Settings size={13} /> Camera Settings
                </Button>
              </div>
            </div>
            {/* Step indicator (chỉ ở chế độ tuần tự) */}
            {!wf.multiCamMode && (
              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold">
                {STEP_LABELS.map((s, i) => (
                  <div key={s.n} className="flex items-center gap-2">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${wf.step >= s.n ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{s.n}</span>
                    <span className={wf.step === s.n ? 'text-foreground' : 'text-muted-foreground'}>{s.label}</span>
                    {i < STEP_LABELS.length - 1 && <span className="mx-1 hidden h-px w-5 bg-border sm:inline-block" />}
                  </div>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            {wf.multiCamMode ? (
              <MultiCameraCheckIn {...wf} />
            ) : (
              <>
                {wf.step === 1 && <IdentifyVehicleStep {...wf} />}
                {wf.step === 2 && <CapturePortraitStep {...wf} />}
                {wf.step === 3 && <ConfirmCheckInStep {...wf} />}
              </>
            )}

            {/* Phản hồi thao tác */}
            {wf.opMessage && (
              <div className={`rounded-xl border p-4 text-sm ${wf.opMessage.type === 'ok' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'}`}>
                {wf.opMessage.text}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Note: gói tự nhận diện khi quét — không cần nhập code thủ công */}
        <div className="rounded-xl border border-border bg-card/50 p-4 text-xs text-muted-foreground">
          <p className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
            <Settings size={13} className="text-primary" /> Packages are detected automatically
          </p>
          Vehicles with <strong>long-term packages</strong> are matched automatically when scanning the plate / QR in step 1. No manual code entry is needed.
          Payment collection and check-out are handled by exit-gate staff in the{' '}
          <Link to="/staff/parked" className="font-semibold text-primary hover:underline">“Parked Vehicles”</Link>.
        </div>
      </section>

      <CameraSetupModal
        open={wf.cameraSettingsOpen}
        onClose={() => wf.setCameraSettingsOpen(false)}
        devices={wf.devices}
        assignment={wf.assignment}
        assign={wf.assign}
        requestAndRefresh={wf.requestAndRefresh}
      />

      <RejectModal
        open={wf.rejectOpen}
        onClose={() => { wf.setRejectOpen(false); wf.setRejectReason(''); }}
        plateNumber={wf.plateNumber}
        rejectReason={wf.rejectReason}
        onReasonChange={wf.setRejectReason}
        onConfirm={wf.onReject}
      />

      <UserQrInfoModal
        info={wf.userQrInfo}
        onClose={() => wf.setUserQrInfo(null)}
      />
    </motion.div>
  );
}
