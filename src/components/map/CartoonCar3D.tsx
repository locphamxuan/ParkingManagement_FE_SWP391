import { motion } from 'framer-motion';

export interface CartoonCar3DProps {
  type?: 'sedan' | 'suv' | 'sportscar' | 'offroad' | 'minivan' | 'pickup' | 'luxury' | 'hatchback' | 'cargovan' | 'crossover';
  color?: string; // Hex color for car paint
  state?: 'driving' | 'parking' | 'parked';
}

// Reusable color brightener/darkener for volumetric shading
function adjustColorBrightness(hex: string, percent: number): string {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  let r = parseInt(cleanHex.substring(0, 2), 16);
  let g = parseInt(cleanHex.substring(2, 4), 16);
  let b = parseInt(cleanHex.substring(4, 6), 16);

  r = Math.max(0, Math.min(255, r + (percent * 255) / 100));
  g = Math.max(0, Math.min(255, g + (percent * 255) / 100));
  b = Math.max(0, Math.min(255, b + (percent * 255) / 100));

  const rHex = Math.round(r).toString(16).padStart(2, '0');
  const gHex = Math.round(g).toString(16).padStart(2, '0');
  const bHex = Math.round(b).toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

export function CartoonCar3D({ 
  type = 'sedan', 
  color = '#f97316', 
  state = 'driving' 
}: CartoonCar3DProps) {
  
  const isMoving = state === 'driving' || state === 'parking';

  // Spin animation settings for rims
  const spinTransition = {
    repeat: Infinity,
    duration: 0.3,
    ease: 'linear'
  };

  // Generate light and dark shades dynamically for perfect volumetric look
  const shades = {
    base: color,
    light: adjustColorBrightness(color, 25),
    dark: adjustColorBrightness(color, -25),
    highlight: adjustColorBrightness(color, 45)
  };

  // Normalize backward compatibility types
  let activeType = type;
  if (activeType === 'sportscar') {
    activeType = 'hatchback';
  }

  // Reusable wheel renderer projected into isometric perspective
  const renderWheel = (cx: number, cy: number, radius = 9, hasRedCaliper = false) => {
    return (
      <g transform={`translate(${cx}, ${cy})`}>
        <g transform="skewY(-30) scale(1, 0.866)">
          <motion.g
            animate={isMoving ? { rotate: 360 } : {}}
            transition={spinTransition}
            style={{ transformOrigin: 'center' }}
          >
            {/* Outer rubber tire */}
            <circle cx="0" cy="0" r={radius} fill="#090d16" stroke="#1e293b" strokeWidth="1" />
            <circle cx="0" cy="0" r={radius * 0.8} fill="#1e293b" />
            
            {/* Brake Caliper (sports red) */}
            {hasRedCaliper && (
              <path d="M -5 -2 A 6 6 0 0 1 -2 -5" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            )}

            {/* Silver spoke rims */}
            <circle cx="0" cy="0" r={radius * 0.6} fill="none" stroke="#e2e8f0" strokeWidth="1.2" />
            <path d="M -6 0 L 6 0 M 0 -6 L 0 6 M -4.2 -4.2 L 4.2 4.2 M -4.2 4.2 L 4.2 -4.2" stroke="#e2e8f0" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="2.2" fill="#475569" stroke="#94a3b8" strokeWidth="0.5" />
          </motion.g>
        </g>
      </g>
    );
  };

  // 1. VEHICLE: Off-Road SUV (G-Wagon boxy style)
  if (activeType === 'offroad') {
    return (
      <div className="relative w-[62px] h-[48px] preserve-3d" style={{ transformStyle: 'preserve-3d' }}>
        <motion.div 
          animate={isMoving ? { scale: [0.96, 1.02, 0.96], opacity: [0.55, 0.65, 0.55] } : {}}
          transition={{ repeat: Infinity, duration: 0.5, ease: 'easeInOut' }}
          className="absolute inset-x-0 bottom-[-4px] h-[34px] rounded-full bg-slate-950/70 filter blur-[4px] mix-blend-multiply pointer-events-none"
          style={{ transform: 'translateZ(-2px)' }}
        />
        <svg viewBox="0 0 100 75" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="offroadBody" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={shades.dark} />
              <stop offset="50%" stopColor={shades.base} />
              <stop offset="100%" stopColor={shades.light} />
            </linearGradient>
            <linearGradient id="offroadRoof" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={shades.light} />
              <stop offset="100%" stopColor={shades.base} />
            </linearGradient>
            <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c0f0fc" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
          </defs>

          {/* Spare Wheel container on tailgate */}
          <ellipse cx="14" cy="38" rx="4.5" ry="7.5" fill="#0f172a" stroke="#cbd5e1" strokeWidth="0.8" />
          <circle cx="14" cy="36" r="3" fill="#cbd5e1" />

          {/* Boxy main chassis */}
          <path d="M 18,38 L 18,48 C 18,52 24,54 30,54 L 76,54 C 82,54 88,51 88,47 L 88,38 Z" fill="url(#offroadBody)" />
          
          {/* Wheel Wells */}
          <path d="M 22,54 C 22,47 34,47 34,54 Z" fill="#090d16" />
          <path d="M 66,54 C 66,47 78,47 78,54 Z" fill="#090d16" />

          {/* Side steel bars */}
          <path d="M 22,42 L 80,42" stroke="#090d16" strokeWidth="2.5" />

          {/* Boxy cabin */}
          <path d="M 22,20 L 74,20 L 76,38 L 20,38 Z" fill="url(#offroadRoof)" />
          
          {/* Windows */}
          <path d="M 67,21 L 73,21 L 75,37 L 65,37 Z" fill="url(#glass)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
          <path d="M 26,22 L 62,22 L 60,37 L 22,37 Z" fill="url(#glass)" />
          <line x1="39" y1="22" x2="37" y2="37" stroke="#090d16" strokeWidth="2" />
          <line x1="52" y1="22" x2="50" y2="37" stroke="#090d16" strokeWidth="2" />

          {/* Circular yellow glow headlights */}
          <circle cx="84" cy="43" r="2.5" fill="#fef08a" filter="drop-shadow(0 0 3px #fef08a)" />
          
          {/* Volumetric side mirrors */}
          <ellipse cx="64" cy="33" rx="1.5" ry="2.5" fill={shades.base} />

          {/* Projected Wheels */}
          {renderWheel(28, 54, 9.5)}
          {renderWheel(72, 54, 9.5)}
        </svg>
      </div>
    );
  }

  // 2. VEHICLE: Passenger-Minivan (HiAce style)
  if (activeType === 'minivan') {
    return (
      <div className="relative w-[64px] h-[48px] preserve-3d" style={{ transformStyle: 'preserve-3d' }}>
        <motion.div 
          animate={isMoving ? { scale: [0.96, 1.02, 0.96], opacity: [0.55, 0.65, 0.55] } : {}}
          transition={{ repeat: Infinity, duration: 0.5, ease: 'easeInOut' }}
          className="absolute inset-x-0 bottom-[-4px] h-[34px] rounded-full bg-slate-950/70 filter blur-[4px] mix-blend-multiply pointer-events-none"
          style={{ transform: 'translateZ(-2px)' }}
        />
        <svg viewBox="0 0 100 75" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="minivanBody" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={shades.dark} />
              <stop offset="50%" stopColor={shades.base} />
              <stop offset="100%" stopColor={shades.light} />
            </linearGradient>
            <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c0f0fc" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
          </defs>

          {/* Long van body */}
          <path d="M 12,22 L 78,22 L 88,38 L 88,52 L 12,52 Z" fill="url(#minivanBody)" />

          {/* Wheel Wells */}
          <path d="M 22,52 C 22,46 34,46 34,52 Z" fill="#090d16" />
          <path d="M 66,52 C 66,46 78,46 78,52 Z" fill="#090d16" />

          {/* Sloped windshield */}
          <path d="M 76,23 L 84,33 L 86,37 L 74,37 Z" fill="url(#glass)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
          <line x1="79" y1="24" x2="83" y2="35" stroke="#ffffff" strokeWidth="1.2" opacity="0.6" />

          {/* Multiple side windows */}
          <path d="M 16,24 L 30,24 L 30,36 L 16,36 Z" fill="url(#glass)" />
          <path d="M 34,24 L 48,24 L 48,36 L 34,36 Z" fill="url(#glass)" />
          <path d="M 52,24 L 66,24 L 66,36 L 52,36 Z" fill="url(#glass)" />
          <path d="M 70,24 L 73,24 L 71,36 L 68,36 Z" fill="url(#glass)" />

          {/* Headlights */}
          <path d="M 85,42 C 85,40 88,40 88,42 L 88,45 C 88,47 85,47 85,45 Z" fill="#fef08a" />

          {/* Projected Wheels */}
          {renderWheel(28, 52, 9)}
          {renderWheel(72, 52, 9)}
        </svg>
      </div>
    );
  }

  // 3. VEHICLE: Pickup-Truck (Hilux style double-cab)
  if (activeType === 'pickup') {
    return (
      <div className="relative w-[64px] h-[48px] preserve-3d" style={{ transformStyle: 'preserve-3d' }}>
        <motion.div 
          animate={isMoving ? { scale: [0.96, 1.02, 0.96], opacity: [0.55, 0.65, 0.55] } : {}}
          transition={{ repeat: Infinity, duration: 0.5, ease: 'easeInOut' }}
          className="absolute inset-x-0 bottom-[-4px] h-[34px] rounded-full bg-slate-950/70 filter blur-[4px] mix-blend-multiply pointer-events-none"
          style={{ transform: 'translateZ(-2px)' }}
        />
        <svg viewBox="0 0 100 75" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="pickupBody" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={shades.dark} />
              <stop offset="50%" stopColor={shades.base} />
              <stop offset="100%" stopColor={shades.light} />
            </linearGradient>
            <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c0f0fc" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
          </defs>

          {/* Cabin background wall */}
          <path d="M 40,24 L 74,24 L 78,38 L 36,38 Z" fill="url(#pickupBody)" />

          {/* Hollow cargo bed dark liner */}
          <path d="M 12,38 L 36,38 L 36,52 L 12,52 Z" fill="#1e293b" />
          {/* Cargo bed side panels */}
          <path d="M 10,40 L 40,40 L 40,53 L 10,53 Z" fill="url(#pickupBody)" />

          {/* Front cabin styling */}
          <path d="M 40,40 L 82,40 C 86,40 90,43 90,47 L 90,53 L 40,53 Z" fill="url(#pickupBody)" />

          {/* Wheel Wells */}
          <path d="M 22,53 C 22,46 34,46 34,53 Z" fill="#090d16" />
          <path d="M 66,53 C 66,46 78,46 78,53 Z" fill="#090d16" />

          {/* Front cabin windshield & windows */}
          <path d="M 68,25 L 73,25 L 77,37 L 66,37 Z" fill="url(#glass)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
          <path d="M 42,25 L 62,25 L 59,37 L 38,37 Z" fill="url(#glass)" />
          <line x1="52" y1="25" x2="49" y2="37" stroke="#090d16" strokeWidth="2.2" />

          {/* Rugged bottom side step */}
          <rect x="38" y="52" width="24" height="1.5" rx="0.5" fill="#475569" />

          {/* Headlights */}
          <path d="M 86,43 C 86,41 89,41 89,43 L 89,46 C 89,48 86,48 86,46 Z" fill="#fef08a" />

          {/* Projected Wheels with sports red calipers */}
          {renderWheel(28, 53, 9.5, true)}
          {renderWheel(72, 53, 9.5, true)}
        </svg>
      </div>
    );
  }

  // 4. VEHICLE: Luxury-Sedan (Lexus/Camry premium look)
  if (activeType === 'luxury') {
    return (
      <div className="relative w-[60px] h-[44px] preserve-3d" style={{ transformStyle: 'preserve-3d' }}>
        <motion.div 
          animate={isMoving ? { scale: [0.95, 1.01, 0.95], opacity: [0.55, 0.65, 0.55] } : {}}
          transition={{ repeat: Infinity, duration: 0.5, ease: 'easeInOut' }}
          className="absolute inset-x-0.5 bottom-[-2px] h-[28px] rounded-full bg-slate-950/70 filter blur-[3.5px] mix-blend-multiply pointer-events-none"
          style={{ transform: 'translateZ(-2px)' }}
        />
        <svg viewBox="0 0 100 70" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="luxuryBody" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={shades.dark} />
              <stop offset="50%" stopColor={shades.base} />
              <stop offset="100%" stopColor={shades.light} />
            </linearGradient>
            <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c0f0fc" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
          </defs>

          {/* Long executive body */}
          <path d="M 10,38 L 10,45 C 10,49 16,52 22,52 L 80,52 L 88,44 L 88,38 Z" fill="url(#luxuryBody)" />
          
          {/* Wheel Wells */}
          <path d="M 22,52 C 22,45 34,45 34,52 Z" fill="#090d16" />
          <path d="M 66,52 C 66,45 78,45 78,52 Z" fill="#090d16" />

          {/* Chrome side molding */}
          <line x1="16" y1="41" x2="80" y2="41" stroke="#e2e8f0" strokeWidth="1.2" opacity="0.8" />

          {/* Large trapezoidal front grille */}
          <path d="M 83,43 L 88,43 L 86,51 L 81,51 Z" fill="#090d16" stroke="#cbd5e1" strokeWidth="0.8" />
          <line x1="84" y1="46" x2="87" y2="46" stroke="#cbd5e1" strokeWidth="0.5" />
          <line x1="83" y1="49" x2="86" y2="49" stroke="#cbd5e1" strokeWidth="0.5" />

          {/* Cabin */}
          <path d="M 26,38 L 74,38 L 65,22 L 34,22 Z" fill="url(#luxuryBody)" />
          
          {/* Windshield & Windows */}
          <path d="M 58,23 L 63,23 L 69,37 L 57,37 Z" fill="url(#glass)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
          <path d="M 34,24 L 54,24 L 50,37 L 28,37 Z" fill="url(#glass)" />
          <line x1="43" y1="24" x2="40" y2="37" stroke="#090d16" strokeWidth="2.2" />

          {/* Dynamic LED Headlights */}
          <path d="M 85,39 C 85,37 87,37 87,39 L 87,41 C 87,43 85,43 85,41 Z" fill="#fef08a" filter="drop-shadow(0 0 3px #fef08a)" />

          {/* Alloy wheels */}
          {renderWheel(28, 52, 9)}
          {renderWheel(72, 52, 9)}
        </svg>
      </div>
    );
  }

  // 5. VEHICLE: Sport-Hatchback (Civic Type-R style with GT-Wing)
  if (activeType === 'hatchback') {
    return (
      <div className="relative w-[60px] h-[44px] preserve-3d" style={{ transformStyle: 'preserve-3d' }}>
        <motion.div 
          animate={isMoving ? { scale: [0.95, 1.01, 0.95], opacity: [0.55, 0.65, 0.55] } : {}}
          transition={{ repeat: Infinity, duration: 0.5, ease: 'easeInOut' }}
          className="absolute inset-x-0.5 bottom-[-2px] h-[28px] rounded-full bg-slate-950/70 filter blur-[3.5px] mix-blend-multiply pointer-events-none"
          style={{ transform: 'translateZ(-2px)' }}
        />
        <svg viewBox="0 0 100 70" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="hatchBody" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={shades.dark} />
              <stop offset="50%" stopColor={shades.base} />
              <stop offset="100%" stopColor={shades.light} />
            </linearGradient>
            <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c0f0fc" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
          </defs>

          {/* Double GT-Wing struts & plate */}
          <line x1="12" y1="26" x2="12" y2="38" stroke="#090d16" strokeWidth="1.5" />
          <line x1="18" y1="26" x2="18" y2="38" stroke="#090d16" strokeWidth="1.5" />
          <path d="M 8,26 L 24,26" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" />

          {/* Aerodynamic chassis with bottom body kit red lines */}
          <path d="M 12,38 L 10,44 C 10,48 16,51 22,51 L 80,51 L 86,45 L 86,38 Z" fill="url(#hatchBody)" />
          
          {/* Wheel Wells */}
          <path d="M 22,51 C 22,44 34,44 34,51 Z" fill="#090d16" />
          <path d="M 66,51 C 66,44 78,44 78,51 Z" fill="#090d16" />

          {/* Front aero Splitter */}
          <path d="M 80,51 L 88,51" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          {/* Side skirt red trim */}
          <line x1="34" y1="51" x2="66" y2="51" stroke="#ef4444" strokeWidth="1.2" />

          {/* Cabin */}
          <path d="M 22,38 L 68,38 L 60,24 L 28,24 Z" fill="url(#hatchBody)" />
          
          {/* Glass */}
          <path d="M 54,25 L 59,25 L 64,37 L 53,37 Z" fill="url(#glass)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
          <path d="M 29,25 L 50,25 L 46,37 L 23,37 Z" fill="url(#glass)" />
          <line x1="38" y1="25" x2="35" y2="37" stroke="#090d16" strokeWidth="2" />

          {/* Sports side mirror */}
          <ellipse cx="53" cy="33" rx="1.2" ry="2" fill="#ef4444" />

          {/* Projected wheels with red calipers */}
          {renderWheel(28, 51, 9, true)}
          {renderWheel(72, 51, 9, true)}
        </svg>
      </div>
    );
  }

  // 6. VEHICLE: Cargo-Van (Ford Transit high-roof windowless back)
  if (activeType === 'cargovan') {
    return (
      <div className="relative w-[64px] h-[52px] preserve-3d" style={{ transformStyle: 'preserve-3d' }}>
        <motion.div 
          animate={isMoving ? { scale: [0.96, 1.02, 0.96], opacity: [0.55, 0.65, 0.55] } : {}}
          transition={{ repeat: Infinity, duration: 0.5, ease: 'easeInOut' }}
          className="absolute inset-x-0 bottom-[-4px] h-[34px] rounded-full bg-slate-950/70 filter blur-[4px] mix-blend-multiply pointer-events-none"
          style={{ transform: 'translateZ(-2px)' }}
        />
        <svg viewBox="0 0 100 75" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="vanBody" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={shades.dark} />
              <stop offset="50%" stopColor={shades.base} />
              <stop offset="100%" stopColor={shades.light} />
            </linearGradient>
            <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c0f0fc" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
          </defs>

          {/* Windowless rear cargo cabin */}
          <path d="M 12,18 L 66,18 L 66,52 L 12,52 Z" fill="url(#vanBody)" />
          {/* Panel door lines */}
          <line x1="38" y1="18" x2="38" y2="52" stroke="rgba(0,0,0,0.2)" strokeWidth="1.2" />

          {/* Front driver cabin */}
          <path d="M 66,28 L 82,28 L 88,38 L 88,52 L 66,52 Z" fill="url(#vanBody)" />

          {/* Wheel Wells */}
          <path d="M 22,52 C 22,46 34,46 34,52 Z" fill="#090d16" />
          <path d="M 66,52 C 66,46 78,46 78,52 Z" fill="#090d16" />

          {/* Driver windshield & windows */}
          <path d="M 78,29 L 84,37 L 76,37 Z" fill="url(#glass)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
          <path d="M 68,29 L 74,29 L 72,37 L 66,37 Z" fill="url(#glass)" />

          {/* Big utility side mirror */}
          <rect x="71" y="31" width="1.5" height="4" rx="0.5" fill="#1e293b" />

          {/* Projected Wheels */}
          {renderWheel(28, 52, 9)}
          {renderWheel(72, 52, 9)}
        </svg>
      </div>
    );
  }

  // 7. VEHICLE: Compact-Crossover (Kona/Duster with roof rack & bottom cladding)
  if (activeType === 'crossover') {
    return (
      <div className="relative w-[62px] h-[48px] preserve-3d" style={{ transformStyle: 'preserve-3d' }}>
        <motion.div 
          animate={isMoving ? { scale: [0.96, 1.02, 0.96], opacity: [0.55, 0.65, 0.55] } : {}}
          transition={{ repeat: Infinity, duration: 0.5, ease: 'easeInOut' }}
          className="absolute inset-x-0 bottom-[-4px] h-[34px] rounded-full bg-slate-950/70 filter blur-[4px] mix-blend-multiply pointer-events-none"
          style={{ transform: 'translateZ(-2px)' }}
        />
        <svg viewBox="0 0 100 75" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="crossoverBody" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={shades.dark} />
              <stop offset="50%" stopColor={shades.base} />
              <stop offset="100%" stopColor={shades.light} />
            </linearGradient>
            <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c0f0fc" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
          </defs>

          {/* Steel cage roof rack */}
          <path d="M 28,18 L 68,18 M 34,16 L 62,16" stroke="#475569" strokeWidth="2" fill="none" strokeLinecap="round" />
          <line x1="40" y1="16" x2="40" y2="20" stroke="#475569" strokeWidth="1.5" />
          <line x1="56" y1="16" x2="56" y2="20" stroke="#475569" strokeWidth="1.5" />

          {/* Main body */}
          <path d="M 12,38 L 12,46 C 12,50 18,53 24,53 L 78,53 C 84,53 88,50 88,46 L 88,38 Z" fill="url(#crossoverBody)" />

          {/* Matte Black bottom cladding */}
          <path d="M 10,46 L 90,46 L 90,53 L 10,53 Z" fill="#1e293b" opacity="0.9" />

          {/* Wheel Wells */}
          <path d="M 22,53 C 22,46 34,46 34,53 Z" fill="#090d16" />
          <path d="M 66,53 C 66,46 78,46 78,53 Z" fill="#090d16" />

          {/* Cabin */}
          <path d="M 24,38 L 74,38 L 68,22 L 32,22 Z" fill="url(#crossoverBody)" />
          
          {/* Glass */}
          <path d="M 62,23 L 67,23 L 72,37 L 61,37 Z" fill="url(#glass)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
          <path d="M 32,24 L 58,24 L 54,37 L 26,37 Z" fill="url(#glass)" />
          <line x1="45" y1="24" x2="42" y2="37" stroke="#090d16" strokeWidth="2" />

          {/* Projected Wheels */}
          {renderWheel(28, 53, 9.5)}
          {renderWheel(72, 53, 9.5)}
        </svg>
      </div>
    );
  }

  // 8. VEHICLE: Premium-SUV (Land Cruiser style)
  // 9. VEHICLE: Compact-Sedan (Default - Sedan)
  return (
    <div className="relative w-[60px] h-[44px] preserve-3d" style={{ transformStyle: 'preserve-3d' }}>
      
      {/* Under-car shadow */}
      <motion.div 
        animate={isMoving ? { scale: [0.95, 1.01, 0.95], opacity: [0.55, 0.65, 0.55] } : {}}
        transition={{ repeat: Infinity, duration: 0.5, ease: 'easeInOut' }}
        className="absolute inset-x-0.5 bottom-[-2px] h-[28px] rounded-full bg-slate-950/70 filter blur-[3.5px] mix-blend-multiply pointer-events-none"
        style={{ transform: 'translateZ(-2px)' }}
      />

      {/* Photorealistic Isometric Sedan SVG Illustration */}
      <svg viewBox="0 0 100 70" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="sedanBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={shades.dark} />
            <stop offset="50%" stopColor={shades.base} />
            <stop offset="100%" stopColor={shades.light} />
          </linearGradient>
          <linearGradient id="sedanRoof" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={shades.light} />
            <stop offset="100%" stopColor={shades.base} />
          </linearGradient>
          <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c0f0fc" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
        </defs>

        {/* LOWER CHASSIS */}
        <path d="M 10,40 L 10,46 C 10,50 16,53 22,53 L 78,53 C 84,53 90,50 90,46 L 90,38 Z" fill="url(#sedanBody)" />
        
        {/* Elegant chrome accent */}
        <path d="M 16,42 L 84,42" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" opacity="0.6" />

        {/* Wheel wells */}
        <path d="M 22,53 C 22,46 34,46 34,53 Z" fill="#090d16" />
        <path d="M 66,53 C 66,46 78,46 78,53 Z" fill="#090d16" />

        {/* Windshield & lights */}
        <path d="M 86,39 C 86,37 89,37 89,39 L 89,42 C 89,44 86,44 86,42 Z" fill="#fef08a" filter="drop-shadow(0 0 3px #fef08a)" />

        {/* UPPER CABIN */}
        <path d="M 24,38 L 72,38 L 64,24 L 32,24 Z" fill="url(#sedanRoof)" />

        {/* Windshield glare */}
        <path d="M 60,25 L 65,25 L 70,37 L 58,37 Z" fill="url(#glass)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
        <line x1="62" y1="26" x2="66" y2="36" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />

        {/* Side windows with vertical black pillars */}
        <path d="M 32,25 L 56,25 L 52,37 L 26,37 Z" fill="url(#glass)" />
        <line x1="44" y1="25" x2="41" y2="37" stroke="#090d16" strokeWidth="2" />

        {/* Side Mirror */}
        <ellipse cx="58" cy="34" rx="1.2" ry="2" fill={shades.base} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />

        {/* Projected Wheels */}
        {renderWheel(28, 53, 9)}
        {renderWheel(72, 53, 9)}
      </svg>
    </div>
  );
}
