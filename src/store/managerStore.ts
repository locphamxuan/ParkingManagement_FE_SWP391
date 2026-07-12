import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { managerApi, type ManagerBuilding } from '@/services/manager/managerApi';

interface ManagerState {
  buildings: ManagerBuilding[];
  selectedBuildingId: string | null;
  isLoading: boolean;
  error: string | null;
  loadBuildings: () => Promise<ManagerBuilding[]>;
  selectBuilding: (id: string) => void;
  reset: () => void;
}

const extractList = (payload: unknown): ManagerBuilding[] => {
  if (!payload || typeof payload !== 'object') return [];
  const d = (payload as { data?: unknown }).data;
  if (Array.isArray(d)) return d as ManagerBuilding[];
  if (d && typeof d === 'object') {
    const inner = (d as { items?: unknown }).items;
    if (Array.isArray(inner)) return inner as ManagerBuilding[];
    if ((d as { _id?: string })._id) return [d as ManagerBuilding];
  }
  return [];
};

export const useManagerStore = create<ManagerState>()(
  persist(
    (set, get) => ({
      buildings: [],
      selectedBuildingId: null,
      isLoading: false,
      error: null,
      async loadBuildings() {
        set({ isLoading: true, error: null });
        try {
          const res = await managerApi.listAssignedBuildings();
          const buildings = extractList(res);
          const current = get().selectedBuildingId;
          const stillAssigned = buildings.find((b) => b._id === current);
          set({
            buildings,
            selectedBuildingId: stillAssigned ? current : buildings[0]?._id ?? null,
            isLoading: false,
          });
          return buildings;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to load the building list';
          set({ error: message, isLoading: false });
          throw error;
        }
      },
      selectBuilding(id) {
        set({ selectedBuildingId: id });
      },
      reset() {
        set({ buildings: [], selectedBuildingId: null, error: null });
      },
    }),
    {
      name: 'pbms.manager.selection',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selectedBuildingId: state.selectedBuildingId }),
    }
  )
);

