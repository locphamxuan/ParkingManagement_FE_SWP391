import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Loader, Upload, QrCode, Camera, CheckCircle2 } from 'lucide-react';
import jsQR from 'jsqr';
import { BrowserQRCodeReader } from '@zxing/browser';
import { DecodeHintType } from '@zxing/library';
import { Button } from '@/components/ui/button';

// "Try harder" = spend more effort locating the QR (helps photos of screens /
// tilted shots). Inverted (light-on-dark) QR is covered by the jsQR fallback.
const ZXING_HINTS = new Map<DecodeHintType, unknown>([
  [DecodeHintType.TRY_HARDER, true],
]);

interface QRCodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (qrCode: string) => void;
  loading?: boolean;
  title?: string;
}

export function QRCodeScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  loading = false,
  title = 'Scan QR Code',
}: QRCodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [useCamera, setUseCamera] = useState(true);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize webcam
  useEffect(() => {
    if (!isOpen || !useCamera) return;

    const initCamera = async () => {
      try {
        setError(null);
        setScannedCode(null);
        setIsScanning(true);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Ensure video plays and metadata is loaded
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((e) => {
              console.error('Play error:', e);
            });
            startScanning();
          };
          // Fallback: try to play immediately in case metadata is already loaded
          videoRef.current.play().catch((e) => {
            console.error('Immediate play error:', e);
          });
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Unable to access camera. Please grant camera permission.';
        setError(message);
        setIsScanning(false);
      }
    };

    initCamera();

    return () => {
      // Cleanup: stop camera and animation frame
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen]);

  const startScanning = () => {
    const scan = () => {
      if (!videoRef.current || !canvasRef.current) {
        animationFrameRef.current = requestAnimationFrame(scan);
        return;
      }

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        animationFrameRef.current = requestAnimationFrame(scan);
        return;
      }

      // Wait for video to have actual dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        animationFrameRef.current = requestAnimationFrame(scan);
        return;
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      // Scan for QR code
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && code.data && !scannedCode) {
        // QR code found
        setScannedCode(code.data);
        setIsScanning(false);
        
        // Stop camera
        if (videoRef.current?.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach((track) => track.stop());
        }

        // Callback after a short delay to show result
        setTimeout(() => {
          onScanSuccess(code.data);
        }, 300);
      } else {
        // Continue scanning
        animationFrameRef.current = requestAnimationFrame(scan);
      }
    };

    animationFrameRef.current = requestAnimationFrame(scan);
  };

  const handleRetry = () => {
    setScannedCode(null);
    if (videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              setIsScanning(true);
              startScanning();
            };
          }
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Camera error');
        });
    }
  };

  // Try decoding a QR from an image at several scales — phone photos are large
  // and the QR is often small/tilted, so jsQR on the raw resolution frequently
  // misses. Downscaled passes + inversion attempts are far more reliable.
  const decodeQrFromImage = (img: HTMLImageElement): string | null => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true } as CanvasRenderingContext2DSettings);
    if (!canvas || !ctx) return null;

    // Candidate widths: original, then progressively smaller (deduped, only downscale).
    const widths = Array.from(new Set([img.width, 1600, 1200, 900, 600].filter((w) => w <= img.width || w === img.width)));
    for (const targetW of widths) {
      const scale = targetW >= img.width ? 1 : targetW / img.width;
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);
      const code = jsQR(data, w, h, { inversionAttempts: 'attemptBoth' });
      if (code?.data) return code.data;
    }
    return null;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;

    setError(null);
    const url = URL.createObjectURL(file);
    try {
      let result: string | null = null;

      // 1) ZXing — robust on real photos (handles tilt, glare, inverted QR).
      try {
        const zxing = new BrowserQRCodeReader(ZXING_HINTS);
        const res = await zxing.decodeFromImageUrl(url);
        result = res?.getText() || null;
      } catch {
        /* ZXing found nothing — fall back to jsQR multi-scale below */
      }

      // 2) jsQR multi-scale fallback.
      if (!result) {
        result = await new Promise<string | null>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(decodeQrFromImage(img));
          img.onerror = () => resolve(null);
          img.src = url;
        });
      }

      if (result) {
        setScannedCode(result);
        setTimeout(() => onScanSuccess(result), 300);
      } else {
        setError('No QR code found in the image. Retake it with the QR clearly visible, large in frame, and without glare or tilt.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image processing failed');
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-white/10 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-sky-500/10 to-cyan-500/10 border-b border-white/5 p-6 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <QrCode size={18} className="text-sky-400" />
                  <h2 className="text-base font-bold text-white">{title}</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X size={20} className="text-slate-400 hover:text-white transition-colors" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Tabs */}
                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-950/60 border border-white/10">
                  <button
                    onClick={() => setUseCamera(true)}
                    className={`inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-bold transition-all ${
                      useCamera ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Camera size={14} /> Scan Camera
                  </button>
                  <button
                    onClick={() => setUseCamera(false)}
                    className={`inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-bold transition-all ${
                      !useCamera ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Upload size={14} /> Upload Image
                  </button>
                </div>

                {/* Camera Preview */}
                {useCamera && (
                  <div className="relative bg-black rounded-2xl overflow-hidden border border-white/10">
                    <video
                      ref={videoRef}
                      className="w-full h-72 object-cover"
                      autoPlay
                      playsInline
                      muted
                      crossOrigin="anonymous"
                    />

                    {/* Scan frame */}
                    {isScanning && !scannedCode && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-44 h-44">
                          <div className="absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 border-sky-400 rounded-tl-lg" />
                          <div className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-sky-400 rounded-tr-lg" />
                          <div className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 border-sky-400 rounded-bl-lg" />
                          <div className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 border-sky-400 rounded-br-lg" />
                        </div>
                      </div>
                    )}

                    {/* Success */}
                    {scannedCode && (
                      <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/25 backdrop-blur-sm">
                        <CheckCircle2 size={72} className="text-emerald-400" />
                      </div>
                    )}

                    {/* Loading */}
                    {loading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Loader className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                )}

                {/* Upload section */}
                {!useCamera && (
                  <div className="rounded-2xl border-2 border-dashed border-sky-500/30 bg-sky-500/5 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-8 flex flex-col items-center gap-2 text-sky-300 hover:text-sky-200 transition-colors"
                    >
                      <Upload size={26} />
                      <span className="text-sm font-semibold">Click to choose a QR code image</span>
                      <span className="text-xs text-slate-500">or drag and drop an image here</span>
                    </button>
                  </div>
                )}

                {/* Status */}
                {scannedCode ? (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                    <p className="text-xs font-semibold text-emerald-400">Scan successful</p>
                    <p className="mt-1 text-sm font-mono text-emerald-300 break-all">{scannedCode}</p>
                  </div>
                ) : error ? (
                  <div className="flex gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">
                    <AlertCircle size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-rose-400">{error}</p>
                  </div>
                ) : isScanning ? (
                  <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
                    <p className="text-xs font-semibold text-sky-300">Scanning QR code...</p>
                    <p className="mt-1 text-xs text-slate-500">Point the camera at the QR code to start scanning</p>
                  </div>
                ) : null}

                {/* Actions */}
                <div className="flex gap-3">
                  {scannedCode ? (
                    <>
                      <Button type="button" variant="outline" onClick={handleRetry} disabled={loading} className="flex-1">
                        Scan Again
                      </Button>
                      <Button type="button" onClick={onClose} disabled={loading} className="flex-1">
                        {loading ? 'Processing...' : 'Confirm'}
                      </Button>
                    </>
                  ) : (
                    <Button type="button" variant="outline" onClick={onClose} disabled={isScanning || loading} className="w-full">
                      Close
                    </Button>
                  )}
                </div>

                <p className="text-xs text-slate-500 text-center">
                  Allow camera access to use this feature
                </p>

                {/* Hidden canvas for QR parsing */}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
