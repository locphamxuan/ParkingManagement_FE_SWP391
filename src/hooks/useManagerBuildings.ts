import { useCallback, useEffect, useMemo, useState } from 'react';
import { managerApi, type ManagerBuilding } from '@/services/manager/managerApi';

export function useManagerBuildings() {
  const [buildings, setBuildings] = useState<ManagerBuilding[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBuildings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await managerApi.listAssignedBuildings();
      const raw = (res as { data?: ManagerBuilding[] | { items: ManagerBuilding[] } })?.data;
      const list: ManagerBuilding[] = Array.isArray(raw)
        ? raw
        : (raw as { items?: ManagerBuilding[] })?.items ?? [];
      setBuildings(list);
      if (list.length > 0) {
        setSelectedBuildingId((cur) => cur || list[0]._id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách tòa nhà.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshBuildings();
  }, [refreshBuildings]);

  const selectedBuilding = useMemo(
    () => buildings.find((b) => b._id === selectedBuildingId) ?? null,
    [buildings, selectedBuildingId],
  );

  return {
    buildings,
    selectedBuildingId,
    setSelectedBuildingId,
    selectedBuilding,
    refreshBuildings,
    isLoading,
    error,
  };
}
