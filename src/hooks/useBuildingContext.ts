import { useOutletContext } from 'react-router-dom';
import type { SubscriptionStatus } from '@/services/manager/managerApi';

export interface BuildingContext {
  buildingId: string;
  building?: {
    _id: string;
    name: string;
    code: string;
    status?: 'active' | 'inactive' | 'maintenance';
    operatingHours?: { open: string; close: string };
  } | null;
  /** Manager-only: the building's admin-subscription status (gates the dashboard). */
  subscription?: SubscriptionStatus | null;
  /** Manager-only: re-fetch the subscription status (call after buying a package). */
  refreshSubscription?: () => void;
}

export function useBuildingContext(): BuildingContext {
  return useOutletContext<BuildingContext>();
}
