import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ScanLine, Loader2, AlertCircle, CheckCircle2, RefreshCw, Upload } from 'lucide-react';
import { staffApi } from '@/services/staff/staffApi';
import { videoConstraintFor } from '@/hooks/useCameraDevices';

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
  /** Devices camera vật lý gán cho vai trò này (nếu có nhiều camera). */
  deviceId?: string;
}

/**
 * Camera 1 — always-on license-plate camera. The live feed is shown immediately
 * (no click-to-open). "Chụp & nhận diện" sends the current frame to the AI scan
 * and returns the recognized plate + the captured image (saved to DB).
 */
export const LivePlateCamera = forwardRef<LiveCameraHandle, LivePlateCameraProps>(function LivePlateCamera(
  { onDetected, busy = false, deviceId },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    const timeout = setTimeout(() => {
      if (!cancelled) setError('Camera is not ready after 8 seconds. Click "Retry" or check browser camera permissions.');
    }, 8000);

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw Object.assign(new Error('API not supported'), { name: 'NotSupportedError' });
        }
        // Small delay to let any tracks released by React StrictMode cleanup be freed by the browser.
        await new Promise<void>((r) => setTimeout(r, 150));
        if (cancelled) return;
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            ...videoConstraintFor(deviceId, 'environment'),
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        clearTimeout(timeout);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(() => undefined);
            if (!cancelled) setActive(true);
          };
          videoRef.current.play().catch(() => undefined);
        }
        setError(null);
      } catch (err) {
        clearTimeout(timeout);
        if (!cancelled) {
          const name = (err as { name?: string })?.name ?? '';
          if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
            setError('Camera permission has not been granted. Click the lock icon in the address bar -> Permissions -> Camera -> Allow.');
          } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'NotSupportedError') {
            setError('No camera device found. Connect a camera and click Retry.');
          } else if (name === 'NotReadableError' || name === 'TrackStartError') {
            setError('Camera is being used by another app. Close it and click Retry.');
          } else if (name === 'AbortError') {
            setError('Camera connection was interrupted. Click Retry.');
          } else if (name === 'OverconstrainedError') {
            setError('Camera does not support the requested format. Click Retry.');
          } else {
            setError(`Unable to access camera (${name || 'unknown error'}). Click Retry.`);
          }
        }
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      const s = (videoRef.current?.srcObject as MediaStream | null) ?? stream;
      s?.getTracks().forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [deviceId, retryCount]);

  const handleRetry = () => {
    setError(null);
    setActive(false);
    setRetryCount((c) => c + 1);
  };

  const captureFrame = (): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const MAX_W = 1920;
    const scale = Math.min(1, MAX_W / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.92);
  };

  useImperativeHandle(ref, () => ({ capture: () => captureFrame() }), []);

  const handleCapture = async () => {
    setError(null);
    setSuccess(null);
    setProcessing(true);
    try {
      // Wait for autofocus to settle before grabbing the frame.
      await new Promise<void>((r) => setTimeout(r, 350));

      const doScan = async (): Promise<{ plateNumber: string; brand: string | null; dataUrl: string } | null> => {
        const dataUrl = captureFrame();
        if (!dataUrl) return null;
        const base64 = dataUrl.split(',')[1];
        const res = await staffApi.scanVehicle(base64);
        const data = (res as { data?: { plateNumber?: string; brand?: string | null } })?.data;
        return { plateNumber: data?.plateNumber || '', brand: data?.brand ?? null, dataUrl };
      };

      let result = await doScan();
      if (!result) {
        setError('Camera is not ready. Please try again.');
        return;
      }

      // Auto-retry once when no plate detected — different frame timing often succeeds.
      if (!result.plateNumber) {
        await new Promise<void>((r) => setTimeout(r, 600));
        const retry = await doScan();
        if (retry && retry.plateNumber) result = retry;
      }

      onDetected({ plateNumber: result.plateNumber, brand: result.brand, plateImage: result.dataUrl });
      if (result.plateNumber) {
        setSuccess(`License Plate: ${result.plateNumber}${result.brand ? ` · ${result.brand}` : ''}`);
        setTimeout(() => setSuccess(null), 2500);
      } else {
        setSuccess('License plate image saved. Automatic recognition failed. Please enter it manually.');
        setTimeout(() => setSuccess(null), 3500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'License plate recognition failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-selected if needed
    e.target.value = '';
    setError(null);
    setSuccess(null);
    setProcessing(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Could not read file'));
        reader.readAsDataURL(file);
      });
      const base64 = dataUrl.split(',')[1];
      const res = await staffApi.scanVehicle(base64);
      const data = (res as { data?: { plateNumber?: string; brand?: string | null } })?.data;
      const plateNumber = data?.plateNumber || '';
      const brand = data?.brand ?? null;
      onDetected({ plateNumber, brand, plateImage: dataUrl });
      if (plateNumber) {
        setSuccess(`License Plate: ${plateNumber}${brand ? ` · ${brand}` : ''}`);
        setTimeout(() => setSuccess(null), 2500);
      } else {
        setSuccess('Image saved. Automatic recognition failed. Please enter it manually.');
        setTimeout(() => setSuccess(null), 3500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'License plate recognition failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card/40 p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <ScanLine size={15} className="text-primary" />
        <p className="text-sm font-semibold text-foreground">Camera 1 · License Plate Scan</p>
      </div>

      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-black/60">
        <style>{`
          @keyframes laserScan {
            0% { top: 0%; }
            50% { top: 100%; }
            100% { top: 0%; }
          }
          .laser-scanner-line {
            position: absolute;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.85) 50%, transparent);
            box-shadow: 0 0 8px rgba(16, 185, 129, 0.8), 0 0 15px rgba(16, 185, 129, 0.4);
            animation: laserScan 2.8s ease-in-out infinite;
            pointer-events: none;
            z-index: 10;
          }
          .laser-scanner-line-active {
            background: linear-gradient(90deg, transparent, rgba(249, 115, 22, 0.95) 50%, transparent);
            box-shadow: 0 0 12px rgba(249, 115, 22, 0.9), 0 0 22px rgba(249, 115, 22, 0.6);
            animation: laserScan 1.2s ease-in-out infinite;
          }
        `}</style>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover ${active ? 'block' : 'hidden'}`}
        />
        {active && (
          <>
            {/* Corner brackets */}
            <div className="pointer-events-none absolute inset-0 border-2 border-emerald-400/20 rounded-lg">
              <div className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-emerald-400" />
              <div className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-emerald-400" />
              <div className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-emerald-400" />
              <div className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-emerald-400" />
            </div>
            {/* License-plate targeting box — guides staff to align the plate here */}
            <div className="pointer-events-none absolute inset-x-[12%] top-[30%] bottom-[30%] rounded border-2 border-dashed border-yellow-400/70 shadow-[0_0_10px_rgba(250,204,21,0.3)]">
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/60 px-2 py-0.5 text-[10px] font-bold text-yellow-300 tracking-widest">
                PLACE PLATE HERE
              </span>
            </div>
            <div className={processing ? 'laser-scanner-line laser-scanner-line-active' : 'laser-scanner-line'} />
          </>
        )}
        {!active && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-emerald-400" />
          </div>
        )}
        {error && !active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-4 text-center">
            <AlertCircle size={20} className="shrink-0 text-rose-400" />
            <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/30 transition"
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCapture}
          disabled={!active || processing || busy}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
        >
          {processing ? <Loader2 size={15} className="animate-spin" /> : <ScanLine size={15} />}
          Capture &amp; Recognize
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={processing || busy}
          title="Upload a license plate image instead of using the camera"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2.5 text-xs font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-60"
        >
          <Upload size={14} />
          Upload Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

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
