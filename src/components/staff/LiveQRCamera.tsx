import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { QrCode, Loader2, CheckCircle2 } from 'lucide-react';
import jsQR from 'jsqr';
import type { LiveCameraHandle } from '@/components/staff/LivePlateCamera';
import { videoConstraintFor } from '@/hooks/useCameraDevices';

interface LiveQRCameraProps {
  /** Fired when a QR is decoded (account ID or vehicle PLT- token). */
  onResult: (code: string) => void;
  /** Pause detection (e.g. while a result modal is open). */
  paused?: boolean;
  /** Thiết bị camera vật lý gán cho vai trò QR. */
  deviceId?: string;
}

/**
 * Camera 2 — always-on QR camera (account / vehicle). The live feed is shown
 * immediately and scans continuously. When a QR is found it also captures the
 * current frame as the driver portrait (saved to DB at check-in). Also exposes
 * an imperative capture() so the parent can grab the portrait at check-in even
 * without a QR scan.
 */
export const LiveQRCamera = forwardRef<LiveCameraHandle, LiveQRCameraProps>(function LiveQRCamera(
  { onResult, paused = false, deviceId },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const pausedRef = useRef(paused);
  const lastHitRef = useRef(0);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // Grab the current frame as a portrait snapshot (used at check-in to ensure a
  // portrait is captured even when no QR was scanned).
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

    const scan = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.videoWidth === 0) {
        rafRef.current = requestAnimationFrame(scan);
        return;
      }
      const ctx = canvas.getContext('2d', { willReadFrequently: true } as CanvasRenderingContext2DSettings);
      if (!ctx) {
        rafRef.current = requestAnimationFrame(scan);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      // Debounce so the same QR doesn't fire repeatedly.
      if (code?.data && !pausedRef.current && Date.now() - lastHitRef.current > 2500) {
        lastHitRef.current = Date.now();
        setFlash(true);
        setTimeout(() => setFlash(false), 600);
        onResult(code.data);
      }
      rafRef.current = requestAnimationFrame(scan);
    };

    (async () => {
      try {
        await new Promise<void>((r) => setTimeout(r, 150));
        if (cancelled) return;
        stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraintFor(deviceId, 'environment') });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(() => undefined);
            setActive(true);
            rafRef.current = requestAnimationFrame(scan);
          };
          videoRef.current.play().catch(() => undefined);
        }
        setError(null);
      } catch {
        if (!cancelled) setError('Không thể truy cập camera QR. Vui lòng cấp quyền.');
      }
    })();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const s = (videoRef.current?.srcObject as MediaStream | null) ?? stream;
      s?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  return (
    <div className="rounded-xl border border-border bg-card/40 p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <QrCode size={15} className="text-sky-400" />
        <p className="text-sm font-semibold text-foreground">Camera 2 · Quét QR (tài khoản / phương tiện)</p>
      </div>

      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-black/60">
        <style>{`
          @keyframes qrScan {
            0% { top: 0%; }
            50% { top: 100%; }
            100% { top: 0%; }
          }
          .qr-scanner-line {
            position: absolute;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.8) 50%, transparent);
            box-shadow: 0 0 6px rgba(56, 189, 248, 0.8), 0 0 10px rgba(56, 189, 248, 0.4);
            animation: qrScan 2.2s ease-in-out infinite;
            pointer-events: none;
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
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-32 w-32">
              <div className="absolute inset-0 overflow-hidden rounded-lg">
                {!paused && <div className="qr-scanner-line" />}
              </div>
              <div className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-sky-400 rounded-tl-lg" />
              <div className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-sky-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-sky-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-sky-400 rounded-br-lg" />
            </div>
          </div>
        )}
        {flash && (
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/25 backdrop-blur-sm">
            <CheckCircle2 size={56} className="text-emerald-400" />
          </div>
        )}
        {!active && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-sky-400" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-3 text-center">
            <p className="text-xs text-rose-300">{error}</p>
          </div>
        )}
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        {paused ? 'Đang tạm dừng quét…' : 'Hướng mã QR vào khung — hệ thống tự nhận diện'}
      </p>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
});
