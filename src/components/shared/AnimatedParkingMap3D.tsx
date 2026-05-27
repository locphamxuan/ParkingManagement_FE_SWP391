import { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { CartoonCar3D } from './CartoonCar3D';
import { Activity, Info, Zap } from 'lucide-react';

export interface AnimatedParkingMap3DProps {
  rotateX?: any;
  rotateZ?: any;
  scale?: any;
  x?: any;
  y?: any;
  interactive?: boolean;
  selectedSlot?: string | null;
  activeReservations?: Array<{ slotCode: string; plateNumber: string; vehicleType: 'car' | 'motorcycle' }>;
  interactiveUnavailableSlots?: string[];
  onSlotClick?: (slotCode: string) => void;
}

export function AnimatedParkingMap3D({
  rotateX,
  rotateZ,
  scale,
  x,
  y,
  interactive = false,
  selectedSlot = null,
  activeReservations = [],
  interactiveUnavailableSlots = [],
  onSlotClick
}: AnimatedParkingMap3DProps = {}) {
  const [hudMessage, setHudMessage] = useState('Khởi động hệ thống mô phỏng...');
  const [simPhase, setSimPhase] = useState(0);

  // Animation controllers for Car A (Cyan Sedan) and Car B (Fuchsia SUV)
  const controlsCarA = useAnimation();
  const controlsCarB = useAnimation();

  // Control gates
  const [gateAOpen, setGateAOpen] = useState(false);
  const [gateBOpen, setGateBOpen] = useState(false);

  // States for headlights and parking status
  const [carAState, setCarAState] = useState<'driving' | 'parking' | 'parked'>('driving');
  const [carBState, setCarBState] = useState<'driving' | 'parking' | 'parked'>('parked');

  // Exhaust smoke particle state triggers
  const [smokeParticles, setSmokeParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    if (interactive) {
      setCarAState('parked');
      setCarBState('parked');
      setGateAOpen(false);
      setGateBOpen(false);
      setHudMessage('Vui lòng chọn một ô đỗ trống màu xanh trên sơ đồ.');
      return;
    }

    let active = true;

    async function runSimulationLoop() {
      if (!active) return;

      // Phase 0: Reset states
      setSimPhase(0);
      setHudMessage('Hệ thống hoạt động ổn định. 3 ô trống khả dụng.');
      setCarAState('driving');
      setCarBState('parked');
      setGateAOpen(false);
      setGateBOpen(false);
      
      // Reset positions instantly
      controlsCarA.set({ x: -100, y: 160, rotateZ: 90, opacity: 0 });
      controlsCarB.set({ x: 270, y: 30, rotateZ: -90, opacity: 1 });

      await new Promise((resolve) => setTimeout(resolve, 2000));
      if (!active) return;

      // PHASE 1: Car A (Cyan Sedan) Enters
      setSimPhase(1);
      setHudMessage('Cổng số 1: Nhận diện xe điện Cyan đang đi vào...');
      setGateAOpen(true);
      
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (!active) return;

      // Drive through gate
      await controlsCarA.start({
        opacity: 1,
        x: 100,
        y: 160,
        transition: { type: 'spring', stiffness: 50, damping: 14 }
      });
      if (!active) return;
      
      setGateAOpen(false);
      setHudMessage('Cyan Sedan đang di chuyển dọc làn xe...');

      // Drive to Slot 3 alignment
      await controlsCarA.start({
        x: 190,
        y: 160,
        transition: { ease: 'linear', duration: 1.2 }
      });
      if (!active) return;

      setHudMessage('Căn chỉnh góc đỗ. Kích hoạt cảm biến lùi...');
      setCarAState('parking');

      // Turn 90 degrees to face away from slot
      await controlsCarA.start({
        rotateZ: 0,
        transition: { duration: 0.5 }
      });
      if (!active) return;

      // Reverse Park into Slot 3
      setHudMessage('Đang lùi đỗ vào ô số 3...');
      await controlsCarA.start({
        y: 30,
        transition: { type: 'spring', stiffness: 40, damping: 12 }
      });
      if (!active) return;

      setCarAState('parked');
      setHudMessage('Cyan Sedan đã đỗ hoàn tất tại ô số 3. Bắt đầu sạc EV.');

      await new Promise((resolve) => setTimeout(resolve, 3000));
      if (!active) return;

      // PHASE 2: Car B (Fuchsia SUV) Exits
      setSimPhase(2);
      setHudMessage('Hệ thống nhận lệnh: SUV Fuchsia ô số 4 chuẩn bị xuất bãi...');
      setCarBState('driving');

      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!active) return;

      // Turn on headlights and drive out of slot 4
      setHudMessage('Fuchsia SUV đang rời ô đỗ số 4...');
      await controlsCarB.start({
        y: 160,
        transition: { type: 'spring', stiffness: 45, damping: 12 }
      });
      if (!active) return;

      // Turn 90 degrees right to face exit
      await controlsCarB.start({
        rotateZ: 90,
        transition: { duration: 0.5 }
      });
      if (!active) return;

      setHudMessage('Di chuyển ra phía cổng soát vé số 2...');
      setGateBOpen(true);

      // Drive to exit gate
      await controlsCarB.start({
        x: 380,
        y: 160,
        transition: { ease: 'linear', duration: 1.2 }
      });
      if (!active) return;

      setHudMessage('Quét thẻ RFID thành công. Cổng soát vé số 2 mở.');

      // Exit screen
      await controlsCarB.start({
        x: 520,
        transition: { type: 'spring', stiffness: 50, damping: 12 }
      });
      if (!active) return;

      setGateBOpen(false);
      setHudMessage('Fuchsia SUV đã rời bãi. Giao dịch thành công.');

      await new Promise((resolve) => setTimeout(resolve, 3000));
      if (!active) return;

      // Loop restart
      runSimulationLoop();
    }

    runSimulationLoop();

    return () => {
      active = false;
    };
  }, [controlsCarA, controlsCarB]);

  // Handle active car smoke particles spawning during motion
  useEffect(() => {
    if (simPhase === 0) return;
    
    const interval = setInterval(() => {
      if (simPhase === 1 && carAState === 'driving') {
        setSmokeParticles((prev) => [
          ...prev.slice(-4),
          { id: Math.random(), x: 90, y: 170 }
        ]);
      }
      if (simPhase === 2 && carBState === 'driving') {
        setSmokeParticles((prev) => [
          ...prev.slice(-4),
          { id: Math.random(), x: 260, y: 170 }
        ]);
      }
    }, 450);

    return () => clearInterval(interval);
  }, [simPhase, carAState, carBState]);

  return (
    <div className="relative w-full rounded-3xl bg-slate-950 border border-white/5 shadow-2xl p-6 overflow-hidden flex flex-col justify-between h-[420px]">
      
      {/* Blueprint Grid Lines Backing */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none" />

      {/* Cyberpunk HUD Indicator Top */}
      <div className="relative z-10 flex items-center justify-between bg-slate-900/60 border border-white/5 px-4 py-2.5 rounded-2xl backdrop-blur-md shadow-lg border-glow-neon">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_#f97316]" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
            <Activity size={12} className="text-orange-400" />
            {interactive ? 'SƠ ĐỒ TƯƠNG TÁC ĐẶT CHỖ 3D' : 'LIVE SIMULATION V3.0'}
          </span>
        </div>
        <span className="text-[9px] font-mono font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 uppercase tracking-widest">
          {interactive ? 'CHỌN Ô ĐỖ' : 'ACTIVE MAP'}
        </span>
      </div>

      {/* High-Fidelity Smart City Isometric Arena */}
      <div className="w-full flex-1 relative flex items-center justify-center perspective-1000 preserve-3d">
        
        {/* DATA STREAMING HUD CALLOUT FOR TEAL SEDAN IN ENTRY PHASE */}
        {simPhase === 1 && carAState === 'driving' && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
            {/* Dynamic leader line linking from HUD to Teal Sedan path */}
            <motion.path 
              d="M 115,75 Q 150,110 135,160"
              fill="none" 
              stroke="#06b6d4" 
              strokeWidth="1.5"
              strokeDasharray="4 3"
              animate={{ strokeDashoffset: -20 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            />
            {/* Floating Glassmorphic Callout Tag */}
            <foreignObject x="55" y="38" width="135" height="48">
              <div className="glass-panel border border-cyan-500/40 text-[7px] font-black text-cyan-300 rounded px-2.5 py-1.5 tracking-wider uppercase font-mono shadow-xl animate-bounce flex flex-col gap-0.5">
                <div className="flex justify-between items-center text-[8px] text-cyan-200 border-b border-cyan-500/20 pb-0.5 mb-0.5">
                  <span>TEAL_SEDAN_EV</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                </div>
                <div>SYS: AUTOPARK_ALIGN</div>
                <div>BATTERY: 81%</div>
              </div>
            </foreignObject>
          </svg>
        )}

        <motion.div 
          style={{
            transformStyle: 'preserve-3d',
            width: '450px',
            height: '240px',
            rotateX: rotateX ?? 55,
            rotateZ: rotateZ ?? -45,
            scale: scale ?? 1.0,
            x: x ?? 0,
            y: y ?? 0,
          }}
          className="relative preserve-3d"
        >
          {/* Architectural Asphalt Concrete Platform SVG Base */}
          <svg viewBox="0 0 450 240" className="absolute inset-0 w-full h-full overflow-visible z-0">
            <defs>
              {/* High-fidelity dark asphalt roadbed texture */}
              <linearGradient id="asphaltRoad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2d3748" />
                <stop offset="100%" stopColor="#1a202c" />
              </linearGradient>
              <linearGradient id="concreteSide" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1f2937" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <radialGradient id="evShield" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Extruded Concrete Slab Sides (simulating solid block thickness) */}
            <polygon points="0,220 450,220 450,236 0,236" fill="url(#concreteSide)" opacity="0.95" />
            
            {/* Dark Asphalt Roadbed Ground top face */}
            <polygon points="0,20 450,20 450,220 0,220" fill="url(#asphaltRoad)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

            {/* Solid White Concrete Curbs surrounding asphalt borders */}
            <polygon points="0,20 450,20 450,23 0,23" fill="#e2e8f0" opacity="0.9" />
            <polygon points="0,217 450,217 450,220 0,220" fill="#e2e8f0" opacity="0.9" />

            {/* Thick 3D Curb Warning Stripes at the edge border */}
            <polygon points="0,218 450,218 450,221 0,221" fill="repeating-linear-gradient(45deg, #fbbf24, #fbbf24 6px, #0f172a 6px, #0f172a 12px)" />

            {/* Safety Guardrails (Volumetric steel tubing with support pillars and base mounts) */}
            <g opacity="0.8">
              {/* Vertical support pillars */}
              {[10, 80, 150, 220, 290, 360, 430].map(xVal => (
                <g key={xVal}>
                  {/* Pillar Shadow */}
                  <line x1={xVal - 0.5} y1="20" x2={xVal - 0.5} y2="4" stroke="#020617" strokeWidth="3" opacity="0.5" />
                  {/* Pillar Front */}
                  <line x1={xVal} y1="20" x2={xVal} y2="4" stroke="#cbd5e1" strokeWidth="2" />
                  {/* Circular metallic mount base */}
                  <ellipse cx={xVal} cy="20" rx="3.5" ry="1.8" fill="#475569" stroke="#cbd5e1" strokeWidth="0.5" />
                </g>
              ))}
              {/* Dual Guardrail tubes with linear gradient steel texture */}
              <line x1="0" y1="8" x2="450" y2="8" stroke="#475569" strokeWidth="2.5" />
              <line x1="0" y1="4" x2="450" y2="4" stroke="#f1f5f9" strokeWidth="1.5" />
            </g>

            {/* Lanes markings (dashed white-ish lines with subtle glowing drop shadows) */}
            <line x1="0" y1="135" x2="450" y2="135" stroke="rgba(255,255,255,0.18)" strokeWidth="2" strokeDasharray="6 8" />

            {/* Yellow parking lane boundaries */}
            {[20, 105, 190, 275, 360, 445].map((xPos) => (
              <path key={xPos} d={`M ${xPos},20 L ${xPos},85`} stroke="#fbbf24" strokeWidth="2.5" opacity="0.85" />
            ))}
            
            {/* White ground directional arrows */}
            <path d="M 160,170 L 190,170 M 180,165 L 190,170 L 180,175" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" strokeLinecap="round" />

            {/* Curved trajectory guide arrow (Teal Sedan reversing path into Slot 3) */}
            {simPhase === 1 && (
              <motion.g 
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0.8, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, times: [0, 0.15, 0.85, 1] }}
              >
                {/* Curved dotted line */}
                <path 
                  d="M 140,160 Q 210,140 215,65" 
                  fill="none" 
                  stroke="#fbbf24" 
                  strokeWidth="1.8" 
                  strokeDasharray="3 3" 
                />
                {/* Arrow head */}
                <path 
                  d="M 211,72 L 215,65 L 219,72" 
                  fill="none" 
                  stroke="#fbbf24" 
                  strokeWidth="1.8" 
                  strokeLinecap="round"
                />
              </motion.g>
            )}

            {/* EV charging pulsing glowing shield under Slot 3 */}
            {simPhase === 1 && carAState === 'parked' && (
              <g transform="translate(190, 25)">
                <motion.ellipse 
                  cx="32" cy="22" 
                  animate={{ rx: [24, 30, 24], ry: [14, 18, 14], opacity: [0.35, 0.65, 0.35] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  fill="url(#evShield)" 
                />
                <circle cx="32" cy="22" r="14" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.8" />
              </g>
            )}

            {/* Highly Detailed Volumetric 3D EV Charging Station Post block */}
            <g transform="translate(208, 0)" opacity="0.95">
              {/* Volumetric shadow of post */}
              <polygon points="4,16 16,16 14,20 2,20" fill="#020617" opacity="0.4" />
              {/* 3D Base plate */}
              <polygon points="5,14 15,14 13,17 3,17" fill="#334155" stroke="#475569" strokeWidth="0.5" />
              {/* Post vertical body (with 3D shaded front and side) */}
              <path d="M 7,2 L 11,2 L 11,14 L 7,14 Z" fill="#0284c7" />
              <path d="M 11,2 L 13,3 L 13,14 L 11,14 Z" fill="#0369a1" />
              {/* Glowing LED display screen */}
              <rect x="7.5" y="4" width="3" height="3.5" rx="0.5" fill="#0f172a" stroke="#0ea5e9" strokeWidth="0.5" />
              <circle cx="9" cy="5.8" r="0.8" fill="#10b981" className="animate-pulse" />
              {/* Power plug connector & cute coiled cable linking to Slot 3 */}
              <path d="M 12.5,7 C 16,10 24,8 24,18" stroke="#06b6d4" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <circle cx="24" cy="18" r="2.2" fill="#0284c7" stroke="#0ea5e9" strokeWidth="0.5" />
            </g>
          </svg>

          {/* Solid 3D security gate pillars (black pillars with glowing red LEDs at the top) */}
          {/* Left Entry Security Gate (Tilted open at 45 degrees) */}
          <div 
            className="absolute left-[-18px] top-[140px] preserve-3d" 
            style={{ 
              width: '12px', 
              height: '12px', 
              transform: 'translateZ(0px)',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Volumetric black scanner body */}
            <div 
              className="box-3d w-full h-full preserve-3d"
              style={{
                '--box-w': '12px',
                '--box-d': '12px',
                '--box-h': '36px',
                transformStyle: 'preserve-3d'
              } as React.CSSProperties}
            >
              {/* Top Face (Glowing red status bulb) */}
              <div className="box-3d-face box-3d-top bg-slate-950 border border-slate-800 rounded-sm flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse" />
              </div>
              {/* Other black faces */}
              <div className="box-3d-face box-3d-front bg-slate-900 border-b border-black/40" />
              <div className="box-3d-face box-3d-right bg-slate-900" />
              <div className="box-3d-face box-3d-back bg-slate-900" />
              <div className="box-3d-face box-3d-left bg-slate-900" />
            </div>

            {/* Red/White striped gate arm (entrance gate tilted at 45 degrees, opens to 85) */}
            <div 
              className="absolute left-3.5 top-1.5 w-[50px] h-2.5 bg-red-500 origin-left transition-transform duration-500 shadow-lg preserve-3d"
              style={{ 
                transform: gateAOpen ? 'rotateZ(-85deg) translateZ(28px)' : 'rotateZ(-45deg) translateZ(28px)',
                transformOrigin: 'left center',
                backgroundImage: 'repeating-linear-gradient(45deg, #ef4444, #ef4444 6px, #ffffff 6px, #ffffff 12px)',
                border: '1.5px solid #b91c1c',
                borderRadius: '2px'
              }} 
            />
          </div>

          {/* Right Exit Security Gate (Closed horizontal by default) */}
          <div 
            className="absolute right-[-18px] top-[140px] preserve-3d" 
            style={{ 
              width: '12px', 
              height: '12px', 
              transform: 'translateZ(0px)',
              transformStyle: 'preserve-3d'
            }}
          >
            <div 
              className="box-3d w-full h-full preserve-3d"
              style={{
                '--box-w': '12px',
                '--box-d': '12px',
                '--box-h': '36px',
                transformStyle: 'preserve-3d'
              } as React.CSSProperties}
            >
              {/* Top Face (Glowing red status bulb) */}
              <div className="box-3d-face box-3d-top bg-slate-950 border border-slate-800 rounded-sm flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
              </div>
              <div className="box-3d-face box-3d-front bg-slate-900 border-b border-black/40" />
              <div className="box-3d-face box-3d-right bg-slate-900" />
              <div className="box-3d-face box-3d-back bg-slate-900" />
              <div className="box-3d-face box-3d-left bg-slate-900" />
            </div>

            {/* Red/White striped gate arm (exit gate closed horizontal 0 degrees) */}
            <div 
              className="absolute right-3.5 top-1.5 w-[50px] h-2.5 bg-red-500 origin-right transition-transform duration-500 shadow-lg preserve-3d"
              style={{ 
                transform: gateBOpen ? 'rotateZ(85deg) translateZ(28px)' : 'rotateZ(0deg) translateZ(28px)',
                transformOrigin: 'right center',
                backgroundImage: 'repeating-linear-gradient(45deg, #ef4444, #ef4444 6px, #ffffff 6px, #ffffff 12px)',
                border: '1.5px solid #b91c1c',
                borderRadius: '2px'
              }} 
            />
          </div>

          {/* Render 5 volumetric Parking slots with stoppers */}
          <div className="absolute top-[20px] left-[20px] right-[20px] h-[70px] grid grid-cols-5 gap-4 items-center justify-items-center">
            {[1, 2, 3, 4, 5].map((id) => {
              const slotCode = `A-0${id}`;
              const isEV = id === 3;
              
              // If interactive mode, check if slot is reserved in activeReservations
              const reservation = interactive && activeReservations?.find((r) => r.slotCode === slotCode);
              const blockedBySlotStatus = interactiveUnavailableSlots.includes(slotCode);
              const isOccupied = interactive 
                ? Boolean(reservation || blockedBySlotStatus)
                : (id === 1 || id === 2 || (id === 3 && carAState === 'parked') || (id === 4 && carBState === 'parked') || id === 5);
              
              const isSelected = interactive && selectedSlot === slotCode;

              return (
                <motion.div 
                  key={id}
                  onClick={() => {
                    if (interactive && !isOccupied && onSlotClick) {
                      onSlotClick(slotCode);
                    }
                  }}
                  whileHover={interactive && !isOccupied ? { 
                    scale: 1.05, 
                    boxShadow: '0 0 15px rgba(16,185,129,0.5)',
                    borderColor: 'rgba(16,185,129,0.5)'
                  } : {}}
                  whileTap={interactive && !isOccupied ? { scale: 0.95, y: 1 } : {}}
                  className={`w-[66px] h-[46px] rounded-xl border flex flex-col justify-between p-1.5 relative shadow-2xl transition-all duration-300 ${
                    interactive && !isOccupied ? 'cursor-pointer' : ''
                  } ${
                    isSelected
                      ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.6)] scale-105 z-20'
                      : isOccupied
                      ? 'border-rose-500/80 bg-rose-500/5 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                      : 'border-emerald-500 bg-emerald-500/5 shadow-[0_0_10px_rgba(16,185,129,0.3)] hover:border-emerald-400 hover:bg-emerald-500/10'
                  }`}
                >
                  {/* EV Slot specific header glow */}
                  {isEV && (
                    <div className="absolute inset-0 border border-cyan-500/20 rounded-xl bg-cyan-500/5 flex items-center justify-center pointer-events-none">
                      <Zap size={10} className="text-cyan-400 opacity-60 absolute top-1 right-1" />
                    </div>
                  )}
                  
                  {/* Yellow-and-Black striped Stopper bump guard */}
                  <div 
                    className="absolute top-1 left-2.5 right-2.5 h-[3px] rounded-xs pointer-events-none"
                    style={{
                      transform: 'translateZ(1.5px)',
                      backgroundImage: 'repeating-linear-gradient(45deg, #fbbf24, #fbbf24 3px, #0f172a 3px, #0f172a 6px)',
                      border: '0.5px solid #78350f'
                    }}
                  />
                  
                  <div className="flex justify-between items-center z-10 font-mono text-[8px] text-slate-500 font-extrabold uppercase mt-2 pointer-events-none">
                    <span>{slotCode}</span>
                    {isOccupied && <span className="text-rose-400 font-bold text-[7px] uppercase tracking-normal">FULL</span>}
                    {!isOccupied && <span className="text-emerald-400 font-bold text-[7px] uppercase tracking-normal">FREE</span>}
                  </div>
                  
                  {/* Render visual cars in slots */}
                  {isOccupied && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ transform: 'translateZ(4px)' }}>
                      <CartoonCar3D 
                        type={id === 1 ? 'offroad' : id === 5 ? 'crossover' : 'sedan'} 
                        color={id === 1 ? '#334155' : id === 5 ? '#eab308' : (reservation && reservation.vehicleType === 'motorcycle') ? '#be185d' : '#0e7490'} 
                        state="parked" 
                      />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Floating exhaust smoke particles */}
          {!interactive && smokeParticles.map((p) => (
            <motion.span 
              key={p.id}
              initial={{ scale: 0.3, opacity: 0.8, z: 6 }}
              animate={{ scale: 1.8, opacity: 0, z: 20 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="absolute w-2 h-2 rounded-full bg-slate-500/30 filter blur-[0.5px]"
              style={{
                left: `${p.x}px`,
                top: `${p.y}px`
              }}
            />
          ))}

          {/* ANIMATED CARS IN SIMULATION */}
          {/* CAR A (Teal Sedan) */}
          {!interactive && (
            <motion.div 
              animate={controlsCarA}
              className="absolute preserve-3d"
              style={{
                width: '56px',
                height: '36px',
                left: '25px',
                top: '0px',
                transformStyle: 'preserve-3d',
                willChange: 'transform'
              }}
            >
              <CartoonCar3D type="sedan" color="#0e7490" state={carAState} />
              
              {/* Dynamic Conical Headlight Beams */}
              {carAState === 'driving' && (
                <div className="absolute overflow-visible pointer-events-none" style={{ left: '54px', top: '10px', width: '50px', height: '16px', transform: 'translateZ(3px)' }}>
                  <svg className="w-full h-full overflow-visible" opacity="0.35">
                    <polygon points="0,8 50,0 50,16" fill="rgba(254, 240, 138, 0.75)" filter="blur(1.5px)" />
                  </svg>
                </div>
              )}
            </motion.div>
          )}

          {/* CAR B (Fuchsia SUV) */}
          {!interactive && (
            <motion.div 
              animate={controlsCarB}
              className="absolute preserve-3d"
              style={{
                width: '58px',
                height: '38px',
                left: '25px',
                top: '0px',
                transformStyle: 'preserve-3d',
                willChange: 'transform'
              }}
            >
              <CartoonCar3D type="suv" color="#be185d" state={carBState} />

              {/* Dynamic Conical Headlight Beams */}
              {carBState === 'driving' && (
                <div className="absolute overflow-visible pointer-events-none" style={{ left: '56px', top: '11px', width: '50px', height: '16px', transform: 'translateZ(3.5px)' }}>
                  <svg className="w-full h-full overflow-visible" opacity="0.35">
                    <polygon points="0,8 50,0 50,16" fill="rgba(254, 240, 138, 0.75)" filter="blur(1.5px)" />
                  </svg>
                </div>
              )}

              {/* Holographic HUD Callout pinned to Fuchsia SUV roof (only when driving/exiting) */}
              {carBState === 'driving' && (
                <div className="absolute overflow-visible pointer-events-none" style={{ top: 0, left: 0, width: '100%', height: '100%', transformStyle: 'preserve-3d' }}>
                  
                  {/* SVG curved cyan leader line */}
                  <svg className="absolute overflow-visible pointer-events-none z-30" style={{ top: -75, left: -25, width: 80, height: 80 }}>
                    <path 
                      d="M 15,10 Q 55,35 44,70" 
                      fill="none" 
                      stroke="#06b6d4" 
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      className="animate-pulse"
                    />
                    {/* Glowing Cyan anchor dot pinned to the roof */}
                    <circle cx="44" cy="70" r="3" fill="#06b6d4" className="shadow-[0_0_8px_#06b6d4]" />
                  </svg>

                  {/* Counter-rotated HUD Card facing the user perfectly */}
                  <div 
                    className="absolute glass-panel border border-cyan-500/40 rounded-xl p-2.5 tracking-wider uppercase font-mono shadow-2xl flex flex-col gap-0.5 pointer-events-auto"
                    style={{
                      width: '135px',
                      height: '52px',
                      left: '-105px',
                      top: '-120px',
                      transform: 'rotateZ(45deg) rotateX(-55deg) scale(0.95)',
                      transformOrigin: 'bottom right',
                      background: 'rgba(15, 23, 42, 0.85)',
                      boxShadow: '0 8px 32px 0 rgba(6, 182, 212, 0.25)',
                      borderColor: 'rgba(6, 182, 212, 0.4)'
                    }}
                  >
                    <div className="flex justify-between items-center text-[9px] font-black text-white border-b border-cyan-500/20 pb-1 mb-1">
                      <span>FUCHSIA_SUV_99</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    </div>
                    <div className="text-[7.5px] font-bold text-cyan-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_6px_#10b981]" />
                      STS: DISPATCH_ENGAGED
                    </div>
                    <div className="text-[7.5px] font-bold text-cyan-300/80">
                      TRAKS: SCAN_CLEAR_OK
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </motion.div>
      </div>

      {/* Cyber HUD Status Panel */}
      <div className="absolute bottom-4 right-4 w-[280px] z-20 flex gap-2.5 items-start bg-slate-950/80 border border-orange-500/30 border-l-4 border-l-orange-500 p-3 rounded-xl backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-orange-500/50">
        <Info size={14} className="text-orange-400 shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-0.5">
          <p className="text-[8px] font-black uppercase text-slate-400 font-mono tracking-wider flex items-center gap-1.5">
            Trạng thái hoạt động
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
          </p>
          <p className="text-[11px] font-bold text-slate-200 leading-snug tracking-wide">{hudMessage}</p>
        </div>
      </div>

    </div>
  );
}
