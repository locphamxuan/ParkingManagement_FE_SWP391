import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { staffApi } from '@/services/staff/staffApi';

export interface ScanResult {
  plateNumber: string;
  brand: string | null;
}

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (result: ScanResult) => void;
}

export function CameraModal({ isOpen, onClose, onCapture }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamRef, setStreamRef] = useState<MediaStream | null>(null);

  // Initialize camera
  useEffect(() => {
    if (!isOpen) {
      setCameraActive(false);
      setError(null);
      return;
    }

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStreamRef(stream);
          // Ensure video plays
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((e) => {
              console.error('Play error:', e);
            });
            setCameraActive(true);
          };
          // Fallback: try to play immediately
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch((e) => {
              console.error('Immediate play error:', e);
            });
          }
          // Set camera active after a short delay to ensure video is ready
          setTimeout(() => {
            if (videoRef.current?.readyState === HTMLMediaElement.HAVE_FUTURE_DATA) {
              setCameraActive(true);
            }
          }, 100);
          setError(null);
        }
      } catch (err) {
        console.error('Camera init error:', err);
        setError('Không thể truy cập webcam. Vui lòng kiểm tra quyền.');
        setCameraActive(false);
      }
    };

    initCamera();

    return () => {
      // Stop the live stream off the video element (streamRef state is stale here on first run).
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [isOpen]);

  const handleCapture = async () => {
    try {
      if (!videoRef.current || !canvasRef.current) {
        setError('Video hoặc Canvas element không tồn tại');
        return;
      }

      setIsProcessing(true);
      setError(null);

      // Check video dimensions are available
      if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
        throw new Error('Video dimensions not available. Camera may not be ready.');
      }

      // Draw video frame to canvas, downscaled to keep the upload small (and AI fast/cheap).
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      const MAX_W = 1280;
      const scale = Math.min(1, MAX_W / videoRef.current.videoWidth);
      canvasRef.current.width = Math.round(videoRef.current.videoWidth * scale);
      canvasRef.current.height = Math.round(videoRef.current.videoHeight * scale);
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

      // Convert to base64 (JPEG q=0.8)
      const imageData = canvasRef.current.toDataURL('image/jpeg', 0.8);
      const base64 = imageData.split(',')[1];

      // Send to backend AI scan (plate + brand)
      const res = await staffApi.scanVehicle(base64);
      const data = (res as { data?: { plateNumber?: string; brand?: string | null } })?.data;
      const plateNumber = data?.plateNumber || '';
      const brand = data?.brand ?? null;

      if (plateNumber) {
        // Stop camera
        if (streamRef) {
          streamRef.getTracks().forEach((track) => track.stop());
        }
        setCameraActive(false);
        onCapture({ plateNumber, brand });
        onClose();
      } else {
        setError('Không đọc được biển số — hãy dùng Camera QR (Camera 2) để nhận diện.');
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError(err instanceof Error ? err.message : 'Lỗi xử lý ảnh');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (streamRef) {
      streamRef.getTracks().forEach((track) => track.stop());
    }
    setCameraActive(false);
    setError(null);
    onClose();
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
            onClick={handleClose}
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
            <div className="w-full max-w-lg rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-white/10 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-b border-white/5 p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-400 font-mono">Quét Webcam</p>
                  <h2 className="text-xl font-black text-white">Nhận Diện Biển Số Xe</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
                >
                  <X size={20} className="text-slate-400 hover:text-white transition-colors" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Video Container */}
                <div className="relative rounded-2xl overflow-hidden bg-black/50 border border-white/10">
                  {/* Always render the <video> so the ref exists when the camera stream is attached. */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black/50 border border-white/10">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    crossOrigin="anonymous"
                    className="w-full h-auto"
                    style={{ aspectRatio: '4/3' }}
                    className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                  />

                  {/* Laser Scan Overlay */}
                  {cameraActive && (
                    <motion.div
                      animate={{ top: ['0%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute left-0 right-0 h-1 bg-gradient-to-b from-transparent via-green-400 to-transparent shadow-[0_0_20px_rgba(74,222,128,0.8)]"
                    />
                  )}

                  {/* Scan Frame Border */}
                  {cameraActive && (
                    <div className="absolute inset-0 border-2 border-green-400/30 pointer-events-none rounded-lg">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-green-400" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-green-400" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-green-400" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-green-400" />
                    </div>
                  )}

                  {!cameraActive && !error && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 size={40} className="animate-spin text-orange-400" />
                    </div>
                  )}

                  {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                      <div className="text-center">
                        <p className="text-red-400 font-semibold">Lỗi</p>
                        <p className="text-sm text-red-300 mt-2">{error}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                {cameraActive && !error && (
                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3">
                    <p className="text-xs text-blue-200 font-semibold leading-relaxed">
                      Hướng camera vào biển số xe và bấm "Chụp & Nhận Diện" khi hình ảnh rõ ràng.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleCapture}
                    disabled={!cameraActive || isProcessing}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(249,115,22,0.35)] disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        Chụp & Nhận Diện
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleClose}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white font-black text-sm uppercase tracking-wider transition-all duration-300 hover:bg-slate-700 hover:border-white/20 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </>
      )}
    </AnimatePresence>
  );
}
