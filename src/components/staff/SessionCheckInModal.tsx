import { useState } from 'react';
import { X, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

interface SessionCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (plateNumber: string, vehicleType?: string, gate?: string) => Promise<void>;
  loading?: boolean;
}

export function SessionCheckInModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}: SessionCheckInModalProps) {
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [gate, setGate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!plateNumber.trim()) {
      setError('Vui lòng nhập biển số xe');
      return;
    }

    try {
      await onSubmit(
        plateNumber.trim().toUpperCase(),
        vehicleType || undefined,
        gate || undefined
      );
      
      // Reset form
      setPlateNumber('');
      setVehicleType('');
      setGate('');
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Lỗi check-in xe'
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Check-in Xe</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Biển số */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">
              Biển số xe <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="VD: 29C12345"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              disabled={loading}
              className="uppercase"
              autoFocus
            />
          </div>

          {/* Loại xe */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">
              Loại xe (tùy chọn)
            </label>
            <Input
              type="text"
              placeholder="VD: Ô tô, Xe máy"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Cổng */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">
              Cổng (tùy chọn)
            </label>
            <Input
              type="text"
              placeholder="VD: Cổng vào 1"
              value={gate}
              onChange={(e) => setGate(e.target.value)}
              disabled={loading}
            />
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
              disabled={loading || !plateNumber.trim()}
              className="flex-1 gap-2"
            >
              {loading && <Loader size={16} className="animate-spin" />}
              {loading ? 'Đang xử lý...' : 'Check-in'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
