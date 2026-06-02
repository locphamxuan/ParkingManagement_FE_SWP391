import { useCallback, useState } from 'react';
import { Plus, LogOut, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { useStaffSessions } from '@/hooks/staff/useStaffSessions';
import { SessionCheckInModal } from '@/components/staff/SessionCheckInModal';
import { SessionCheckOutModal } from '@/components/staff/SessionCheckOutModal';
import { PaymentQRModal } from '@/components/staff/PaymentQRModal';
import { IncidentReportForm } from '@/components/staff/IncidentReportForm';
import { staffApi, type ParkingSession, type PaymentData } from '@/services/staff/staffApi';

const fmt = (n: number | null | undefined) =>
  n != null ? `${n.toLocaleString('vi-VN')} đ` : '—';

const fmtTime = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleString('vi-VN') : '—';

export function StaffSessionsPage() {
  const { buildingId } = useBuildingContext();
  const {
    sessions,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    checkIn,
    checkOut,
    lookupPlate,
    lookupUser,
    initiatePayment,
    getPaymentStatus,
    refresh,
  } = useStaffSessions({ buildingId });

  // Modal states
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showPaymentQRModal, setShowPaymentQRModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ParkingSession | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isCheckInLoading, setIsCheckInLoading] = useState(false);
  const [isCheckOutLoading, setIsCheckOutLoading] = useState(false);
  const [isIncidentLoading, setIsIncidentLoading] = useState(false);

  const handleCheckIn = async (
    plateNumber: string,
    vehicleType?: string,
    gate?: string,
    forceCheckIn?: boolean
  ) => {
    setIsCheckInLoading(true);
    try {
      await checkIn(plateNumber, vehicleType, gate, forceCheckIn);
    } finally {
      setIsCheckInLoading(false);
    }
  };

  const handleCheckOut = async (paymentMethod: string) => {
    if (!selectedSession) return;
    setIsCheckOutLoading(true);
    try {
      if (paymentMethod === 'cash' || paymentMethod === 'wallet') {
        // Thực hiện check-out ngay
        await checkOut(selectedSession._id, paymentMethod);
        setShowCheckOutModal(false);
        setSelectedSession(null);
      }
      // QR sẽ xử lý ở handleInitiatePayment
    } finally {
      setIsCheckOutLoading(false);
    }
  };

  const handleInitiatePayment = async (sessionId: string) => {
    setIsCheckOutLoading(true);
    try {
      const data = await initiatePayment(sessionId);
      setPaymentData(data);
      setShowCheckOutModal(false);
      setShowPaymentQRModal(true);
    } catch (err) {
      // Error handled in hook
    } finally {
      setIsCheckOutLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!selectedSession) return;
    // Complete checkout with QR payment method
    try {
      await checkOut(selectedSession._id, 'qr');
      setShowPaymentQRModal(false);
      setSelectedSession(null);
      setPaymentData(null);
    } catch (err) {
      // Error handled
    }
  };

  const handleIncidentReport = async (data: {
    incidentType: string;
    parkingSessionId: string;
    penaltyFee: number;
    paymentMethod: 'cash' | 'wallet' | 'qr';
    description?: string;
  }) => {
    setIsIncidentLoading(true);
    try {
      await staffApi.incidents(data);
      await refresh();
    } finally {
      setIsIncidentLoading(false);
    }
  };

  const handleCheckOutClick = (session: ParkingSession) => {
    setSelectedSession(session);
    setShowCheckOutModal(true);
  };

  const handleIncidentClick = (session: ParkingSession) => {
    setSelectedSession(session);
    setShowIncidentModal(true);
  };

  const columns: DataColumn<ParkingSession>[] = [
    { key: 'plateNumber', title: 'Biển số' },
    {
      key: 'vehicleType',
      title: 'Loại xe',
      render: (row) =>
        row.vehicleType ? `${row.vehicleType.name} (${row.vehicleType.code})` : '—',
    },
    { key: 'gate', title: 'Cổng', render: (row) => row.entryGate?.name ?? '—' },
    { key: 'checkIn', title: 'Vào', render: (row) => fmtTime(row.entryTime) },
    { key: 'checkOut', title: 'Ra', render: (row) => fmtTime(row.exitTime) },
    { key: 'fee', title: 'Phí', render: (row) => fmt(row.fee) },
    {
      key: 'paymentMethod',
      title: 'Phương thức',
      render: (row) => row.paymentMethod?.toUpperCase() ?? '—',
    },
    {
      key: 'paymentStatus',
      title: 'Thanh toán',
      render: (row) => {
        const pStatus =
          row.status === 'completed'
            ? 'success'
            : row.status === 'cancelled'
            ? 'inactive'
            : 'pending';
        return <StatusBadge status={pStatus} />;
      },
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      title: 'Hành động',
      render: (row) => (
        <div className="flex gap-2">
          {row.status === 'active' && !row.exitTime && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCheckOutClick(row)}
                className="gap-1 text-xs h-8"
              >
                <LogOut size={14} />
                Check-out
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleIncidentClick(row)}
                className="gap-1 text-xs h-8"
              >
                <AlertCircle size={14} />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      {/* Header với nút Check-in */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3">
        {/* Status filter */}
        <div className="grid gap-1">
          <label className="text-xs uppercase text-muted-foreground">Trạng thái</label>
          <select
            className="h-9 rounded-md border border-border bg-card px-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>

        {/* Check-in button */}
        <Button
          onClick={() => setShowCheckInModal(true)}
          className="gap-2 h-9"
        >
          <Plus size={16} />
          Check-in
        </Button>

        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            className="h-9"
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-sm text-muted-foreground">Đang tải...</div>
      ) : error ? (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
          {error}
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Không có phiên gửi xe nào.
          </CardContent>
        </Card>
      ) : (
        <DataTable title={`Phiên gửi xe (${sessions.length})`} rows={sessions} columns={columns} />
      )}

      {/* Modals */}
      <SessionCheckInModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        onSubmit={handleCheckIn}
        onLookup={lookupPlate}
        onLookupUser={lookupUser}
        loading={isCheckInLoading}
      />

      <SessionCheckOutModal
        isOpen={showCheckOutModal}
        session={selectedSession}
        onClose={() => {
          setShowCheckOutModal(false);
          setSelectedSession(null);
        }}
        onSubmit={handleCheckOut}
        onInitiatePayment={handleInitiatePayment}
        loading={isCheckOutLoading}
      />

      <PaymentQRModal
        isOpen={showPaymentQRModal}
        onClose={() => {
          setShowPaymentQRModal(false);
          setPaymentData(null);
          setSelectedSession(null);
        }}
        qrCode={paymentData?.qrCode}
        checkoutUrl={paymentData?.checkoutUrl}
        orderCode={paymentData?.orderCode}
        amount={paymentData?.amount}
        plateNumber={paymentData?.plateNumber}
        onPaymentSuccess={handlePaymentSuccess}
        onCheckStatus={getPaymentStatus}
      />

      <IncidentReportForm
        isOpen={showIncidentModal}
        session={selectedSession}
        onClose={() => {
          setShowIncidentModal(false);
          setSelectedSession(null);
        }}
        onSubmit={handleIncidentReport}
        loading={isIncidentLoading}
      />
    </div>
  );
}
