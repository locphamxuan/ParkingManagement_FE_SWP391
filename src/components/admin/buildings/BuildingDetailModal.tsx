import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { BuildingsManagement } from '@/hooks/admin/useBuildingsManagement';
import type { AdminPricePolicy, AdminBuildingPackage } from '@/services/admin/adminApi';

type BuildingDetailModalProps = Pick<
  BuildingsManagement,
  'detailState' | 'setDetailState' | 'isDetailLoading' | 'detailError'
>;

const fmtVnd = (n: number | null | undefined) =>
  n != null ? `${n.toLocaleString('vi-VN')} ₫` : '—';

const vehicleTypeLabel = (vt: AdminPricePolicy['vehicleType'] | AdminBuildingPackage['vehicleType']) =>
  vt && typeof vt === 'object' ? vt.name : '—';

// Modal chi tiết tòa nhà (read-only operator view): chính sách giá + gói dài hạn.
export function BuildingDetailModal({
  detailState, setDetailState, isDetailLoading, detailError,
}: BuildingDetailModalProps) {
  if (!detailState) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Building Details — {detailState.buildingName}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setDetailState(null)}>
            ✕
          </Button>
        </div>

        {isDetailLoading ? (
          <p className="text-sm text-muted-foreground">Loading building details...</p>
        ) : detailError ? (
          <p className="text-sm text-red-600">{detailError}</p>
        ) : (
          <div className="grid max-h-[70vh] gap-5 overflow-y-auto">
            {/* Chính sách giá */}
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Price Policies ({detailState.pricePolicies.length})
              </h3>
              {detailState.pricePolicies.length === 0 ? (
                <p className="text-sm italic text-muted-foreground">This building has no price policy configured yet.</p>
              ) : (
                <div className="grid gap-2">
                  {detailState.pricePolicies.map((p) => (
                    <div key={p._id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {vehicleTypeLabel(p.vehicleType)} · {fmtVnd(p.hourlyRate)}/hour
                          {p.dailyCap ? ` · daily cap ${fmtVnd(p.dailyCap)}` : ''}
                        </p>
                      </div>
                      <StatusBadge status={p.isActive ? 'active' : 'inactive'} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Gói dài hạn của tòa nhà */}
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Long-term Packages ({detailState.packages.length})
              </h3>
              {detailState.packages.length === 0 ? (
                <p className="text-sm italic text-muted-foreground">This building has not published any long-term packages yet.</p>
              ) : (
                <div className="grid gap-2">
                  {detailState.packages.map((pkg) => (
                    <div key={pkg._id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
                      <div>
                        <p className="font-medium">
                          {pkg.name}
                          {pkg.code && <span className="ml-1.5 font-mono text-xs text-muted-foreground">{pkg.code}</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {vehicleTypeLabel(pkg.vehicleType)} · {fmtVnd(pkg.price)} · {pkg.durationDays} days
                        </p>
                      </div>
                      <StatusBadge status={pkg.isActive ? 'active' : 'inactive'} />
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
