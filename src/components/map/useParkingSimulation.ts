import { useEffect, useState } from 'react';
import { useAnimation } from 'framer-motion';

/**
 * Vòng lặp mô phỏng bãi đỗ 3D (2 xe vào/ra, cổng, khói xả, HUD) tách khỏi
 * AnimatedParkingMap3D để component chỉ còn phần render. Ở chế độ `interactive`
 * thì dừng mô phỏng, hiển thị hướng dẫn chọn ô.
 */
export function useParkingSimulation(interactive: boolean) {
  const [hudMessage, setHudMessage] = useState('Starting simulation system...');
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
      setHudMessage('Please select an available (green) slot on the map.');
      return;
    }

    let active = true;

    async function runSimulationLoop() {
      if (!active) return;

      // Phase 0: Reset states
      setSimPhase(0);
      setHudMessage('System running smoothly. 3 available slots.');
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
      setHudMessage('Gate 1: Detecting incoming Cyan EV...');
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
      setHudMessage('Cyan Sedan is moving along the lane...');

      // Drive to Slot 3 alignment
      await controlsCarA.start({
        x: 190,
        y: 160,
        transition: { ease: 'linear', duration: 1.2 }
      });
      if (!active) return;

      setHudMessage('Aligning parking angle. Activating reverse sensors...');
      setCarAState('parking');

      // Turn 90 degrees to face away from slot
      await controlsCarA.start({
        rotateZ: 0,
        transition: { duration: 0.5 }
      });
      if (!active) return;

      // Reverse Park into Slot 3
      setHudMessage('Reversing into slot 3...');
      await controlsCarA.start({
        y: 30,
        transition: { type: 'spring', stiffness: 40, damping: 12 }
      });
      if (!active) return;

      setCarAState('parked');
      setHudMessage('Cyan Sedan parked at slot 3. Starting EV charging.');

      await new Promise((resolve) => setTimeout(resolve, 3000));
      if (!active) return;

      // PHASE 2: Car B (Fuchsia SUV) Exits
      setSimPhase(2);
      setHudMessage('Command received: Fuchsia SUV at slot 4 preparing to exit...');
      setCarBState('driving');

      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!active) return;

      // Turn on headlights and drive out of slot 4
      setHudMessage('Fuchsia SUV is leaving slot 4...');
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

      setHudMessage('Moving toward toll gate 2...');
      setGateBOpen(true);

      // Drive to exit gate
      await controlsCarB.start({
        x: 380,
        y: 160,
        transition: { ease: 'linear', duration: 1.2 }
      });
      if (!active) return;

      setHudMessage('RFID scan successful. Toll gate 2 open.');

      // Exit screen
      await controlsCarB.start({
        x: 520,
        transition: { type: 'spring', stiffness: 50, damping: 12 }
      });
      if (!active) return;

      setGateBOpen(false);
      setHudMessage('Fuchsia SUV has left. Transaction successful.');

      await new Promise((resolve) => setTimeout(resolve, 3000));
      if (!active) return;

      // Loop restart
      runSimulationLoop();
    }

    runSimulationLoop();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return {
    hudMessage, simPhase,
    gateAOpen, gateBOpen,
    carAState, carBState,
    smokeParticles,
    controlsCarA, controlsCarB,
  };
}
