import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { BuildingsManagement } from '@/hooks/admin/useBuildingsManagement';

type BuildingMembersModalProps = Pick<
  BuildingsManagement,
  | 'membersState' | 'setMembersState' | 'isMembersLoading' | 'membersError'
  | 'unassignedManagers' | 'isLoadingManagers' | 'unassignedStaff' | 'isLoadingStaff'
  | 'showAddStaffForm' | 'setShowAddStaffForm' | 'handleAssignManager' | 'handleAssignStaff'
  | 'setPendingDeleteMember'
>;

// Modal quản lý thành viên (manager + staff) của một tòa nhà.
export function BuildingMembersModal({
  membersState, setMembersState, isMembersLoading, membersError,
  unassignedManagers, isLoadingManagers, unassignedStaff, isLoadingStaff,
  showAddStaffForm, setShowAddStaffForm, handleAssignManager, handleAssignStaff,
  setPendingDeleteMember,
}: BuildingMembersModalProps) {
  if (!membersState) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Members — {membersState.buildingName}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setMembersState(null)}>
            ✕
          </Button>
        </div>

        {isMembersLoading ? (
          <p className="text-sm text-muted-foreground">Loading member list...</p>
        ) : membersError ? (
          <p className="text-sm text-red-600">{membersError}</p>
        ) : (
          <div className="grid gap-4">
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Manager
              </h3>
              {membersState.manager ? (
                <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
                  <div>
                    <p className="font-medium">{membersState.manager.fullName}</p>
                    <p className="text-muted-foreground">{membersState.manager.email}</p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setPendingDeleteMember(membersState.manager!)}
                  >
                    Delete
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 rounded-xl border border-dashed border-border p-4 bg-muted/20">
                  <p className="text-sm text-muted-foreground italic">No manager assigned to this building</p>
                  {isLoadingManagers ? (
                    <p className="text-xs text-muted-foreground font-mono animate-pulse">Loading unassigned managers...</p>
                  ) : unassignedManagers.length === 0 ? (
                    <p className="text-xs text-amber-500 font-medium">No unassigned managers available.</p>
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Assign manager:</label>
                      <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                        {unassignedManagers.map((mgr) => (
                          <div key={mgr._id} className="flex items-center justify-between rounded-lg border border-border bg-background p-2.5 text-xs">
                            <div className="min-w-0 flex-1 pr-2">
                              <p className="font-semibold text-foreground truncate">{mgr.fullName}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{mgr.email}</p>
                            </div>
                            <Button
                              size="sm"
                              className="h-7 text-[11px] px-3 font-semibold"
                              onClick={() => handleAssignManager(mgr._id)}
                            >
                              Assign
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Staff ({membersState.staff.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs font-semibold text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 px-2.5 rounded-lg flex items-center gap-1"
                  onClick={() => setShowAddStaffForm(!showAddStaffForm)}
                >
                  {showAddStaffForm ? 'Close' : '+ Add Staff'}
                </Button>
              </div>

              {showAddStaffForm && (
                <div className="mb-3 space-y-3 rounded-xl border border-dashed border-border p-4 bg-muted/20 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select staff to assign:</p>
                  {isLoadingStaff ? (
                    <p className="text-xs text-muted-foreground font-mono animate-pulse">Loading unassigned staff...</p>
                  ) : unassignedStaff.length === 0 ? (
                    <p className="text-xs text-amber-500 font-medium">No unassigned staff available.</p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {unassignedStaff.map((s) => (
                        <div key={s._id} className="flex items-center justify-between rounded-lg border border-border bg-background p-2.5 text-xs">
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="font-semibold text-foreground truncate">{s.fullName}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{s.email}</p>
                          </div>
                          <Button
                            size="sm"
                            className="h-7 text-[11px] px-3 font-semibold"
                            onClick={() => handleAssignStaff(s._id)}
                          >
                            Assign
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {membersState.staff.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No staff yet</p>
              ) : (
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {membersState.staff.map((s) => (
                    <div
                      key={s._id}
                      className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{s.fullName}</p>
                        <p className="text-muted-foreground">{s.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={s.isActive ? 'active' : 'inactive'} />
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setPendingDeleteMember(s)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
