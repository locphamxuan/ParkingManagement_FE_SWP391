import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { managerApi } from '@/services/managerApi';
import { useAuth } from '@/hooks/useAuth';
import { useManagerBuildings } from '@/hooks/useManagerBuildings';

export function ManagerBuildingsPage() {
  const { session } = useAuth();
  const { buildings, selectedBuilding, selectedBuildingId, setSelectedBuildingId, isLoading, error, refreshBuildings } = useManagerBuildings();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [totalFloors, setTotalFloors] = useState('');
  const [status, setStatus] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!selectedBuilding) {
      setName('');
      setCode('');
      setTotalFloors('');
      setStatus('');
      return;
    }

    setName(String(selectedBuilding.name || ''));
    setCode(String(selectedBuilding.code || ''));
    setTotalFloors(String(selectedBuilding.totalFloors ?? ''));
    setStatus(String(selectedBuilding.status || ''));
  }, [selectedBuilding]);

  const buildingOptions = useMemo(
    () => buildings.map((building) => ({ id: building._id, name: building.name || building.code || 'Tòa nhà' })),
    [buildings],
  );

  const handleSave = useCallback(async () => {
    if (!selectedBuildingId || !session?.token) {
      setSaveError('Chưa chọn tòa nhà hoặc phiên hết hạn.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await managerApi.updateBuilding(
        selectedBuildingId,
        {
          ...(name ? { name } : {}),
          ...(code ? { code } : {}),
          ...(totalFloors ? { totalFloors: Number(totalFloors) } : {}),
          ...(status ? { status } : {}),
        },
        session.token,
      );
      await refreshBuildings();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Cập nhật tòa nhà thất bại.');
    } finally {
      setIsSaving(false);
    }
  }, [name, code, totalFloors, status, selectedBuildingId, session?.token, refreshBuildings]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Danh sách tòa nhà</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Đang tải danh sách tòa nhà...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : buildings.length === 0 ? (
            <p>Không có tòa nhà nào được phân quyền.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {buildings.map((building) => (
                <button
                  key={building._id}
                  type="button"
                  onClick={() => setSelectedBuildingId(building._id)}
                  className={`rounded-3xl border p-4 text-left transition hover:border-primary/60 hover:bg-slate-50 ${
                    selectedBuildingId === building._id ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <p className="font-semibold text-slate-900">{building.name || 'Tòa nhà chưa đặt tên'}</p>
                  <p className="mt-2 text-sm text-slate-600">Mã: {building.code || '---'}</p>
                  <p className="mt-1 text-sm text-slate-600">Trạng thái: {building.status || 'Chưa xác định'}</p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedBuilding ? (
        <Card>
          <CardHeader>
            <CardTitle>Cập nhật thông tin tòa nhà</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm text-slate-600">Tên tòa nhà</label>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm text-slate-600">Mã tòa nhà</label>
              <Input value={code} onChange={(event) => setCode(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm text-slate-600">Số tầng</label>
              <Input value={totalFloors} onChange={(event) => setTotalFloors(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm text-slate-600">Trạng thái</label>
              <Input value={status} onChange={(event) => setStatus(event.target.value)} placeholder="active | inactive | maintenance" />
            </div>
            {saveError ? <p className="text-sm text-red-600">{saveError}</p> : null}
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
