import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/ui/select';
import { managerApi, type ManagerBuilding } from '@/services/manager/managerApi';
import { useManagerBuildings } from '@/hooks/useManagerBuildings';

export function ManagerBuildingsPage() {
  const { buildings, selectedBuilding, selectedBuildingId, setSelectedBuildingId, isLoading, error, refreshBuildings } = useManagerBuildings();

  const [name, setName] = useState('');
  const [totalFloors, setTotalFloors] = useState('');
  const [status, setStatus] = useState<ManagerBuilding['status']>('active');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!selectedBuilding) {
      setName('');
      setTotalFloors('');
      setStatus('active');
      return;
    }
    setName(selectedBuilding.name || '');
    setTotalFloors(String(selectedBuilding.totalFloors ?? ''));
    setStatus(selectedBuilding.status || 'active');
  }, [selectedBuilding]);

  const buildingOptions = useMemo(
    () => buildings.map((b) => ({ id: b._id, label: b.name || b.code || 'Building' })),
    [buildings],
  );

  const handleSave = useCallback(async () => {
    if (!selectedBuildingId) {
      setSaveError('No building selected.');
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
      await managerApi.updateBuilding(selectedBuildingId, payload);
      await refreshBuildings();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update building.');
    } finally {
      setIsSaving(false);
    }
  }, [name, totalFloors, status, selectedBuildingId, refreshBuildings]);

  return (
    <div className="space-y-6">
      {/* Danh sách tòa nhà */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Building2 size={16} className="text-primary" />
            Building List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading buildings...</p>
          ) : error ? (
            <p className="text-sm text-rose-500">{error}</p>
          ) : buildings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No buildings have been assigned.</p>
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
                    <p className="mt-1 text-xs text-muted-foreground">Code: {b.code || '—'}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${b.status === 'active' ? 'bg-emerald-500' : b.status === 'maintenance' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                      <p className="text-xs text-muted-foreground">
                        {b.status === 'active' ? 'Active' : b.status === 'maintenance' ? 'Maintenance' : 'Inactive'}
                      </p>
                    </div>
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
            <CardTitle className="text-sm">Update Building Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Tên tòa nhà */}
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-foreground">Building Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter building name" />
              </div>

              {/* Số tầng */}
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-foreground">Total Floors</label>
                <Input
                  type="number"
                  min={1}
                  value={totalFloors}
                  onChange={(e) => setTotalFloors(e.target.value)}
                  placeholder="e.g. 5"
                />
              </div>

              {/* Trạng thái — dropdown */}
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-foreground">Status</label>
                <CustomSelect
                  value={status}
                  onChange={(val) => setStatus(val as ManagerBuilding['status'])}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                    { value: 'maintenance', label: 'Maintenance' },
                  ]}
                />
              </div>
            </div>

            {saveError && (
              <p className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-500">
                {saveError}
              </p>
            )}
            {saveSuccess && (
              <p className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
                Saved successfully!
              </p>
            )}

            <Button onClick={handleSave} disabled={isSaving} className="gap-2 w-fit">
              <Save size={14} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
