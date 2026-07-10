import { ConfirmModal } from '@/components/modals/ConfirmModal';
import type { BuildingsManagement } from '@/hooks/admin/useBuildingsManagement';

type BuildingConfirmModalsProps = Pick<
  BuildingsManagement,
  | 'pendingDeleteBuilding' | 'setPendingDeleteBuilding' | 'isDeleting' | 'confirmRemoveBuilding'
  | 'pendingDeleteMember' | 'setPendingDeleteMember' | 'isDeletingMember' | 'confirmDeleteMember'
>;

// Hai hộp thoại xác nhận xoá: xoá tòa nhà và xoá thành viên (manager/staff).
export function BuildingConfirmModals({
  pendingDeleteBuilding, setPendingDeleteBuilding, isDeleting, confirmRemoveBuilding,
  pendingDeleteMember, setPendingDeleteMember, isDeletingMember, confirmDeleteMember,
}: BuildingConfirmModalsProps) {
  return (
    <>
      <ConfirmModal
        open={Boolean(pendingDeleteBuilding)}
        title="Confirm Building Deletion"
        description={`Are you sure you want to delete building ${pendingDeleteBuilding?.name || ''}? This action cannot be undone.`}
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteBuilding(null);
        }}
        onConfirm={confirmRemoveBuilding}
      />

      <ConfirmModal
        open={Boolean(pendingDeleteMember)}
        title={`Delete ${pendingDeleteMember?.role === 'manager' ? 'Manager' : 'Staff'} Account`}
        description={`Permanently delete the account "${pendingDeleteMember?.fullName || pendingDeleteMember?.email || ''}" (${pendingDeleteMember?.email || ''})? This action cannot be undone.`}
        confirmLabel="Delete"
        isConfirming={isDeletingMember}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteMember(null);
        }}
        onConfirm={confirmDeleteMember}
      />
    </>
  );
}
