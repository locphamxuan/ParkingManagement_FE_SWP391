import { useEffect, useState } from 'react';
import { X, Loader, Copy, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface PaymentQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode?: string; // base64 image
  checkoutUrl?: string;
  orderCode?: number;
  amount?: number;
  plateNumber?: string;
  onPaymentSuccess?: () => void;
  onCheckStatus?: (orderCode: number) => Promise<{ status: string; settled: boolean }>;
}

export function PaymentQRModal({
  isOpen,
  onClose,
  qrCode,
  checkoutUrl,
  orderCode,
  amount,
  plateNumber,
  onPaymentSuccess,
  onCheckStatus,
}: PaymentQRModalProps) {
  const [status, setStatus] = useState<'pending' | 'success' | 'timeout'>('pending');
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const maxPolls = 60; // Poll max 60 times (30 seconds with 500ms interval)

  // Auto-poll status
  useEffect(() => {
    if (!isOpen || status !== 'pending' || !orderCode || !onCheckStatus) return;

    const interval = setInterval(async () => {
      setCheckingStatus(true);
      setPollCount((prev) => prev + 1);

      try {
        const result = await onCheckStatus(orderCode);
        if (result.status === 'success' || result.settled) {
          setStatus('success');
          onPaymentSuccess?.();
        }
      } catch (err) {
        // Silent fail - keep polling
      } finally {
        setCheckingStatus(false);
      }

      if (pollCount >= maxPolls) {
        setStatus('timeout');
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isOpen, status, orderCode, onCheckStatus, pollCount, onPaymentSuccess]);

  const handleCopyUrl = () => {
    if (checkoutUrl) {
      navigator.clipboard.writeText(checkoutUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenWeb = () => {
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
    }
  };

  const handleCheckNow = async () => {
    if (!orderCode || !onCheckStatus) return;
    setCheckingStatus(true);
    try {
      const result = await onCheckStatus(orderCode);
      if (result.status === 'success' || result.settled) {
        setStatus('success');
        onPaymentSuccess?.();
      }
    } catch (err) {
      // Silent fail
    } finally {
      setCheckingStatus(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Thanh toán QR - PayOS</h2>
          <button
            onClick={onClose}
            disabled={status === 'pending' && checkingStatus}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status */}
        {status === 'success' && (
          <div className="mb-4 rounded-lg border border-green-500 bg-green-50 p-4 text-center">
            <CheckCircle2 size={40} className="mx-auto mb-2 text-green-600" />
            <p className="text-sm font-semibold text-green-700">✓ Thanh toán thành công!</p>
            <p className="text-xs text-green-600 mt-1">Khách hàng đã xác nhận thanh toán</p>
          </div>
        )}

        {status === 'timeout' && (
          <div className="mb-4 rounded-lg border border-yellow-500 bg-yellow-50 p-4 text-center">
            <Clock size={40} className="mx-auto mb-2 text-yellow-600" />
            <p className="text-sm font-semibold text-yellow-700">⏱️ Chưa nhận được xác nhận</p>
            <p className="text-xs text-yellow-600 mt-1">Kiểm tra lại hoặc chọn phương thức khác</p>
          </div>
        )}

        {/* Info */}
        <div className="mb-4 space-y-2 rounded-lg bg-muted/50 p-3">
          {plateNumber && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Biển số:</span>
              <span className="font-semibold">{plateNumber}</span>
            </div>
          )}
          {amount && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Số tiền:</span>
              <span className="font-semibold text-emerald-600">
                {amount.toLocaleString('vi-VN')} đ
              </span>
            </div>
          )}
          {orderCode && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Mã đơn:</span>
              <span className="text-xs font-mono text-muted-foreground">{orderCode}</span>
            </div>
          )}
        </div>

        {/* QR Code */}
        {status === 'pending' && qrCode && (
          <div className="mb-4 flex flex-col items-center gap-3">
            <img
              src={`data:image/png;base64,${qrCode}`}
              alt="QR Code"
              className="h-48 w-48 rounded-lg border border-border"
            />
            <p className="text-center text-xs text-muted-foreground">
              Quét mã QR để thanh toán trực tiếp
            </p>
          </div>
        )}

        {/* Polling indicator */}
        {status === 'pending' && (
          <div className="mb-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader size={14} className="animate-spin" />
            Đang chờ xác nhận thanh toán... ({pollCount}/{maxPolls})
          </div>
        )}

        {/* Actions */}
        <div className="grid gap-2">
          {status === 'pending' && (
            <>
              <Button
                onClick={handleOpenWeb}
                variant="outline"
                className="gap-2"
                disabled={!checkoutUrl}
              >
                🌐 Mở liên kết thanh toán
              </Button>

              <Button
                onClick={handleCopyUrl}
                variant="outline"
                className="gap-2"
                disabled={!checkoutUrl}
              >
                {copied ? (
                  <>
                    <CheckCircle2 size={16} />
                    Đã copy
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy URL
                  </>
                )}
              </Button>

              <Button
                onClick={handleCheckNow}
                variant="outline"
                className="gap-2"
                disabled={checkingStatus}
              >
                {checkingStatus && <Loader size={16} className="animate-spin" />}
                Kiểm tra lại
              </Button>
            </>
          )}

          {(status === 'success' || status === 'timeout') && (
            <Button onClick={onClose} className="w-full">
              {status === 'success' ? 'Đóng & Tiếp tục' : 'Chọn phương thức khác'}
            </Button>
          )}
        </div>

        {/* Help text */}
        {status === 'pending' && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
            <AlertCircle size={14} className="mb-1 inline mr-1" />
            Khách có thể quét QR hoặc click vào liên kết để thanh toán. Chúng tôi sẽ tự động cập nhật trạng thái.
          </div>
        )}
      </div>
    </Modal>
  );
}
