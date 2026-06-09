import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (plate: string) => void;
}

const OCR_API_KEY = 'K87161803788957';
const OCR_API_URL = 'https://api.ocr.space/parse/image';

function cleanOcrText(rawText: string): string {
  const upperText = rawText.toUpperCase().trim();

  const correctOcrDigits = (suffix: string): string => {
    let corrected = '';
    for (let i = 0; i < suffix.length; i++) {
      const char = suffix[i];
      if (/[0-9]/.test(char)) {
        corrected += char;
      } else {
        const prev = i > 0 ? suffix[i - 1] : '';
        const next = i < suffix.length - 1 ? suffix[i + 1] : '';
        if (char === 'S') corrected += prev === '8' ? '9' : prev === '5' ? '6' : next === '7' ? '6' : '5';
        else if (char === 'B') corrected += '8';
        else if (char === 'O' || char === 'D' || char === 'Q') corrected += '0';
        else if (char === 'I' || char === 'T' || char === 'J' || char === 'L') corrected += '1';
        else if (char === 'Z') corrected += '2';
        else if (char === 'A') corrected += '4';
        else if (char === 'G') corrected += '6';
        else corrected += '0';
      }
    }
    return corrected;
  };

  const normalizedSpaces = upperText.replace(/[^A-Z0-9]+/g, ' ');
  const parts = normalizedSpaces.split(' ').filter((p) => p.length > 0);

  if (parts.length >= 2) {
    const part1 = parts[0];
    const suffixParts = parts.slice(1);
    const cleanSuffixParts = suffixParts.map((p) => correctOcrDigits(p));

    if (cleanSuffixParts.length === 2) {
      const s1 = cleanSuffixParts[0];
      const s2 = cleanSuffixParts[1];
      if (s1.length === 3 && s2.length === 2) return `${part1}-${s1}.${s2}`;
    }

    const combinedSuffix = cleanSuffixParts.join('');
    if (combinedSuffix.length === 5) return `${part1}-${combinedSuffix.substring(0, 3)}.${combinedSuffix.substring(3)}`;
    if (combinedSuffix.length === 4) return `${part1}-${combinedSuffix}`;
  }

  const pattern = /(\d{2}[^A-Z0-9]*[A-Z]{1,2}\d{0,2})[\s\-_.]*(\d{3}[\s\-_.]*\d{2}|\d{3,5})/g;
  const match = pattern.exec(upperText);
  if (match) {
    const p1 = match[1].replace(/[^A-Z0-9]/g, '');
    const p2 = correctOcrDigits(match[2].replace(/[^A-Z0-9]/g, ''));
    const fmt = p2.length === 5 ? `${p2.substring(0, 3)}.${p2.substring(3)}` : p2;
    return `${p1}-${fmt}`;
  }

  return upperText.replace(/[^A-Z0-9]/g, '').substring(0, 12);
}

async function recognizePlateFromImage(imageBase64: string): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('apikey', OCR_API_KEY);
    formData.append('base64Image', imageBase64);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');

    const response = await fetch(OCR_API_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error(`OCR API lỗi: ${response.status}`);

    const data = await response.json();

    if (data.IsErroredOnProcessing) {
      throw new Error(data.ErrorMessage?.[0] || 'Lỗi nhận diện OCR');
    }

    const text = data.ParsedResults?.[0]?.ParsedText || '';
    if (!text.trim()) return null;

    const cleaned = cleanOcrText(text);
    return cleaned || null;
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
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black/50 border border-white/10">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    crossOrigin="anonymous"
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
