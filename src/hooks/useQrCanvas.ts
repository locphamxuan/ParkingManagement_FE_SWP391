import { useCallback, useEffect, useRef } from 'react';
import QRCode from 'qrcode';

/**
 * Vẽ một token vào <canvas> và cho phép tải xuống PNG.
 *
 * Tách ra vì mọi màn QR đều cần đúng một bộ tham số: mức sửa lỗi 'H' (mã vẫn đọc
 * được khi ảnh bị che/mờ) và đen trên nền trắng — lệch bộ này thì máy quét ở cổng
 * đọc được mã của màn này mà không đọc được mã của màn kia.
 */
export function useQrCanvas(value: string, enabled = true) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!enabled || !canvasRef.current || !value) return;
    QRCode.toCanvas(
      canvasRef.current,
      value,
      {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 280,
        color: { dark: '#0f172a', light: '#ffffff' },
      },
      () => undefined
    );
  }, [value, enabled]);

  const download = useCallback((fileName: string) => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.href = canvasRef.current.toDataURL('image/png');
    link.download = fileName;
    link.click();
  }, []);

  return { canvasRef, download };
}
