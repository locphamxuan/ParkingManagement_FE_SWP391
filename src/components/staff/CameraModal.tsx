import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (plate: string) => void;
}

const OCR_API_KEY = 'K87161803788957';
const OCR_API_URL = 'https://api.ocr.space/parse';

function normalizePlate(text: string): string | null {
  const pattern = /(\d{2})[^\w]*([A-Z]{1,2})[^\w]*(\d{3,5})/;
  const matches = pattern.exec(text);
  
  if (matches) {
    return `${matches[1]}${matches[2]}-${matches[3]}`;
  }
  
  return null;
}

async function recognizePlateFromImage(imageBase64: string): Promise<string | null> {
  try {
    const response = await fetch(OCR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apikey: OCR_API_KEY,
        base64Image: imageBase64,
        language: 'eng',
      }),
    });

    const data = await response.json();

    if (data.IsErroredOnProcessing) {
      throw new Error(data.ErrorMessage || 'OCR processing failed');
    }

    const text = data.ParsedText || '';
    const plate = normalizePlate(text);

    return plate;
  } catch (error) {
    console.error('OCR recognition error:', error);
    return null;
  }
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
      if (streamRef) {
        streamRef.getTracks().forEach((track) => track.stop());
      }
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

      console.log('Capturing frame:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);

      // Draw video frame to canvas
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);

      // Convert to base64
      const imageData = canvasRef.current.toDataURL('image/jpeg');
      const base64 = imageData.split(',')[1];

      // Send to OCR
      const plate = await recognizePlateFromImage(`data:image/jpeg;base64,${base64}`);

      if (plate) {
        // Stop camera
        if (streamRef) {
          streamRef.getTracks().forEach((track) => track.stop());
        }
        setCameraActive(false);
        onCapture(plate);
        onClose();
      } else {
        setError('Không phát hiện biển số. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Capture error:', err);
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
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-400 font-mono">📷 Quét Webcam</p>
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
                  {cameraActive && (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      crossOrigin="anonymous"
                      className="w-full h-auto"
                      style={{ aspectRatio: '4/3' }}
                    />
                  )}

                  {/* Laser Scan Overlay */}
                  {cameraActive && (
                    <motion.div
                      animate={{ top: ['0%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute left-0 right-0 h-1 bg-gradient-to-b from-transparent via-green-400 to-transparent shadow-[0_0_20px_rgba(74,222,128,0.8)]"
                    />
                  )}

                  {/* Scan Frame Border */}
                  <div className="absolute inset-0 border-2 border-green-400/30 pointer-events-none rounded-lg">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-green-400" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-green-400" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-green-400" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-green-400" />
                  </div>

                  {!cameraActive && !error && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 size={40} className="animate-spin text-orange-400" />
                    </div>
                  )}

                  {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                      <div className="text-center">
                        <p className="text-red-400 font-semibold">❌ Lỗi</p>
                        <p className="text-sm text-red-300 mt-2">{error}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                {cameraActive && !error && (
                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3">
                    <p className="text-xs text-blue-200 font-semibold leading-relaxed">
                      📍 Hướng camera vào biển số xe và bấm "Chụp & Nhận Diện" khi hình ảnh rõ ràng.
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
                        🎯 Chụp & Nhận Diện
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
