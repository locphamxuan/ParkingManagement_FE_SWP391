import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Clock, DollarSign, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { managerApi, type ManagerBuilding } from '@/services/manager/managerApi';
import { useManagerBuildings } from '@/hooks/useManagerBuildings';

export function ManagerBuildingsPage() {
  const { buildings, selectedBuilding, selectedBuildingId, setSelectedBuildingId, isLoading, error, refreshBuildings } = useManagerBuildings();

  const [name, setName] = useState('');
  const [totalFloors, setTotalFloors] = useState('');
  const [status, setStatus] = useState<ManagerBuilding['status']>('active');
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!selectedBuilding) {
      setName('');
      setTotalFloors('');
      setStatus('active');
      setOpenTime('');
      setCloseTime('');
      setHourlyRate('');
      return;
    }
    setName(selectedBuilding.name || '');
    setTotalFloors(String(selectedBuilding.totalFloors ?? ''));
    setStatus(selectedBuilding.status || 'active');
    setOpenTime(selectedBuilding.operatingHours?.open || '');
    setCloseTime(selectedBuilding.operatingHours?.close || '');
    setHourlyRate(String(selectedBuilding.pricing?.hourlyRate ?? ''));
  }, [selectedBuilding]);

  const buildingOptions = useMemo(
    () => buildings.map((b) => ({ id: b._id, label: b.name || b.code || 'Tòa nhà' })),
    [buildings],
  );

  const handleSave = useCallback(async () => {
    if (!selectedBuildingId) {
      setSaveError('Chưa chọn tòa nhà.');
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const payload: Partial<ManagerBuilding> = {};
      if (name) payload.name = name;
      if (totalFloors) payload.totalFloors = Number(totalFloors);
      if (status) payload.status = status;
      if (openTime || closeTime) {
        payload.operatingHours = {
          open: openTime || selectedBuilding?.operatingHours?.open || '00:00',
          close: closeTime || selectedBuilding?.operatingHours?.close || '23:59',
        };
      }
      if (hourlyRate) {
        payload.pricing = {
          ...(selectedBuilding?.pricing ?? { hourlyRate: 0 }),
          hourlyRate: Number(hourlyRate),
        };
      }
      await managerApi.updateBuilding(selectedBuildingId, payload);
      await refreshBuildings();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Cập nhật tòa nhà thất bại.');
    } finally {
      setIsSaving(false);
    }
  }, [name, totalFloors, status, openTime, closeTime, hourlyRate, selectedBuildingId, selectedBuilding, refreshBuildings]);

  return (
    <div className="space-y-6">
      {/* Danh sách tòa nhà */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Building2 size={16} className="text-primary" />
            Danh sách tòa nhà
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải danh sách tòa nhà...</p>
          ) : error ? (
            <p className="text-sm text-rose-500">{error}</p>
          ) : buildings.length === 0 ? (
            <p className="text-sm text-muted-foreground">Không có tòa nhà nào được phân quyền.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {buildingOptions.map((opt) => {
                const b = buildings.find((x) => x._id === opt.id)!;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedBuildingId(opt.id)}
                    className={`rounded-2xl border p-4 text-left transition hover:border-primary/60 hover:bg-primary/5 ${
                      selectedBuildingId === opt.id ? 'border-primary bg-primary/8 shadow-sm' : 'border-border'
                    }`}
                  >
                    <p className="font-semibold text-foreground">{opt.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Mã: {b.code || '—'}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${b.status === 'active' ? 'bg-emerald-500' : b.status === 'maintenance' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                      <p className="text-xs text-muted-foreground">
                        {b.status === 'active' ? 'Hoạt động' : b.status === 'maintenance' ? 'Bảo trì' : 'Tạm dừng'}
                      </p>
                    </div>
                    {b.pricing?.hourlyRate != null && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {b.pricing.hourlyRate.toLocaleString('vi-VN')} ₫/giờ
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form chỉnh sửa */}
      {selectedBuilding && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cập nhật thông tin tòa nhà</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Tên tòa nhà */}
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-foreground">Tên tòa nhà</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập tên tòa nhà" />
              </div>

              {/* Số tầng */}
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-foreground">Số tầng</label>
                <Input
                  type="number"
                  min={1}
                  value={totalFloors}
                  onChange={(e) => setTotalFloors(e.target.value)}
                  placeholder="Ví dụ: 5"
                />
              </div>

              {/* Trạng thái — dropdown */}
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-foreground">Trạng thái</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ManagerBuilding['status'])}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="active">Hoạt động (active)</option>
                  <option value="inactive">Tạm dừng (inactive)</option>
                  <option value="maintenance">Bảo trì (maintenance)</option>
                </select>
              </div>

              {/* Giá theo giờ */}
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <DollarSign size={13} className="text-primary" /> Giá gửi xe / giờ (VND)
                </label>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="Ví dụ: 5000"
                />
              </div>
            </div>

            {/* Giờ hoạt động */}
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Clock size={13} className="text-primary" /> Giờ hoạt động
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1">
                  <span className="text-xs text-muted-foreground">Mở cửa</span>
                  <Input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="[color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-muted-foreground">Đóng cửa</span>
                  <Input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="[color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              </div>
            </div>

            {saveError && (
              <p className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-500">
                {saveError}
              </p>
            )}
            {saveSuccess && (
              <p className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
                Lưu thành công!
              </p>
            )}

            <Button onClick={handleSave} disabled={isSaving} className="gap-2 w-fit">
              <Save size={14} />
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
