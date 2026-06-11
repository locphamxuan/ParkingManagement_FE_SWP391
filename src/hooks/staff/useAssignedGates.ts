import { useEffect, useState } from 'react';
import { staffApi, extractShifts, type MyShift } from '@/services/staff/staffApi';

type Gate = NonNullable<MyShift['gate']>;

function sameLocalDay(iso: string, now: Date): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * Resolves the gate(s) the current staff is assigned to for today's shift(s).
 * Falls back to the most recent shift's gate when there is no shift dated today,
 * so the dashboard/nav still reflect where the staff works.
 *
 * `hasIn`  → assigned to an entry gate  → should do CHECK-IN.
 * `hasOut` → assigned to an exit gate   → should do CHECK-OUT.
 * A "both" gate counts as both. When no gate is assigned at all, both are false
 * and callers should show both actions (safe default, don't lock the staff out).
 */
export function useAssignedGates() {
  const [gates, setGates] = useState<Gate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    staffApi
      .myShifts()
      .then((res) => {
        if (cancelled) return;
        const shifts = extractShifts(res as Parameters<typeof extractShifts>[0]);
        const now = new Date();
        const today = shifts.filter((s) => sameLocalDay(s.workDate, now));
        const pick = today.length > 0 ? today : shifts.slice(0, 1);
        const map = new Map<string, Gate>();
        pick.forEach((s) => {
          if (s.gate?._id) map.set(s.gate._id, s.gate);
        });
        setGates(Array.from(map.values()));
      })
      .catch(() => setGates([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const hasIn = gates.some((g) => g.direction === 'in' || g.direction === 'both');
  const hasOut = gates.some((g) => g.direction === 'out' || g.direction === 'both');
  // No gate assigned → don't restrict; show both check-in and check-out.
  const unassigned = gates.length === 0;

  return {
    gates,
    loading,
    hasIn,
    hasOut,
    unassigned,
    showCheckIn: hasIn || unassigned,
    showCheckOut: hasOut || unassigned,
  };
}
