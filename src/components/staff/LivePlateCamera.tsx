import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ScanLine, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { staffApi } from '@/services/staff/staffApi';

export interface PlateScanResult {
  plateNumber: string;
  brand: string | null;
  /** The captured frame (base64 data-URL) — stored to DB as the plate image. */
  plateImage: string;
}

/** Imperative handle: grab the current camera frame as a base64 data-URL. */
export interface LiveCameraHandle {
  capture: () => string | null;
}

interface LivePlateCameraProps {
  onDetected: (result: PlateScanResult) => void;
  /** Disable the capture button while the parent is busy. */
  busy?: boolean;
}

/**
 * Camera 1 — always-on license-plate camera. The live feed is shown immediately
 * (no click-to-open). "Chụp & nhận diện" sends the current frame to the AI scan
 * and returns the recognized plate + the captured image (saved to DB).
 */
export const LivePlateCamera = forwardRef<LiveCameraHandle, LivePlateCameraProps>(function LivePlateCamera(
  { onDetected, busy = false },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(() => undefined);
            setActive(true);
          };
          videoRef.current.play().catch(() => undefined);
        }
        setError(null);
      } catch {
        if (!cancelled) setError('Không thể truy cập camera biển số. Vui lòng cấp quyền.');
      }
    })();

    return () => {
      cancelled = true;
      const s = (videoRef.current?.srcObject as MediaStream | null) ?? stream;
      s?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const captureFrame = (): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const MAX_W = 1280;
    const scale = Math.min(1, MAX_W / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  useImperativeHandle(ref, () => ({ capture: () => captureFrame() }), []);

  const handleCapture = async () => {
    setError(null);
    setSuccess(null);
    const dataUrl = captureFrame();
    if (!dataUrl) {
      setError('Camera chưa sẵn sàng. Vui lòng thử lại.');
      return;
    }
    setProcessing(true);
    try {
      const base64 = dataUrl.split(',')[1];
      const res = await staffApi.scanVehicle(base64);
      const data = (res as { data?: { plateNumber?: string; brand?: string | null } })?.data;
      const plateNumber = data?.plateNumber || '';
      const brand = data?.brand ?? null;
      if (plateNumber) {
        setSuccess(`Biển số: ${plateNumber}${brand ? ` · ${brand}` : ''}`);
        onDetected({ plateNumber, brand, plateImage: dataUrl });
        setTimeout(() => setSuccess(null), 2500);
      } else {
        setError('Không đọc được biển số — dùng Camera 2 (QR) bên cạnh để nhận diện.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi nhận diện biển số');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card/40 p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <ScanLine size={15} className="text-primary" />
        <p className="text-sm font-semibold text-foreground">Camera 2 · Quét biển số</p>
      </div>

      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-black/60">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover ${active ? 'block' : 'hidden'}`}
        />
        {active && (
          <div className="pointer-events-none absolute inset-0 border-2 border-emerald-400/30 rounded-lg">
            <div className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-emerald-400" />
            <div className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-emerald-400" />
            <div className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-emerald-400" />
            <div className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-emerald-400" />
          </div>
        )}
        {!active && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-emerald-400" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-3 text-center">
            <p className="text-xs text-rose-300">{error}</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleCapture}
        disabled={!active || processing || busy}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
      >
        {processing ? <Loader2 size={15} className="animate-spin" /> : <ScanLine size={15} />}
        Chụp &amp; nhận diện
      </button>

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-400">
          <CheckCircle2 size={14} className="shrink-0" /> <span>{success}</span>
        </div>
      )}
      {error && active && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-xs text-rose-400">
          <AlertCircle size={14} className="mt-0.5 shrink-0" /> <span>{error}</span>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
});
