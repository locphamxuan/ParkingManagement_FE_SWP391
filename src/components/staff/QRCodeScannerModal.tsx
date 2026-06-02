import { useState, useEffect, useRef } from 'react';
import { X, AlertCircle, Loader, Upload } from 'lucide-react';
import jsQR from 'jsqr';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

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
  title = 'Quét Mã QR',
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
            : 'Không thể truy cập camera. Vui lòng cấp quyền truy cập.';
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          if (!canvasRef.current) return;
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          if (!context) return;

          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code && code.data) {
            setScannedCode(code.data);
            setTimeout(() => {
              onScanSuccess(code.data);
            }, 300);
          } else {
            setError('Không tìm thấy mã QR trong ảnh. Vui lòng thử ảnh khác.');
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi xử lý ảnh');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setUseCamera(true)}
            className={`pb-2 px-4 font-medium transition-colors ${
              useCamera
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📷 Quét Camera
          </button>
          <button
            onClick={() => setUseCamera(false)}
            className={`pb-2 px-4 font-medium transition-colors ${
              !useCamera
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📁 Upload Ảnh
          </button>
        </div>

        {/* Camera Preview - only show when camera tab is active */}
        {useCamera && (
        <div className="mb-4 relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-80 object-cover"
            autoPlay
            playsInline
            muted
            crossOrigin="anonymous"
          />

          {/* Scanning overlay */}
          {isScanning && !scannedCode && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="w-48 h-48 border-2 border-green-500 rounded-lg">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-green-500"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-green-500"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-green-500"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-green-500"></div>
              </div>
            </div>
          )}

          {/* Success checkmark */}
          {scannedCode && (
            <div className="absolute inset-0 flex items-center justify-center bg-green-500/30">
              <div className="w-24 h-24 rounded-full bg-green-500/50 flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>
        )}

        {/* Upload section - only show when upload tab is active */}
        {!useCamera && (
          <div className="mb-4 p-4 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 flex flex-col items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100/50 rounded transition-colors"
            >
              <Upload size={24} />
              <span className="font-medium">Nhấp để chọn ảnh QR Code</span>
              <span className="text-xs text-gray-500">hoặc kéo thả ảnh vào đây</span>
            </button>
          </div>
        )}

        {/* Scanned data display */}
        {scannedCode && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-600 font-medium">✓ Quét thành công</p>
            <p className="text-sm font-mono text-green-900 mt-1 break-all">{scannedCode}</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
            <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Scanning status */}
        {isScanning && !scannedCode && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-600 font-medium">🎥 Đang quét QR code...</p>
            <p className="text-xs text-blue-600 mt-1">
              Hướng camera vào mã QR để bắt đầu quét
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {scannedCode ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleRetry}
                disabled={loading}
                className="flex-1"
              >
                Quét lại
              </Button>
              <Button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận'}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isScanning || loading}
              className="w-full"
            >
              Đóng
            </Button>
          )}
        </div>

        {/* Info */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          💡 Cho phép truy cập camera để sử dụng tính năng này
        </p>
        
        {/* Hidden canvas for QR parsing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </Modal>
  );
}
