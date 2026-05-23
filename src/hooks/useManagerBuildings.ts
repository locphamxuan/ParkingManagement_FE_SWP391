import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { managerApi, type ManagerBuildingRecord } from '@/services/managerApi';

export function useManagerBuildings() {
  const { session } = useAuth();
  const [buildings, setBuildings] = useState<ManagerBuildingRecord[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = session?.token;

  const refreshBuildings = useCallback(async () => {
    if (!token) {
      setBuildings([]);
      setError('Không tìm thấy phiên đăng nhập.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await managerApi.getAssignedBuildings(token);
      setBuildings(response);
      if (response.length > 0) {
        setSelectedBuildingId((current) => current || response[0]._id);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Không thể tải danh sách tòa nhà.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refreshBuildings();
  }, [refreshBuildings]);

  const selectedBuilding = useMemo(
    () => buildings.find((building) => building._id === selectedBuildingId) ?? null,
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
