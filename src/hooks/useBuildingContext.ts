import { useOutletContext } from 'react-router-dom';

export interface BuildingContext {
  buildingId: string;
  building?: {
    _id: string;
    name: string;
    code: string;
    status?: 'active' | 'inactive' | 'maintenance';
    operatingHours?: { open: string; close: string };
  } | null;
}

export function useBuildingContext(): BuildingContext {
  return useOutletContext<BuildingContext>();
}
