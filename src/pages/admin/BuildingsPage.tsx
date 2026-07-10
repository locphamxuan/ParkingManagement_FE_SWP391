import { BuildingsTable } from '@/components/admin/buildings/BuildingsTable';
import { BuildingFormModal } from '@/components/admin/buildings/BuildingFormModal';
import { BuildingMembersModal } from '@/components/admin/buildings/BuildingMembersModal';
import { BuildingDetailModal } from '@/components/admin/buildings/BuildingDetailModal';
import { BuildingConfirmModals } from '@/components/admin/buildings/BuildingConfirmModals';
import { useBuildingsManagement } from '@/hooks/admin/useBuildingsManagement';

export function BuildingsPage() {
  const bm = useBuildingsManagement();

  if (bm.isLoading) {
    return <div className="text-sm text-muted-foreground">Loading buildings...</div>;
  }

  if (bm.error || !bm.data) {
    return <div className="text-sm text-red-600">{bm.error || 'Failed to load buildings.'}</div>;
  }

  return (
    <div className="grid gap-4">
      {bm.actionError ? <div className="text-sm text-red-600">{bm.actionError}</div> : null}

      <BuildingsTable {...bm} />

      <BuildingMembersModal {...bm} />

      <BuildingDetailModal {...bm} />

      <BuildingFormModal {...bm} />

      <BuildingConfirmModals {...bm} />
    </div>
  );
}
