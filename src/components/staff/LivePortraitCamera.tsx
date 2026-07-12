import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { UserSquare, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import type { LiveCameraHandle } from '@/components/staff/LivePlateCamera';
import { videoConstraintFor } from '@/hooks/useCameraDevices';

interface LivePortraitCameraProps {
  /** Pause stream rendering (kept for API parity; portrait cam always on). */
  paused?: boolean;
  /** Devices camera vật lý gán cho vai trò chân dung. */
  deviceId?: string;
}

/**
 * Camera CHÂN DUNG (riêng biệt) — always-on front camera that only shows the live
 * feed. No scanning. The parent grabs a frame via capture() at check-in to store
 * the driver portrait (so staff can compare the person at check-out).
 */
export const LivePortraitCamera = forwardRef<LiveCameraHandle, LivePortraitCameraProps>(
  function LivePortraitCamera({ deviceId }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [active, setActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    useImperativeHandle(ref, () => ({
      capture: () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.videoWidth === 0) return null;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.8);
      },
    }), []);

    useEffect(() => {
      let stream: MediaStream | null = null;
      let cancelled = false;

      const timeout = setTimeout(() => {
        if (!cancelled) setError('Camera is not ready after 8 seconds. Click "Retry" or check camera permissions.');
      }, 8000);

      (async () => {
        try {
          if (!navigator.mediaDevices?.getUserMedia) {
            throw Object.assign(new Error('API not supported'), { name: 'NotSupportedError' });
          }
          await new Promise<void>((r) => setTimeout(r, 150));
          if (cancelled) return;
          stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraintFor(deviceId, 'user') });
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
              setError('Camera permission has not been granted. Click the lock icon in the address bar -> Camera -> Allow.');
            } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'NotSupportedError') {
              setError('No camera found. Click Retry or Skip to continue without a photo.');
            } else if (name === 'NotReadableError' || name === 'TrackStartError') {
              setError('Camera is being used by another app. Close it and click Retry.');
            } else if (name === 'AbortError') {
              setError('Camera connection was interrupted. Click Retry.');
            } else {
              setError(`Unable to access portrait camera (${name || 'unknown error'}). Click Retry.`);
            }
          }
        }
      })();

      // Chốt tham chiếu video tại thời điểm effect chạy — lúc cleanup ref có thể đã đổi.
      const videoEl = videoRef.current;
      return () => {
        cancelled = true;
        clearTimeout(timeout);
        const s = (videoEl?.srcObject as MediaStream | null) ?? stream;
        s?.getTracks().forEach((t) => t.stop());
        if (videoEl) videoEl.srcObject = null;
      };
    }, [deviceId, retryCount]);

    const handleRetry = () => {
      setError(null);
      setActive(false);
      setRetryCount((c) => c + 1);
    };

    return (
      <div className="rounded-xl border border-border bg-card/40 p-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <UserSquare size={15} className="text-violet-400" />
          <p className="text-sm font-semibold text-foreground">Camera 3 · Driver Portrait</p>
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
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-36 w-28 rounded-[40%] border-2 border-dashed border-violet-400/50" />
            </div>
          )}
          {!active && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={28} className="animate-spin text-violet-400" />
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

        <p className="text-center text-[11px] text-muted-foreground">
          The driver portrait is captured at check-in for check-out comparison.
        </p>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  },
);
