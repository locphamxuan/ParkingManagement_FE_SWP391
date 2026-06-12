import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { UserSquare, Loader2 } from 'lucide-react';
import type { LiveCameraHandle } from '@/components/staff/LivePlateCamera';

interface LivePortraitCameraProps {
  /** Pause stream rendering (kept for API parity; portrait cam always on). */
  paused?: boolean;
}

/**
 * Camera CHÂN DUNG (riêng biệt) — always-on front camera that only shows the live
 * feed. No scanning. The parent grabs a frame via capture() at check-in to store
 * the driver portrait (so staff can compare the person at check-out).
 */
export const LivePortraitCamera = forwardRef<LiveCameraHandle, LivePortraitCameraProps>(
  function LivePortraitCamera(_props, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [active, setActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

      (async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
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
          if (!cancelled) setError('Không thể truy cập camera chân dung. Vui lòng cấp quyền.');
        }
      })();

      return () => {
        cancelled = true;
        const s = (videoRef.current?.srcObject as MediaStream | null) ?? stream;
        s?.getTracks().forEach((t) => t.stop());
      };
    }, []);

    return (
      <div className="rounded-xl border border-border bg-card/40 p-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <UserSquare size={15} className="text-violet-400" />
          <p className="text-sm font-semibold text-foreground">Camera 1 · Chân dung tài xế</p>
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
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-3 text-center">
              <p className="text-xs text-rose-300">{error}</p>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Ảnh chân dung được chụp khi check-in để đối chiếu lúc lấy xe.
        </p>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  },
);
