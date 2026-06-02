import { useState } from 'react';
import { X, Loader, AlertCircle, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import type { ParkingSession } from '@/services/staff/staffApi';

interface SessionCheckOutModalProps {
  isOpen: boolean;
  session: ParkingSession | null;
  onClose: () => void;
  onSubmit: (paymentMethod: string, options?: any) => Promise<void>;
  onInitiatePayment?: (sessionId: string) => Promise<any>;
  loading?: boolean;
}

const fmt = (n: number | null | undefined) =>
  n != null ? `${n.toLocaleString('vi-VN')} đ` : '—';

const fmtTime = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleString('vi-VN') : '—';

export function SessionCheckOutModal({
  isOpen,
  session,
  onClose,
  onSubmit,
  onInitiatePayment,
  loading = false,
}: SessionCheckOutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet' | 'qr'>('cash');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!session) return;

    try {
      if (paymentMethod === 'qr' && onInitiatePayment) {
        // For QR, just initiate and let parent handle modal display
        await onInitiatePayment(session._id);
      } else {
        await onSubmit(paymentMethod);
        setPaymentMethod('cash');
        onClose();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Lỗi check-out xe'
      );
    }
  };

  if (!session) return null;

  const entryTimeMs = session.entryTime ? new Date(session.entryTime).getTime() : null;
  const exitTimeMs = session.exitTime ? new Date(session.exitTime).getTime() : Date.now();
  const durationMs = entryTimeMs ? exitTimeMs - entryTimeMs : 0;
  const durationMinutes = Math.floor(durationMs / (1000 * 60));
  const durationHours = Math.floor(durationMinutes / 60);
  const remainingMinutes = durationMinutes % 60;
  
  const walletBalance = session.vehicleType ? 0 : undefined; // TODO: get from lookupPlate

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Check-out Xe</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Session Info */}
        <div className="mb-6 space-y-3 rounded-lg bg-muted/50 p-4">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Biển số:</span>
            <span className="font-semibold text-foreground">{session.plateNumber}</span>
          </div>
          
          {session.vehicleType && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Loại xe:</span>
              <span className="text-sm text-foreground">{session.vehicleType.name}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Vào:</span>
            <span className="text-sm text-foreground">{fmtTime(session.entryTime)}</span>
          </div>

          {durationMinutes > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Thời gian:</span>
              <span className="text-sm text-foreground">
                {durationHours} giờ {remainingMinutes} phút
              </span>
            </div>
          )}

          <div className="border-t border-border pt-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-foreground">Phí:</span>
              <span className="text-lg font-semibold text-emerald-600">
                {fmt(session.fee)}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Phương thức thanh toán */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">
              Phương thức thanh toán
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'wallet', 'qr'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  disabled={loading}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-all ${
                    paymentMethod === method
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-card text-foreground hover:border-primary'
                  }`}
                >
                  {method === 'cash' && '💵 Tiền mặt'}
                  {method === 'wallet' && '💳 Ví'}
                  {method === 'qr' && '📱 QR Code'}
                </button>
              ))}
            </div>
          </div>

          {/* Info per payment method */}
          {paymentMethod === 'cash' && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              ✓ Khách thanh toán bằng tiền mặt tại cửa hàng
            </div>
          )}

          {paymentMethod === 'wallet' && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
              ✓ Trừ tiền từ ví của khách hàng
            </div>
          )}

          {paymentMethod === 'qr' && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm text-purple-700">
              📱 Tạo mã QR PayOS để khách quét thanh toán
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200 flex gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 gap-2"
            >
              {loading && <Loader size={16} className="animate-spin" />}
              {paymentMethod === 'qr' && !loading ? (
                <>
                  <QrCode size={16} />
                  Tạo QR
                </>
              ) : loading ? (
                'Đang xử lý...'
              ) : (
                'Xác nhận Check-out'
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
