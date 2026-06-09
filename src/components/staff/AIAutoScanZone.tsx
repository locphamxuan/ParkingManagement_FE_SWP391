import { useState } from 'react';
import { Camera, Upload, Loader2, ScanLine, AlertCircle, CheckCircle2 } from 'lucide-react';
import { staffApi } from '@/services/staff/staffApi';
import type { ScanResult } from '@/components/staff/CameraModal';

interface AIAutoScanZoneProps {
  onPlateDetected: (result: ScanResult) => void;
  onCameraOpen: () => void;
  isScanning?: boolean;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function AIAutoScanZone({
  onPlateDetected,
  onCameraOpen,
  isScanning = false,
}: AIAutoScanZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (file: File) => {
    try {
      setError(null);
      setSuccess(null);
      setIsProcessing(true);

      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn file ảnh');
        return;
      }

      const base64 = await fileToBase64(file);
      const res = await staffApi.scanVehicle(base64);
      const data = (res as { data?: { plateNumber?: string; brand?: string | null } })?.data;
      const plateNumber = data?.plateNumber || '';
      const brand = data?.brand ?? null;

      if (plateNumber) {
        setSuccess(`Biển số: ${plateNumber}${brand ? ` · ${brand}` : ''}`);
        setTimeout(() => {
          onPlateDetected({ plateNumber, brand });
          setSuccess(null);
        }, 500);
      } else {
        setError('Không đọc được biển số — hãy dùng Camera QR (Camera 2) để nhận diện.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi xử lý ảnh');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const busy = isScanning || isProcessing;

  return (
    <div
      className={`rounded-xl border border-dashed p-4 transition-colors ${
        isDragging ? 'border-primary bg-primary/5' : 'border-border bg-card/40'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <ScanLine size={15} className="text-primary" />
          <p className="text-sm font-semibold text-foreground">Camera 1 · Quét biển số</p>
        </div>

        {/* Action Buttons */}
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCameraOpen}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isScanning ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
            Quét webcam
          </button>

          <label className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/40 cursor-pointer disabled:opacity-60">
            {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            Tải ảnh lên
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={busy}
              className="hidden"
            />
          </label>
        </div>

        <p className="text-[11px] text-muted-foreground text-center">
          Hoặc kéo &amp; thả ảnh biển số vào đây
        </p>

        {/* Status messages */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-400">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-400">
            <CheckCircle2 size={14} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}
      </div>
    </div>
  );
}
