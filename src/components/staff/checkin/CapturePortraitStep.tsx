import { ArrowLeft, UserSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LivePortraitCamera } from '@/components/staff/LivePortraitCamera';
import type { CheckInWorkflow } from '@/hooks/staff/useCheckInWorkflow';

type CapturePortraitStepProps = Pick<
  CheckInWorkflow,
  'portraitCamRef' | 'assignment' | 'portraitImage' | 'setStep' | 'capturePortraitAndNext'
>;

// Bước 2 — chụp ảnh chân dung (bắt buộc với mọi loại check-in) rồi sang bước Confirm.
export function CapturePortraitStep({ portraitCamRef, assignment, portraitImage, setStep, capturePortraitAndNext }: CapturePortraitStepProps) {
  return (
    <div className="space-y-4">
      <LivePortraitCamera ref={portraitCamRef} deviceId={assignment.portrait} />
      {portraitImage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-400">
          <UserSquare size={14} /> Portrait photo captured. You can retake it if needed.
        </div>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-11 gap-1">
          <ArrowLeft size={16} /> Back
        </Button>
        <Button onClick={capturePortraitAndNext} className="flex-1 h-11 gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110">
          <UserSquare size={16} /> {portraitImage ? 'Retake & Continue' : 'Capture Portrait & Continue'}
        </Button>
      </div>
    </div>
  );
}
