import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useManagerBuildings } from '@/hooks/useManagerBuildings';
import { managerApi } from '@/services/managerApi';

export function ManagerVehicleTypesPage() {
  const { session } = useAuth();
  const { selectedBuilding, selectedBuildingId, setSelectedBuildingId, buildings, isLoading, error } = useManagerBuildings();
  const [vehicleTypes, setVehicleTypes] = useState<Array<{ _id: string; name: string; description?: string }>>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDescription, setNewTypeDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadVehicleTypes = useCallback(async () => {
    if (!selectedBuildingId || !session?.token) {
      setVehicleTypes([]);
      return;
    }

    try {
      const types = await managerApi.listVehicleTypes(selectedBuildingId, session.token);
      setVehicleTypes(types);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Không thể tải loại xe.');
    }
  }, [selectedBuildingId, session?.token]);

  useEffect(() => {
    void loadVehicleTypes();
  }, [loadVehicleTypes]);

  const createVehicleType = useCallback(async () => {
    if (!selectedBuildingId || !session?.token || !newTypeName.trim()) {
      setFeedback('Vui lòng chọn tòa nhà và điền tên loại xe.');
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      await managerApi.createVehicleType(
        selectedBuildingId,
        { name: newTypeName.trim(), description: newTypeDescription.trim() || undefined },
        session.token,
      );
      setNewTypeName('');
      setNewTypeDescription('');
      await loadVehicleTypes();
      setFeedback('Loại xe đã được tạo.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Lỗi khi tạo loại xe.');
    } finally {
      setIsSaving(false);
    }
  }, [selectedBuildingId, session?.token, newTypeName, newTypeDescription, loadVehicleTypes]);

  const removeType = useCallback(
    async (typeId: string) => {
      if (!selectedBuildingId || !session?.token) return;
      try {
        await managerApi.removeVehicleType(selectedBuildingId, typeId, session.token);
        await loadVehicleTypes();
        setFeedback('Đã xóa loại xe.');
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Lỗi khi xóa loại xe.');
      }
    },
    [selectedBuildingId, session?.token, loadVehicleTypes],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Loại xe</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Đang tải tòa nhà...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : buildings.length === 0 ? (
            <p>Không tìm thấy tòa nhà để quản lý loại xe.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-slate-700">Tòa nhà</label>
              <select
                className="w-full rounded-2xl border border-border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition hover:border-slate-400"
                value={selectedBuildingId}
                onChange={(event) => setSelectedBuildingId(event.target.value)}
              >
                {buildings.map((building) => (
                  <option key={building._id} value={building._id}>
                    {building.name || building.code || 'Tòa nhà không tên'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách loại xe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {vehicleTypes.length === 0 ? (
            <p className="text-sm text-slate-600">Chưa có loại xe nào. Hãy thêm loại mới.</p>
          ) : (
            <div className="space-y-3">
              {vehicleTypes.map((type) => (
                <div key={type._id} className="rounded-3xl border border-border p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{type.name}</p>
                      {type.description ? <p className="text-sm text-slate-600">{type.description}</p> : null}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => void removeType(type._id)}>
                      Xóa
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {feedback ? <p className="text-sm text-slate-700">{feedback}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thêm loại xe mới</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm text-slate-600">Tên loại xe</label>
            <Input value={newTypeName} onChange={(event) => setNewTypeName(event.target.value)} placeholder="Ví dụ: Xe máy, Ô tô" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm text-slate-600">Mô tả ngắn</label>
            <textarea
              value={newTypeDescription}
              onChange={(event) => setNewTypeDescription(event.target.value)}
              className="min-h-[120px] w-full rounded-2xl border border-border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition hover:border-slate-400"
              placeholder="Có thể ghi khoảng giá, đặc điểm loại xe..."
            />
          </div>
          <Button onClick={createVehicleType} disabled={isSaving || !selectedBuildingId}>
            {isSaving ? 'Đang tạo...' : 'Tạo loại xe'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
