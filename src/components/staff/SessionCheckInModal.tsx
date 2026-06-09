import { useState, useEffect } from 'react';
import { X, Loader, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { AIAutoScanZone } from './AIAutoScanZone';
import { CameraModal, type ScanResult } from './CameraModal';
import { QRCodeScannerModal } from './QRCodeScannerModal';
import { staffApi, type PlateInfo } from '@/services/staff/staffApi';

interface SessionCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (plateNumber: string, vehicleType?: string, gate?: string, forceCheckIn?: boolean) => Promise<void>;
  onLookup?: (plate: string) => Promise<PlateInfo>;
  onLookupUser?: (qrCode: string) => Promise<PlateInfo>;
  loading?: boolean;
}

export function SessionCheckInModal({
  isOpen,
  onClose,
  onSubmit,
  onLookup,
  onLookupUser,
  loading = false,
}: SessionCheckInModalProps) {
  const [scanMode, setScanMode] = useState<'plate' | 'qr'>('plate');
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [gate, setGate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lookupData, setLookupData] = useState<PlateInfo | null>(null);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [forceCheckIn, setForceCheckIn] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isAIScanning, setIsAIScanning] = useState(false);
  const [showQRConfirmation, setShowQRConfirmation] = useState(false);
  const [tempQRData, setTempQRData] = useState<PlateInfo | null>(null);

  // Lookup plate khi user nhập
  const handlePlateChange = async (value: string) => {
    const upperValue = value.toUpperCase();
    setPlateNumber(upperValue);
    setError(null);
    setForceCheckIn(false);

    if (upperValue.length >= 4 && onLookup) {
      setLookingUp(true);
      try {
        const data = await onLookup(upperValue);
        setLookupData(data);
        setHasActiveSession(!!data.activeSession);
      } catch (err) {
        // Silent fail - not critical
      } finally {
        setLookingUp(false);
      }
    } else {
      setLookupData(null);
      setHasActiveSession(false);
    }
  };

  // Reset khi modal mở
  useEffect(() => {
    if (!isOpen) {
      setPlateNumber('');
      setVehicleType('');
      setGate('');
      setError(null);
      setLookupData(null);
      setHasActiveSession(false);
      setForceCheckIn(false);
      setShowCameraModal(false);
      setShowQRModal(false);
      setShowQRConfirmation(false);
      setTempQRData(null);
      setIsAIScanning(false);
      setScanMode('plate');
    }
  }, [isOpen]);

  // Handle AI plate detection
  const handleAIPlateDetected = async (result: ScanResult) => {
    const plate = result.plateNumber;
    setPlateNumber(plate);
    setIsAIScanning(false);

    if (!plate) return;

    // Auto-lookup plate info
    if (onLookup) {
      setLookingUp(true);
      try {
        const data = await onLookup(plate);
        setLookupData(data);
        setHasActiveSession(!!data.activeSession);
        setError(null);
      } catch (err) {
        // Silent fail
      } finally {
        setLookingUp(false);
      }
    }
  };

  // Handle QR code scanning
  const handleQRScanned = async (qrCode: string) => {
    setError(null);
    setLookingUp(true);

    try {
      // QR code lookup using dedicated endpoint
      if (onLookupUser) {
        const data = await onLookupUser(qrCode);

        // Show confirmation popup with user info
        if (data?.plateNumber) {
          setTempQRData(data);
          setShowQRModal(false);
          setShowQRConfirmation(true);
        } else if (data?.user && !data.plateNumber) {
          // User found but no license plate registered
          setError(`❌ Tài khoản "${data.user?.fullName}" không có biển số xe nào đăng ký`);
          setShowQRConfirmation(false);
        } else {
          setError('QR code không hợp lệ hoặc không liên kết với tài khoản nào');
          setShowQRConfirmation(false);
        }
      } else {
        setError('Không thể lookup thông tin từ QR code');
        setShowQRConfirmation(false);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Không thể xử lý mã QR. Vui lòng thử lại.';
      setError(message);
      setShowQRConfirmation(false);
    } finally {
      setLookingUp(false);
    }
  };

  // Confirm QR scan result
  const handleQRConfirm = () => {
    if (tempQRData?.plateNumber) {
      setPlateNumber(tempQRData.plateNumber);
      setLookupData(tempQRData);
      setHasActiveSession(!!tempQRData.activeSession);
      setShowQRConfirmation(false);
      setTempQRData(null);
    }
  };

  // Cancel QR scan
  const handleQRCancel = () => {
    setShowQRConfirmation(false);
    setTempQRData(null);
    setShowQRModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!plateNumber.trim()) {
      setError('Vui lòng nhập biển số xe');
      return;
    }

    if (hasActiveSession && !forceCheckIn) {
      setError('⚠️ Xe này đã có session đang hoạt động! Đánh dấu checkbox để bắt buộc check-in.');
      return;
    }

    try {
      await onSubmit(
        plateNumber.trim().toUpperCase(),
        vehicleType || undefined,
        gate || undefined,
        hasActiveSession ? forceCheckIn : undefined
      );
      
      // Reset form
      setPlateNumber('');
      setVehicleType('');
      setGate('');
      setLookupData(null);
      setHasActiveSession(false);
      setForceCheckIn(false);
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

        {/* Tabs */}
        <div className="mb-4 flex gap-2 border-b border-border">
          <button
            onClick={() => setScanMode('plate')}
            className={`flex-1 py-2 px-3 text-sm font-medium border-b-2 transition-colors ${
              scanMode === 'plate'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            📸 Biển số
          </button>
          <button
            onClick={() => setScanMode('qr')}
            className={`flex-1 py-2 px-3 text-sm font-medium border-b-2 transition-colors ${
              scanMode === 'qr'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            🔲 QR Code
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* License Plate Mode */}
          {scanMode === 'plate' && (
            <>
              {/* AI Auto-Scan Zone */}
              <AIAutoScanZone
                onPlateDetected={handleAIPlateDetected}
                onCameraOpen={() => setShowCameraModal(true)}
                isScanning={isAIScanning}
              />

              {/* Biển số */}
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">
                  Biển số xe <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="VD: 29C12345"
                    value={plateNumber}
                    onChange={(e) => handlePlateChange(e.target.value)}
                    disabled={loading}
                    className="flex-1 uppercase"
                    autoFocus
                  />
                  {lookingUp && <Loader size={20} className="animate-spin text-blue-500 flex-shrink-0" />}
                </div>
              </div>
            </>
          )}

          {/* QR Code Mode */}
          {scanMode === 'qr' && (
            <>
              <div className="text-center py-6">
                <div className="text-5xl mb-3">🔲</div>
                <p className="text-sm text-foreground font-medium mb-2">Quét mã QR của khách hàng</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Nhấn nút bên dưới để quét mã QR hoặc nhập thủ công
                </p>
                <Button
                  type="button"
                  onClick={() => setShowQRModal(true)}
                  disabled={loading || lookingUp}
                  className="w-full mb-3 gap-2"
                >
                  {lookingUp ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>📱 Quét QR Code</>
                  )}
                </Button>
              </div>

              {/* Manual QR input */}
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground text-xs">
                  Hoặc nhập QR code thủ công (tùy chọn)
                </label>
                <Input
                  type="text"
                  placeholder="Dán hoặc gõ QR code ở đây"
                  onPaste={(e) => {
                    const text = e.clipboardData?.getData('text') || '';
                    if (text) {
                      handleQRScanned(text);
                    }
                  }}
                  disabled={loading || lookingUp}
                  className="text-xs"
                />
              </div>
            </>
          )}

          {/* Warning nếu xe đã có session */}
          {hasActiveSession && lookupData?.activeSession && (
            <div className="rounded-lg border border-yellow-500 bg-yellow-50 p-3">
              <div className="flex gap-2">
                <AlertCircle size={18} className="text-yellow-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-700">⚠️ Cảnh báo: Xe đã trong bãi</p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Vào lúc: {new Date(lookupData.activeSession.entryTime).toLocaleString('vi-VN')}
                  </p>
                  <label className="mt-2 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={forceCheckIn}
                      onChange={(e) => setForceCheckIn(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-xs text-yellow-700">Bắt buộc check-in lại (bypass cảnh báo)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* User info nếu có tài khoản */}
          {lookupData?.user && !hasActiveSession && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm font-semibold text-blue-900">👤 Khách hàng: {lookupData.user.fullName}</p>
              <p className="text-xs text-blue-700 mt-1">📧 {lookupData.user.email}</p>
              <p className="text-xs text-blue-700">💳 Ví: {(lookupData.user.walletBalance / 1000).toFixed(0)}k đ</p>
            </div>
          )}

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
              disabled={loading || !plateNumber.trim() || (hasActiveSession && !forceCheckIn)}
              className="flex-1 gap-2"
            >
              {loading && <Loader size={16} className="animate-spin" />}
              {loading ? 'Đang xử lý...' : 'Check-in'}
            </Button>
          </div>
        </form>
      </div>

      {/* Camera Modal */}
      <CameraModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={handleAIPlateDetected}
      />

      {/* QR Scanner Modal */}
      <QRCodeScannerModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        onScanSuccess={handleQRScanned}
        loading={lookingUp}
      />

      {/* QR Confirmation Popup */}
      {showQRConfirmation && tempQRData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white">✓ Quét QR Thành Công</h3>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Plate Number */}
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Biển Số Xe</p>
                <p className="text-2xl font-bold text-blue-600 font-mono">{tempQRData.plateNumber}</p>
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-200" />

              {/* User Info */}
              {tempQRData.user ? (
                <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Khách Hàng</p>
                    <p className="text-sm font-semibold text-gray-900">{tempQRData.user.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm text-gray-700">{tempQRData.user.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Ví Điều Hành</p>
                    <p className="text-sm font-semibold text-blue-600">
                      {(tempQRData.user.walletBalance / 1000).toFixed(1)}k đ
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-yellow-700">ℹ️ Khách hàng chưa đăng ký tài khoản</p>
                </div>
              )}

              {/* Active Session Warning */}
              {tempQRData.activeSession && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-red-700 mb-1">⚠️ Xe Đang Có Session</p>
                  <p className="text-xs text-red-600">
                    Vào lúc: {new Date(tempQRData.activeSession.entryTime).toLocaleString('vi-VN')}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex gap-3">
              <button
                onClick={handleQRCancel}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
              >
                Quét Lại
              </button>
              <button
                onClick={handleQRConfirm}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
              >
                Xác Nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
