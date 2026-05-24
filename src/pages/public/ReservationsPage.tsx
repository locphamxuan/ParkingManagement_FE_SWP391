import { useMemo, useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { AnimatedParkingMap3D } from '@/components/shared/AnimatedParkingMap3D';
import {
  ArrowLeft,
  Calendar,
  Car,
  Bike,
  Plus,
  AlertTriangle,
  CheckCircle2,
  X,
  User,
  ShieldAlert,
  Clock,
  Trash2,
  ParkingCircle
} from 'lucide-react';

interface Reservation {
  id: string;
  userId: string;
  slotCode: string;
  plateNumber: string;
  vehicleType: 'car' | 'motorcycle';
  startTime: string;
  status: 'active' | 'cancelled' | 'completed';
}

const MAX_RED_REDIRECT_SECONDS = 3;

export default function ReservationsPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  
  // Simulated database of system-wide reservations
  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const stored = localStorage.getItem('pbms.reservations');
    return stored ? JSON.parse(stored) : [];
  });

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedPlate, setSelectedPlate] = useState<string>('');
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Modal redirect countdown for users with no registered plates
  const [redirectSeconds, setRedirectSeconds] = useState(MAX_RED_REDIRECT_SECONDS);
  const [showRedirectModal, setShowRedirectModal] = useState(false);

  const user = useMemo(() => {
    if (!session) return null;
    return {
      userId: session.userId,
      fullName: session.displayName,
      email: session.email,
      phone: session.phone || '',
      licensePlates: session.licensePlates || [],
    };
  }, [session]);

  // Determine active bookings for the logged-in user
  const userReservations = useMemo(() => {
    if (!user) return [];
    return reservations.filter((r) => r.userId === user.userId);
  }, [reservations, user]);

  const activeReservations = useMemo(() => {
    return userReservations.filter((r) => r.status === 'active');
  }, [userReservations]);

  // Handle 0 plates warning modal on page mount
  useEffect(() => {
    if (user && user.licensePlates.length === 0) {
      setShowRedirectModal(true);
      const timer = setInterval(() => {
        setRedirectSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/profile');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [user, navigate]);

  // Persist reservations in localStorage whenever state updates
  const saveReservations = (updatedList: Reservation[]) => {
    setReservations(updatedList);
    localStorage.setItem('pbms.reservations', JSON.stringify(updatedList));
  };

  if (!session || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  const handleSlotClick = (slotCode: string) => {
    setBookingError(null);
    setBookingSuccess(null);

    // Guard: Check active reservation limits
    if (activeReservations.length >= user.licensePlates.length) {
      setBookingError(
        `Bạn đã đạt giới hạn đặt chỗ tối đa! (Giới hạn tối đa bằng số xe đã liên kết: ${user.licensePlates.length} ô đỗ). Hãy hoàn thành hoặc hủy các lượt đặt chỗ trước để đặt lượt mới.`
      );
      setSelectedSlot(null);
      return;
    }

    setSelectedSlot(slotCode);
    
    // Auto-select first available plate that is not currently in an active reservation
    const unusedPlate = user.licensePlates.find(
      (p) => !activeReservations.some((ar) => ar.plateNumber === p.plateNumber)
    );
    setSelectedPlate(unusedPlate ? unusedPlate.plateNumber : '');
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    setBookingSuccess(null);

    if (!selectedSlot) return;

    if (!selectedPlate) {
      setBookingError('Vui lòng chọn biển số xe để liên kết với ô đỗ này!');
      return;
    }

    // Guard: Prevent double-booking same plate on active spots
    const isPlateDoubleBooked = activeReservations.some(
      (ar) => ar.plateNumber === selectedPlate
    );
    if (isPlateDoubleBooked) {
      setBookingError('Biển số xe này đã được sử dụng cho một lượt đặt chỗ khác đang diễn ra!');
      return;
    }

    const plateInfo = user.licensePlates.find((p) => p.plateNumber === selectedPlate);
    if (!plateInfo) return;

    const newReservation: Reservation = {
      id: `RSV-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: user.userId,
      slotCode: selectedSlot,
      plateNumber: plateInfo.plateNumber,
      vehicleType: plateInfo.vehicleType,
      startTime: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
      status: 'active',
    };

    const updated = [newReservation, ...reservations];
    saveReservations(updated);

    setBookingSuccess(`Đặt chỗ thành công ô đỗ ${selectedSlot} cho xe ${selectedPlate}!`);
    setSelectedSlot(null);
    setSelectedPlate('');
    setTimeout(() => setBookingSuccess(null), 4000);
  };

  const handleCancelReservation = (resId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lượt đặt chỗ này?')) return;
    
    const updated = reservations.map((r) => {
      if (r.id === resId) {
        return { ...r, status: 'cancelled' as const };
      }
      return r;
    });
    saveReservations(updated);
  };

  const selectedPlateDetails = user.licensePlates.find((p) => p.plateNumber === selectedPlate);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden selection:bg-orange-500 selection:text-white">
      {/* Background Cyber Glowing Accents */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.06),transparent_60%)] pointer-events-none blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.05),transparent_60%)] pointer-events-none blur-3xl" />

      {/* 0-Plate Block Warning Modal overlay */}
      <AnimatePresence>
        {showRedirectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full mx-4 rounded-3xl border border-rose-500/30 bg-slate-900/90 p-8 shadow-2xl relative text-center space-y-6"
            >
              <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <ShieldAlert size={36} className="stroke-[2.5]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase tracking-wider text-rose-400 font-mono">Chưa liên kết biển số</h3>
                <p className="text-sm text-slate-300 font-semibold leading-relaxed">
                  Bạn chưa liên kết biển số xe nào vào tài khoản! Vui lòng liên kết ít nhất 1 biển số xe trước khi thực hiện đặt chỗ.
                </p>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-3.5 border border-white/5 font-mono text-xs text-slate-400">
                Hệ thống tự động chuyển hướng sau <span className="text-rose-400 font-black text-sm">{redirectSeconds}</span> giây...
              </div>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(249,115,22,0.35)] transition-all duration-300"
              >
                Cập nhật ngay
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 relative z-10">

        {/* Sticky Glass Panel Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between gap-4 rounded-3xl border border-white/5 bg-slate-900/60 p-4 backdrop-blur-md shadow-2xl"
        >
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-white/5 bg-slate-950 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-orange-400 hover:border-orange-500/30 hover:shadow-[0_0_15px_rgba(249,115,22,0.2)] transition-all duration-300 hover:scale-105"
            onClick={() => navigate('/', { replace: true })}
          >
            <ArrowLeft size={14} className="stroke-[3]" />
            Về trang chủ
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-white/5 bg-slate-950 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-orange-400 hover:border-orange-500/30 hover:shadow-[0_0_15px_rgba(249,115,22,0.2)] transition-all duration-300 hover:scale-105"
            onClick={() => navigate('/profile')}
          >
            <User size={14} className="stroke-[3]" />
            Hồ sơ cá nhân
          </button>
        </motion.div>

        {/* Dynamic Success Toast */}
        <AnimatePresence>
          {bookingSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-4 text-xs font-black uppercase tracking-wider font-mono text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)] backdrop-blur-md flex items-center gap-3"
            >
              <CheckCircle2 size={16} />
              {bookingSuccess}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active limit warnings */}
        <AnimatePresence>
          {activeReservations.length >= user.licensePlates.length && user.licensePlates.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 shadow-lg flex items-start gap-4"
            >
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                <AlertTriangle size={18} className="stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 font-mono">Đạt giới hạn đặt chỗ tối đa</h4>
                <p className="text-[11px] text-amber-200/80 mt-1 font-semibold leading-relaxed">
                  Bạn đã đạt giới hạn đặt chỗ tối đa! Giới hạn đỗ đồng thời của tài khoản bằng đúng số lượng biển số xe liên kết của bạn: <span className="font-bold text-amber-400">{user.licensePlates.length} ô đỗ</span>. Vui lòng hoàn thành hoặc hủy các lượt đặt chỗ đang diễn ra để bắt đầu lượt mới.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">

          {/* Left Panel: 3D interactive Map container */}
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 90, damping: 16 }}
            className="space-y-6 rounded-3xl border border-white/5 bg-slate-900/40 p-8 backdrop-blur-md shadow-2xl relative overflow-hidden"
          >
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-400 font-mono">Mô phỏng đỗ xe 3D</p>
              <h1 className="text-3xl font-black tracking-tight text-white">
                Sơ đồ bãi đỗ xe <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-cyan-400 bg-clip-text text-transparent">tương tác thông minh</span>
              </h1>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed pt-1">
                Các ô đỗ màu xanh lá cây đại diện cho bãi đỗ trống. Bấm trực tiếp vào các ô đỗ khả dụng trên mô hình 3D bên dưới để chọn điểm đỗ của bạn.
              </p>
            </div>

            <AnimatedParkingMap3D
              interactive={true}
              selectedSlot={selectedSlot}
              activeReservations={activeReservations}
              onSlotClick={handleSlotClick}
            />
          </motion.section>

          {/* Right Panel: Confirmation form and Active Bookings */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 90, damping: 16, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Interactive Booking Confirm Form card */}
            <div className="rounded-3xl border border-white/5 bg-slate-900/30 p-8 backdrop-blur-md shadow-2xl flex flex-col gap-5 justify-between relative overflow-hidden">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
                <ParkingCircle size={15} className="text-orange-400" />
                Phiếu đăng ký đặt chỗ trước
              </h2>

              <AnimatePresence mode="wait">
                {selectedSlot ? (
                  <motion.form
                    key="booking-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onSubmit={handleConfirmBooking}
                    className="space-y-4"
                  >
                    {/* Error display inside Form */}
                    {bookingError && (
                      <div className="rounded-xl border border-rose-500/25 bg-rose-950/20 p-3.5 text-xs font-semibold text-rose-400 flex items-center gap-2">
                        <AlertTriangle size={14} className="shrink-0" />
                        <span>{bookingError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                        <p className="text-[10px] font-black uppercase text-slate-500 font-mono">Ô đỗ được chọn</p>
                        <p className="mt-1.5 text-lg font-mono font-black text-orange-400">{selectedSlot}</p>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                        <p className="text-[10px] font-black uppercase text-slate-500 font-mono">Loại ô đỗ</p>
                        <p className="mt-1.5 text-sm font-bold text-slate-200">
                          {selectedSlot === 'A-03' ? '🔋 Sạc điện (EV)' : '🚗 Tiêu chuẩn'}
                        </p>
                      </div>
                    </div>

                    {/* Plates drop selector */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Chọn phương tiện sử dụng</label>
                      <div className="relative">
                        <select
                          value={selectedPlate}
                          onChange={(e) => {
                            setSelectedPlate(e.target.value);
                            setBookingError(null);
                          }}
                          required
                          className="block w-full h-11 px-4 rounded-xl border border-white/10 bg-slate-950 text-white text-sm outline-none focus:border-orange-500 transition-all duration-300 font-mono tracking-wider"
                        >
                          <option value="" disabled>-- Chọn biển số xe của bạn --</option>
                          {user.licensePlates.map((item) => {
                            const isUsed = activeReservations.some((ar) => ar.plateNumber === item.plateNumber);
                            return (
                              <option 
                                key={item.plateNumber} 
                                value={item.plateNumber}
                                disabled={isUsed}
                                className="bg-slate-900"
                              >
                                {item.vehicleType === 'car' ? '🚗' : '🏍️'} {item.plateNumber} {item.vehicleType === 'car' ? '[Ô tô]' : '[Xe máy]'} {isUsed ? '(Đang đỗ)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    {/* Selected vehicle type details banner */}
                    {selectedPlateDetails && (
                      <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-colors duration-300 ${
                        selectedPlateDetails.vehicleType === 'car'
                          ? 'bg-blue-500/5 border-blue-500/20 text-blue-400'
                          : 'bg-purple-500/5 border-purple-500/20 text-purple-400'
                      }`}>
                        {selectedPlateDetails.vehicleType === 'car' ? <Car size={18} /> : <Bike size={18} />}
                        <div className="text-[11px] font-semibold">
                          Loại phương tiện đăng ký: <span className="uppercase font-bold tracking-wider">{selectedPlateDetails.vehicleType === 'car' ? 'Ô tô' : 'Xe máy'}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(249,115,22,0.35)] transition-all duration-300"
                      >
                        Đặt chỗ ngay
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSlot(null)}
                        className="px-5 rounded-xl bg-slate-950 border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:border-white/20 hover:scale-[1.02] transition-all duration-300"
                      >
                        Hủy
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div
                    key="instructions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl border border-white/5 bg-slate-950/70 p-6 text-center space-y-3"
                  >
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                      Chưa chọn ô đỗ. Hãy nhấp chọn một ô đỗ khả dụng màu xanh lục trên sơ đồ 3D để bắt đầu quy trình giữ chỗ trước.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* List of User Reservations */}
            <div className="rounded-3xl border border-white/5 bg-slate-900/30 p-8 backdrop-blur-md shadow-2xl flex flex-col gap-5 justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono flex items-center justify-between">
                <span>Lịch sử đặt chỗ của bạn</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-full">
                  {userReservations.length} lượt
                </span>
              </h2>

              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {userReservations.map((res) => (
                  <div
                    key={res.id}
                    className={`rounded-2xl border p-4 flex items-center justify-between gap-4 transition-all duration-300 ${
                      res.status === 'active'
                        ? 'bg-slate-950 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.05)]'
                        : 'bg-slate-950/50 border-white/5 opacity-70'
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-orange-400">{res.id}</span>
                        <span className={`text-[8px] font-sans font-black px-1.5 py-0.2 rounded uppercase ${
                          res.status === 'active'
                            ? 'bg-emerald-500/25 text-emerald-400'
                            : 'bg-slate-800 text-slate-500'
                        }`}>
                          {res.status === 'active' ? 'Đang giữ' : res.status === 'cancelled' ? 'Đã hủy' : 'Hoàn tất'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-slate-300 font-bold">
                        <div>Tọa độ: <span className="font-mono text-white font-extrabold">{res.slotCode}</span></div>
                        <div className="flex items-center gap-1 font-mono">
                          {res.vehicleType === 'car' ? <Car size={11} className="text-blue-400" /> : <Bike size={11} className="text-purple-400" />}
                          <span className={res.vehicleType === 'car' ? 'text-blue-400' : 'text-purple-400'}>{res.plateNumber}</span>
                        </div>
                      </div>
                      <div className="text-[9px] text-slate-500 font-bold flex items-center gap-1 font-mono">
                        <Clock size={10} />
                        {res.startTime}
                      </div>
                    </div>

                    {res.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => handleCancelReservation(res.id)}
                        className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all duration-200 flex-shrink-0"
                        title="Hủy đặt chỗ"
                      >
                        <Trash2 size={13} className="stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                ))}

                {userReservations.length === 0 && (
                  <div className="text-center py-6 text-slate-500 font-semibold italic text-xs">
                    Bạn chưa thực hiện bất kỳ lượt đặt chỗ nào…
                  </div>
                )}
              </div>
            </div>

          </motion.aside>
        </div>
      </div>
    </main>
  );
}
