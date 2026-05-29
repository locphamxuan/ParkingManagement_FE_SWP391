import { useState } from 'react';
import { X, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import type { ParkingSession } from '@/services/staff/staffApi';

interface SessionCheckOutModalProps {
  isOpen: boolean;
  session: ParkingSession | null;
  onClose: () => void;
  onSubmit: (paymentMethod: string) => Promise<void>;
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
  loading = false,
}: SessionCheckOutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet' | 'qr'>('cash');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await onSubmit(paymentMethod);
      setPaymentMethod('cash');
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Lỗi check-out xe'
      );
    }
  };

  if (!session) return null;

  const duration = session.duration ? Math.round(session.duration / 60) : null;

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
            <span className="text-sm text-foreground">{fmtTime(session.checkIn)}</span>
          </div>

          {duration && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Thời gian:</span>
              <span className="text-sm text-foreground">
                {duration} giờ {session.duration && (session.duration % 60)} phút
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
                  {method === 'cash' && 'Tiền mặt'}
                  {method === 'wallet' && 'Ví'}
                  {method === 'qr' && 'QR Code'}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
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
              {loading ? 'Đang xử lý...' : 'Xác nhận Check-out'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
