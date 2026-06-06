import { useState } from 'react';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface AIAutoScanZoneProps {
  onPlateDetected: (plate: string) => void;
  onCameraOpen: () => void;
  isScanning?: boolean;
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
      const plate = await recognizePlateFromImage(`data:${file.type};base64,${base64}`);

      if (plate) {
        setSuccess(`✓ Phát hiện biển số: ${plate}`);
        setTimeout(() => {
          onPlateDetected(plate);
          setSuccess(null);
        }, 500);
      } else {
        setError('Không thể phát hiện biển số từ ảnh. Vui lòng thử lại.');
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

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl border-2 border-dashed p-6 transition-all duration-300 ${
        isDragging
          ? 'border-orange-400 bg-orange-500/10'
          : 'border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-amber-500/5 backdrop-blur-md'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-orange-400 font-mono">
              🤖 AI Auto-Scan Zone
            </p>
            <p className="text-xs text-slate-400 mt-1 font-semibold">
              Quét biển số xe thông minh bằng AI
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap">
          {/* Camera Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCameraOpen}
            disabled={isScanning || isProcessing}
            className="flex-1 min-w-[200px] px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500/80 to-amber-500/80 hover:from-orange-500 hover:to-amber-500 text-white font-black text-sm uppercase tracking-wider transition-all duration-300 border border-orange-400/50 hover:border-orange-300 shadow-lg hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isScanning ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Camera size={16} className="stroke-[2.5]" />
                📷 Quét WebCam Trực Tiếp
              </>
            )}
          </motion.button>

          {/* Upload Button */}
          <motion.label
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 min-w-[200px] px-4 py-3 rounded-xl border-2 border-slate-400/30 hover:border-slate-300 text-slate-300 hover:text-white font-black text-sm uppercase tracking-wider transition-all duration-300 shadow-lg cursor-pointer inline-flex items-center justify-center gap-2 bg-slate-900/20 hover:bg-slate-900/40 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Upload size={16} className="stroke-[2.5]" />
                📁 Tải Lên Ảnh Biển Số
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isScanning || isProcessing}
              className="hidden"
            />
          </motion.label>
        </div>

        {/* Drag and drop hint */}
        <p className="text-xs text-slate-500 font-semibold text-center">
          💡 Hoặc kéo & thả ảnh biển số vào đây
        </p>

        {/* Status Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 font-semibold"
          >
            ❌ {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 font-semibold"
          >
            {success}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
