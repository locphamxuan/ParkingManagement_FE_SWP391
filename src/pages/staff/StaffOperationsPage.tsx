import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  RefreshCcw,
  ScanLine,
  QrCode,
  Loader2,
  AlertCircle,
  Sparkles,
  UserPlus,
  Car,
  Bike,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { staffApi, type ParkingSession } from '@/services/staff/staffApi';
import { AIAutoScanZone } from '@/components/staff/AIAutoScanZone';
import { QRCodeScannerModal } from '@/components/staff/QRCodeScannerModal';
import { CameraModal } from '@/components/staff/CameraModal';

type VehicleKind = 'car' | 'motorcycle';
type PaymentKind = 'cash' | 'bank_transfer';
type OperationMode = 'check-in' | 'check-out';

interface BankTransferState {
  orderCode: number;
  checkoutUrl: string;
  amount: number;
  plate: string;
}

const fmtTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString('vi-VN') : '—';

const fmtMoney = (n: number | null | undefined) =>
  n != null ? `${n.toLocaleString('vi-VN')} đ` : '—';

export function StaffOperationsPage() {
  const { buildingId, building } = useBuildingContext();

  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  // Form state
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleKind>('car');
  const [gate, setGate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentKind>('cash');
  const [opMessage, setOpMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [activeForm, setActiveForm] = useState<OperationMode>('check-in');

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  // Binding biển số vào tài khoản khách
  const [isBindingModalOpen, setIsBindingModalOpen] = useState(false);
  const [scannedPlateForBinding, setScannedPlateForBinding] = useState('');
  const [customerIdOrEmail, setCustomerIdOrEmail] = useState('');
  const [bindingLoading, setBindingLoading] = useState(false);
  const [bindingError, setBindingError] = useState<string | null>(null);
  const [foundCustomer, setFoundCustomer] = useState<{ id: string; fullName: string; email: string } | null>(null);
  const [plateAccountInfo, setPlateAccountInfo] = useState<{ hasAccount: boolean; user: { id: string; fullName: string; email: string } | null } | null>(null);
  const [plateToPromptBinding, setPlateToPromptBinding] = useState<string | null>(null);

  // Bank transfer modal
  const [bankTransfer, setBankTransfer] = useState<BankTransferState | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Check-in đặt chỗ trước
  const [reservationCode, setReservationCode] = useState('');

  // Both vehicle types supported by default (staff can always override)
  const allowedTypes = ['CAR', 'MOTORCYCLE'];

  const detectTypeFromPlate = (plate: string): VehicleKind => {
    const clean = plate.trim().toUpperCase();
    if (clean.length >= 3) {
      const prefix = clean.split('-')[0]?.trim() || '';
      if (prefix.length === 3) return 'car';
      if (/[A-Z]{2}$/.test(prefix)) {
        const letters = prefix.substring(2);
        return ['LD', 'DA', 'KT', 'MD'].includes(letters) ? 'car' : 'motorcycle';
      }
      if (/^\d{2}[A-Z]\d/.test(prefix)) return 'motorcycle';
    }
    return 'car';
  };

  useEffect(() => {
    const clean = plateNumber.trim().toUpperCase();
    if (clean.length >= 3) {
      const detected = detectTypeFromPlate(clean);
      if (detected === 'motorcycle' && allowedTypes.includes('MOTORCYCLE')) setVehicleType('motorcycle');
      else if (detected === 'car' && allowedTypes.includes('CAR')) setVehicleType('car');
    }
  }, [plateNumber, allowedTypes]);

  const plateTypeWarning = useMemo(() => {
    const clean = plateNumber.trim().toUpperCase();
    if (clean.length >= 3) {
      const detected = detectTypeFromPlate(clean);
      if (detected !== vehicleType) return `Cảnh báo: Biển số có vẻ là ${detected === 'car' ? 'ô tô' : 'xe máy'}, nhưng bạn chọn ${vehicleType === 'car' ? 'ô tô' : 'xe máy'}.`;
    }
    return null;
  }, [plateNumber, vehicleType]);

  const buildingSupportWarning = useMemo(() => {
    if (allowedTypes.length === 0) return null;
    const code = vehicleType === 'car' ? 'CAR' : 'MOTORCYCLE';
    if (!allowedTypes.includes(code))
      return `Tòa nhà này không hỗ trợ loại xe ${vehicleType === 'car' ? 'ô tô' : 'xe máy'}.`;
    return null;
  }, [allowedTypes, vehicleType]);

  // Tự động tra cứu chủ biển số
  useEffect(() => {
    const clean = plateNumber.trim().toUpperCase();
    if (clean.length >= 7) {
      staffApi
        .lookupPlate(clean)
        .then((res) => {
          setPlateAccountInfo((res as { data?: typeof plateAccountInfo })?.data ?? null);
        })
        .catch(() => undefined);
    } else {
      setPlateAccountInfo(null);
    }
  }, [plateNumber]);

  const handleLookupCustomer = async () => {
    if (!customerIdOrEmail.trim()) return;
    setBindingLoading(true);
    setBindingError(null);
    setFoundCustomer(null);
    try {
      const res = await staffApi.lookupUserQr(customerIdOrEmail.trim());
      const data = (res as { data?: { hasAccount?: boolean; user?: { id: string; fullName: string; email: string } } })?.data;
      if (data?.hasAccount && data.user) {
        setFoundCustomer({ id: data.user.id, fullName: data.user.fullName, email: data.user.email });
      } else {
        setBindingError('Không tìm thấy tài khoản phù hợp.');
      }
    } catch (err) {
      setBindingError(err instanceof Error ? err.message : 'Lỗi tra cứu khách hàng.');
    } finally {
      setBindingLoading(false);
    }
  };

  const handleBindPlate = async () => {
    if (!foundCustomer || !scannedPlateForBinding) return;
    setBindingLoading(true);
    setBindingError(null);
    try {
      await staffApi.addCustomerPlate(foundCustomer.id, { plateNumber: scannedPlateForBinding });
      setOpMessage({ type: 'ok', text: `Đã liên kết biển số ${scannedPlateForBinding} vào tài khoản ${foundCustomer.fullName} thành công!` });
      setPlateAccountInfo({ hasAccount: true, user: foundCustomer });
      setIsBindingModalOpen(false);
      setCustomerIdOrEmail('');
      setFoundCustomer(null);
    } catch (err) {
      setBindingError(err instanceof Error ? err.message : 'Lỗi liên kết biển số.');
    } finally {
      setBindingLoading(false);
    }
  };

  const refreshSessions = useCallback(() => {
    setLoading(true);
    staffApi
      .getActiveSessions()
      .then((res) => {
        const rows = (res as { data?: { items?: ParkingSession[] } | ParkingSession[] })?.data;
        const list = Array.isArray(rows) ? rows : ((rows as { items?: ParkingSession[] })?.items ?? []);
        setSessions(list);
        setError(null);
        setSelectedSessionId((cur) => cur || list[0]?._id || '');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Tải dữ liệu thất bại'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions, reloadTick]);

  useEffect(() => {
    if (!selectedSessionId && sessions[0]?._id) setSelectedSessionId(sessions[0]._id);
  }, [selectedSessionId, sessions]);

  const metrics = useMemo(() => [
    { label: 'Đang đỗ', value: sessions.filter((s) => s.status === 'active').length },
    { label: 'Tổng phiên', value: sessions.length },
    { label: 'Hoàn thành', value: sessions.filter((s) => s.status === 'completed').length },
  ], [sessions]);

  const selectedSession = sessions.find((s) => s._id === selectedSessionId) ?? null;
  const activeSessions = sessions.filter((s) => s.status === 'active');

  const columns: DataColumn<ParkingSession>[] = [
    { key: 'plateNumber', title: 'Biển số' },
    { key: 'vehicleType', title: 'Loại xe', render: (row) => row.vehicleType ? `${row.vehicleType.name}` : '—' },
    { key: 'slot', title: 'Tầng / Ô', render: (row) => row.slot ? `${(row.slot as { floor?: { name?: string } }).floor?.name ?? '—'} / ${row.slot.code}` : '—' },
    { key: 'entryGate', title: 'Cổng vào', render: (row) => row.entryGate?.code ?? '—' },
    { key: 'entryTime', title: 'Vào', render: (row) => fmtTime(row.entryTime) },
    { key: 'exitTime', title: 'Ra', render: (row) => fmtTime(row.exitTime) },
    { key: 'fee', title: 'Phí', render: (row) => fmtMoney(row.fee) },
    { key: 'status', title: 'Trạng thái', render: (row) => <StatusBadge status={row.status} /> },
  ];

  const onCheckIn = async () => {
    setOpMessage(null);
    const currentPlate = plateNumber.trim().toUpperCase();
    const shouldPrompt = plateAccountInfo && !plateAccountInfo.hasAccount;
    try {
      await staffApi.checkIn({
        plateNumber: currentPlate,
        vehicleType: vehicleType === 'motorcycle' ? 'motorcycle' : 'car',
        gate: gate.trim() || undefined,
        building: buildingId || undefined,
      });
      setOpMessage({ type: 'ok', text: `Đã tạo phiên gửi xe cho biển số ${currentPlate} thành công.` });
      setPlateNumber('');
      setGate('');
      setActiveForm('check-out');
      setReloadTick((n) => n + 1);
      if (shouldPrompt) setPlateToPromptBinding(currentPlate);
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Check-in thất bại' });
    }
  };

  const onCheckOut = async () => {
    if (!selectedSession) return;
    setOpMessage(null);
    try {
      if (paymentMethod === 'bank_transfer') {
        const res = await staffApi.initiateSessionPayment(selectedSession._id);
        const d = (res as unknown as { data?: { orderCode: number; checkoutUrl: string; amount: number; plateNumber?: string } })?.data;
        if (d) {
          setBankTransfer({
            orderCode: d.orderCode,
            checkoutUrl: d.checkoutUrl,
            amount: d.amount,
            plate: d.plateNumber || selectedSession.plateNumber,
          });
        }
        return;
      }
      await staffApi.checkOut(selectedSession._id, { paymentMethod });
      setOpMessage({ type: 'ok', text: 'Check-out hoàn thành.' });
      setPaymentMethod('cash');
      setReloadTick((n) => n + 1);
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Check-out thất bại' });
    }
  };

  const onVerifyBankTransfer = async () => {
    if (!bankTransfer) return;
    setVerifying(true);
    try {
      const res = await staffApi.verifySessionPayment(bankTransfer.orderCode);
      const status = (res as { data?: { status?: string } })?.data?.status;
      if (status === 'success') {
        setBankTransfer(null);
        setPaymentMethod('cash');
        setOpMessage({ type: 'ok', text: 'Đã nhận thanh toán — phiên gửi xe hoàn thành.' });
        setReloadTick((n) => n + 1);
      } else if (status === 'cancelled' || status === 'expired') {
        setBankTransfer(null);
        setOpMessage({ type: 'err', text: `Thanh toán ${status}. Vui lòng thực hiện lại.` });
      } else {
        setOpMessage({ type: 'err', text: 'Chưa nhận được thanh toán. Khách cần hoàn tất chuyển khoản.' });
      }
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Xác nhận thanh toán thất bại' });
    } finally {
      setVerifying(false);
    }
  };

  const onCheckInReservation = async () => {
    if (!reservationCode.trim()) return;
    setOpMessage(null);
    try {
      await staffApi.checkInReservation(reservationCode.trim());
      setOpMessage({ type: 'ok', text: 'Check-in đặt chỗ trước thành công.' });
      setReservationCode('');
      setReloadTick((n) => n + 1);
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Check-in đặt chỗ thất bại' });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="grid gap-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Ca vận hành</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">Check-in / Check-out</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {building ? `${building.code} · ${building.name}` : 'Chưa chọn tòa nhà'}
            </p>
          </div>
          <Button variant="secondary" onClick={refreshSessions} className="gap-2 self-start lg:self-auto">
            <RefreshCcw size={14} /> Làm mới
          </Button>
        </div>
      </section>

      {/* Metrics */}
      <section className="grid gap-3 sm:grid-cols-3">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">{m.label}</p>
              <p className="mt-3 text-3xl font-semibold text-foreground">{loading ? '–' : String(m.value)}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Main panel */}
      <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        {/* Form vận hành */}
        <Card>
          <CardHeader>
            <CardTitle>Thao tác vận hành</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Chọn chế độ */}
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => { setActiveForm('check-in'); setOpMessage(null); }}
                className={`rounded-xl border p-4 text-left transition ${activeForm === 'check-in' ? 'border-primary/40 bg-primary/10' : 'border-border bg-card hover:border-primary/20'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Check-in</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">Xe vào</p>
                  </div>
                  <ScanLine size={18} className="text-primary" />
                </div>
              </button>
              <button
                type="button"
                onClick={() => { setActiveForm('check-out'); setOpMessage(null); }}
                className={`rounded-xl border p-4 text-left transition ${activeForm === 'check-out' ? 'border-primary/40 bg-primary/10' : 'border-border bg-card hover:border-primary/20'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Check-out</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">Xe ra</p>
                  </div>
                  <CheckCircle2 size={18} className="text-primary" />
                </div>
              </button>
            </div>

            {/* Quét LPR tự động */}
            <div className="rounded-xl border border-border bg-card/50 p-4">
              <AIAutoScanZone
                onPlateDetected={(plate: string) => {
                  setPlateNumber(plate);
                  setOpMessage({ type: 'ok', text: `Nhận diện biển số: ${plate}` });
                  if (activeForm === 'check-out') {
                    const matched = sessions.find((s) => s.status === 'active' && s.plateNumber.replace(/[^A-Z0-9]/g, '') === plate.replace(/[^A-Z0-9]/g, ''));
                    if (matched) setSelectedSessionId(matched._id);
                  }
                }}
                onCameraOpen={() => setIsCameraModalOpen(true)}
              />

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {activeForm === 'check-in' ? (
                  <>
                    <div className="grid gap-1.5 md:col-span-2">
                      <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Biển số xe</label>
                      <Input
                        value={plateNumber}
                        onChange={(e) => setPlateNumber(e.target.value)}
                        placeholder="59X1-123.45"
                        onKeyDown={(e) => e.key === 'Enter' && onCheckIn()}
                      />
                      {plateNumber.trim().length >= 7 && plateAccountInfo?.hasAccount && (
                        <div className="mt-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <p className="text-xs text-emerald-400">
                            Thành viên: <strong className="text-foreground">{plateAccountInfo.user?.fullName}</strong> ({plateAccountInfo.user?.email})
                          </p>
                        </div>
                      )}
                      {plateNumber.trim().length >= 7 && plateAccountInfo && !plateAccountInfo.hasAccount && (
                        <div className="mt-1 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 flex items-center justify-between gap-2">
                          <p className="text-xs text-amber-300">
                            Biển số <strong className="text-foreground">{plateNumber.toUpperCase()}</strong> chưa có tài khoản thành viên.
                          </p>
                          <Button
                            type="button"
                            onClick={() => { setScannedPlateForBinding(plateNumber.toUpperCase()); setIsBindingModalOpen(true); }}
                            className="h-7 rounded-lg bg-amber-500 text-[10px] text-slate-950 font-bold hover:bg-amber-400 px-3 shrink-0"
                          >
                            Liên kết
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Loại xe</label>
                      <div className="flex gap-2 p-1 rounded-lg bg-muted border border-border">
                        <button
                          type="button"
                          disabled={!allowedTypes.includes('CAR')}
                          onClick={() => setVehicleType('car')}
                          className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-bold transition-all ${vehicleType === 'car' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground disabled:opacity-30'}`}
                        >
                          <Car size={13} /> Ô tô {!allowedTypes.includes('CAR') && '(N/A)'}
                        </button>
                        <button
                          type="button"
                          disabled={!allowedTypes.includes('MOTORCYCLE')}
                          onClick={() => setVehicleType('motorcycle')}
                          className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-bold transition-all ${vehicleType === 'motorcycle' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground disabled:opacity-30'}`}
                        >
                          <Bike size={13} /> Xe máy {!allowedTypes.includes('MOTORCYCLE') && '(N/A)'}
                        </button>
                      </div>
                      {plateTypeWarning && <p className="text-[11px] text-amber-400 flex items-center gap-1"><AlertCircle size={11} /> {plateTypeWarning}</p>}
                      {buildingSupportWarning && <p className="text-[11px] text-rose-400 flex items-center gap-1"><AlertCircle size={11} /> {buildingSupportWarning}</p>}
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Cổng vào <span className="text-primary font-bold">*</span>
                      </label>
                      <Input
                        value={gate}
                        onChange={(e) => setGate(e.target.value)}
                        placeholder="Mã cổng (vd: CV_T1)"
                      />
                      {!gate.trim() && <span className="text-[10px] text-amber-400">Vui lòng nhập mã cổng vào.</span>}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-1.5 md:col-span-2">
                      <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Phiên đang đỗ</label>
                      <select
                        value={selectedSessionId}
                        onChange={(e) => setSelectedSessionId(e.target.value)}
                        className="h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none"
                      >
                        <option value="">Chọn phiên để check-out</option>
                        {activeSessions.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.plateNumber} · {s.entryGate?.code ?? '—'} · {fmtTime(s.entryTime)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-1.5 md:col-span-2">
                      <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Phương thức thanh toán</label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {[{ value: 'cash', label: 'Tiền mặt' }, { value: 'bank_transfer', label: 'Chuyển khoản' }].map((m) => (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() => setPaymentMethod(m.value as PaymentKind)}
                            className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${paymentMethod === m.value ? 'border-primary/40 bg-primary/10 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/20'}`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Nút hành động */}
            <div className="flex flex-wrap gap-2">
              {activeForm === 'check-out' ? (
                <Button
                  onClick={onCheckOut}
                  disabled={!selectedSession || loading}
                  className="gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60"
                >
                  <CheckCircle2 size={14} /> {paymentMethod === 'bank_transfer' ? 'Tạo QR thanh toán' : 'Check-out'}
                </Button>
              ) : (
                <Button
                  onClick={onCheckIn}
                  disabled={!plateNumber.trim() || !gate.trim() || loading || !!buildingSupportWarning}
                  className="gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60"
                >
                  <ScanLine size={14} /> Check-in
                </Button>
              )}
            </div>

            {/* Check-in đặt chỗ trước */}
            <div className="rounded-xl border border-border bg-card/50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary mb-3">Check-in đặt chỗ trước</p>
              <div className="flex gap-2">
                <Input
                  value={reservationCode}
                  onChange={(e) => setReservationCode(e.target.value)}
                  placeholder="Mã đặt chỗ / ID"
                  onKeyDown={(e) => e.key === 'Enter' && onCheckInReservation()}
                />
                <Button type="button" onClick={() => setIsQrModalOpen(true)} variant="secondary" className="shrink-0 gap-1.5">
                  <QrCode size={14} /> Quét QR
                </Button>
                <Button
                  type="button"
                  onClick={onCheckInReservation}
                  disabled={!reservationCode.trim()}
                  className="shrink-0 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60"
                >
                  Check-in
                </Button>
              </div>
            </div>

            {/* Phản hồi thao tác */}
            {opMessage && (
              <div className={`rounded-xl border p-4 text-sm ${opMessage.type === 'ok' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'}`}>
                {opMessage.text}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danh sách phiên đang đỗ */}
        <Card>
          <CardHeader>
            <CardTitle>Xe đang đỗ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Đang tải...</p>
            ) : error ? (
              <p className="text-sm text-rose-400">{error}</p>
            ) : activeSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Không có xe đang đỗ.</p>
            ) : (
              activeSessions.slice(0, 6).map((s) => (
                <button
                  key={s._id}
                  type="button"
                  onClick={() => { setSelectedSessionId(s._id); setActiveForm('check-out'); }}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${selectedSessionId === s._id ? 'border-primary/40 bg-primary/10' : 'border-border bg-card hover:border-primary/20'}`}
                >
                  <div className="rounded-full bg-primary/15 px-2 py-1 text-[9px] font-black uppercase text-primary shrink-0">
                    {s.status}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{s.plateNumber}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {s.entryGate?.code ?? '—'} · {s.vehicleType?.name ?? '—'}
                      {(s.slot as { floor?: { name?: string } } | null)?.floor?.name ? ` · ${(s.slot as { floor?: { name?: string } }).floor?.name}` : ''}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{fmtTime(s.entryTime)}</p>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      {/* Bảng tất cả phiên */}
      <Card>
        <CardHeader>
          <CardTitle>Tất cả phiên ({sessions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          ) : error ? (
            <p className="text-sm text-rose-400">{error}</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có phiên nào.</p>
          ) : (
            <DataTable title={`Phiên gửi xe (${sessions.length})`} rows={sessions} columns={columns} />
          )}
        </CardContent>
      </Card>

      {/* QR Scanner Modal */}
      <QRCodeScannerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onScanSuccess={(code: string) => {
          setReservationCode(code);
          setOpMessage({ type: 'ok', text: `Đã quét mã đặt chỗ: ${code}` });
        }}
      />

      <CameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={(plate: string) => {
          setIsCameraModalOpen(false);
          if (plate) {
            setPlateNumber(plate);
            setOpMessage({ type: 'ok', text: `Nhận diện biển số: ${plate}` });
          }
        }}
      />

      {/* Modal liên kết biển số */}
      {isBindingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Liên kết tài khoản</p>
                <h3 className="text-xl font-semibold text-foreground">Liên kết biển số</h3>
              </div>
              <button onClick={() => { setIsBindingModalOpen(false); setCustomerIdOrEmail(''); setFoundCustomer(null); setBindingError(null); }} className="text-muted-foreground hover:text-foreground transition">✕</button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Liên kết biển số <strong className="text-primary font-mono">{scannedPlateForBinding}</strong> vào tài khoản thành viên.
            </p>
            <div className="space-y-4">
              <div className="grid gap-1.5">
                <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">ID / Email / Mã QR khách</label>
                <div className="flex gap-2">
                  <Input
                    value={customerIdOrEmail}
                    onChange={(e) => setCustomerIdOrEmail(e.target.value)}
                    placeholder="Nhập ID, email hoặc mã QR"
                    onKeyDown={(e) => e.key === 'Enter' && handleLookupCustomer()}
                  />
                  <Button type="button" onClick={handleLookupCustomer} disabled={bindingLoading || !customerIdOrEmail.trim()} className="bg-primary text-primary-foreground shrink-0 px-4">
                    Kiểm tra
                  </Button>
                </div>
              </div>
              {bindingLoading && <div className="flex items-center gap-2 text-xs text-primary"><Loader2 className="h-4 w-4 animate-spin" /> Đang xử lý...</div>}
              {bindingError && <p className="text-xs text-rose-400 flex items-center gap-1"><AlertCircle size={12} /> {bindingError}</p>}
              {foundCustomer && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 space-y-3">
                  <p className="text-xs font-semibold text-emerald-400 uppercase">Tìm thấy khách hàng</p>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <p>Họ tên: <strong className="text-foreground">{foundCustomer.fullName}</strong></p>
                    <p>Email: <strong className="text-foreground">{foundCustomer.email}</strong></p>
                  </div>
                  <Button onClick={handleBindPlate} disabled={bindingLoading} className="w-full bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 font-bold text-xs">
                    Xác nhận liên kết biển số
                  </Button>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={() => { setIsBindingModalOpen(false); setCustomerIdOrEmail(''); setFoundCustomer(null); setBindingError(null); }} disabled={bindingLoading} className="text-xs px-4">
                Hủy
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Gợi ý liên kết biển số */}
      {plateToPromptBinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl border border-primary/30 bg-card p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-primary/10 p-3 text-primary border border-primary/20 shrink-0">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Gợi ý hệ thống</p>
                <h3 className="mt-1 text-lg font-bold text-foreground">Hỏi khách về liên kết tài khoản</h3>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-border bg-card/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">Biển số vừa check-in</p>
                <p className="mt-1 font-mono text-2xl font-black text-primary">{plateToPromptBinding}</p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1.5"><UserPlus size={13} /> Gợi ý hỏi khách:</p>
                <p className="text-sm italic text-muted-foreground leading-relaxed">
                  "Dạ thưa anh/chị, biển số này chưa đăng ký tài khoản. Anh/chị có muốn lưu vào tài khoản thành viên để lần sau tự động nhận diện không ạ?"
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => setPlateToPromptBinding(null)} className="text-xs h-10">Không, bỏ qua</Button>
              <Button
                onClick={() => { setScannedPlateForBinding(plateToPromptBinding); setPlateToPromptBinding(null); setIsBindingModalOpen(true); }}
                className="bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 font-bold text-xs h-10"
              >
                Có, liên kết ngay
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal chuyển khoản ngân hàng */}
      {bankTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Chuyển khoản</p>
            <h3 className="mt-1 text-xl font-semibold text-foreground">Thu phí gửi xe</h3>
            <div className="mt-4 rounded-xl border border-border bg-card/50 p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Biển số</span><span className="font-semibold text-foreground">{bankTransfer.plate}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Số tiền</span><span className="font-mono text-lg font-bold text-amber-400">{bankTransfer.amount.toLocaleString('vi-VN')} đ</span></div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Mở trang thanh toán và để khách quét QR. Sau khi khách chuyển khoản, nhấn <strong className="text-foreground">Xác nhận</strong>.</p>
            <Button onClick={() => window.open(bankTransfer.checkoutUrl, '_blank', 'noopener')} variant="secondary" className="mt-4 w-full gap-2">
              Mở trang QR thanh toán
            </Button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button onClick={onVerifyBankTransfer} disabled={verifying} className="gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60">
                {verifying ? 'Đang xác nhận...' : 'Xác nhận thanh toán'}
              </Button>
              <Button variant="secondary" onClick={() => setBankTransfer(null)} disabled={verifying}>Đóng</Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
