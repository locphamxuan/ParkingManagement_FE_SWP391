import { useOutletContext } from 'react-router-dom';

export interface BuildingContext {
  buildingId: string;
}

export function useBuildingContext(): BuildingContext {
  return useOutletContext<BuildingContext>();
}
