import { useState } from 'react';
import { X, Loader, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import type { ParkingSession } from '@/services/staff/staffApi';

interface IncidentReportFormProps {
  isOpen: boolean;
  session: ParkingSession | null;
  onClose: () => void;
  onSubmit: (data: {
    incidentType: string;
    parkingSessionId: string;
    penaltyFee: number;
    paymentMethod: 'cash' | 'wallet' | 'qr';
    description?: string;
  }) => Promise<void>;
  loading?: boolean;
}

const INCIDENT_TYPES = [
  { id: 'damaged_slot', label: 'Chỗ đỗ bị hư hỏng' },
  { id: 'wrong_zone', label: 'Đỗ sai khu vực' },
  { id: 'overstay', label: 'Vượt quá thời gian' },
  { id: 'illegal_parking', label: 'Đỗ trái phép' },
  { id: 'damage_property', label: 'Làm hỏng tài sản' },
  { id: 'other', label: 'Khác' },
];

export function IncidentReportForm({
  isOpen,
  session,
  onClose,
  onSubmit,
  loading = false,
}: IncidentReportFormProps) {
  const [incidentType, setIncidentType] = useState('other');
  const [penaltyFee, setPenaltyFee] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet' | 'qr'>('cash');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!penaltyFee || isNaN(Number(penaltyFee)) || Number(penaltyFee) <= 0) {
      setError('Vui lòng nhập mức phạt hợp lệ (> 0)');
      return;
    }

    if (!session) {
      setError('Không có phiên gửi xe được chọn');
      return;
    }

    try {
      await onSubmit({
        incidentType,
        parkingSessionId: session._id,
        penaltyFee: Number(penaltyFee),
        paymentMethod,
        description: description || undefined,
      });

      // Reset form
      setIncidentType('other');
      setPenaltyFee('');
      setPaymentMethod('cash');
      setDescription('');
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Lỗi báo cáo sự cố'
      );
    }
  };

  if (!session) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} className="text-amber-600" />
            <h2 className="text-lg font-semibold text-foreground">Báo Cáo Sự Cố</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Session Info */}
        <div className="mb-4 flex items-center justify-between rounded-md bg-muted/50 p-3">
          <span className="text-sm text-muted-foreground">Biển số:</span>
          <span className="font-semibold text-foreground">{session.plateNumber}</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Loại sự cố */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">
              Loại sự cố <span className="text-red-500">*</span>
            </label>
            <select
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value)}
              disabled={loading}
              className="h-9 rounded-md border border-border bg-card px-3 text-sm"
            >
              {INCIDENT_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Mức phạt */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">
              Mức phạt (VND) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              placeholder="VD: 500000"
              value={penaltyFee}
              onChange={(e) => setPenaltyFee(e.target.value)}
              disabled={loading}
              min="0"
              step="10000"
            />
          </div>

          {/* Phương thức thanh toán */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">
              Phương thức thanh toán <span className="text-red-500">*</span>
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

          {/* Mô tả */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">
              Mô tả chi tiết (tùy chọn)
            </label>
            <textarea
              placeholder="Nhập mô tả chi tiết về sự cố..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
              className="rounded-md border border-border bg-card px-3 py-2 text-sm resize-none"
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
              disabled={loading || !penaltyFee}
              className="flex-1 gap-2"
            >
              {loading && <Loader size={16} className="animate-spin" />}
              {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
