import { useMemo, useState } from 'react';
import { Eye, Users } from 'lucide-react';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { ModalForm } from '@/components/modals/ModalForm';
import { SearchFilterBar } from '@/components/common/SearchFilterBar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminDataset } from '@/hooks/admin/useAdminDataset';
import { useAuth } from '@/hooks/useAuth';
import {
  createBuilding,
  deleteAdminUser,
  deleteBuilding,
  updateBuilding,
  updateBuildingStatus,
  revokeStaffFromBuilding,
  revokeManagerFromBuilding,
  assignManagerToBuilding,
} from '@/services/admin/adminCrud';
import {
  adminApi,
  type AdminUser,
  type AdminPricePolicy,
  type AdminBuildingPackage,
} from '@/services/admin/adminApi';
import type { Building } from '@/types';

const PAGE_SIZE = 10;

const fmtVnd = (n: number | null | undefined) =>
  n != null ? `${n.toLocaleString('vi-VN')} ₫` : '—';

const vehicleTypeLabel = (vt: AdminPricePolicy['vehicleType'] | AdminBuildingPackage['vehicleType']) =>
  vt && typeof vt === 'object' ? vt.name : '—';

interface MembersState {
  buildingId: string;
  buildingName: string;
  manager: AdminUser | null;
  staff: AdminUser[];
}

interface DetailState {
  buildingName: string;
  pricePolicies: AdminPricePolicy[];
  packages: AdminBuildingPackage[];
}

export function BuildingsPage() {
  const { data, isLoading, error, refresh } = useAdminDataset();
  const { session } = useAuth();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDeleteBuilding, setPendingDeleteBuilding] = useState<Building | null>(null);

  const [membersState, setMembersState] = useState<MembersState | null>(null);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [unassignedManagers, setUnassignedManagers] = useState<AdminUser[]>([]);
  const [isLoadingManagers, setIsLoadingManagers] = useState(false);

  const [pendingDeleteMember, setPendingDeleteMember] = useState<AdminUser | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);

  const [detailState, setDetailState] = useState<DetailState | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    code: '',
    floors: '1',
    address: '',
    hourlyRate: '0',
  });

  const filtered = useMemo(() => {
    const source = data?.buildings ?? [];
    return source.filter((item) => {
      const q = query.trim().toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.address.toLowerCase().includes(q) ||
        item.manager.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data?.buildings, query, statusFilter]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Đang tải danh sách tòa nhà...</div>;
  }

  if (error || !data) {
    return <div className="text-sm text-red-600">{error || 'Tải tòa nhà thất bại.'}</div>;
  }

  const token = session?.token || '';

  const openViewMembers = async (building: Building) => {
    const bid = building.backendId || building.id;
    setMembersState({ buildingId: bid, buildingName: building.name, manager: null, staff: [] });
    setIsMembersLoading(true);
    setMembersError(null);
    setUnassignedManagers([]);
    try {
      const res = await adminApi.buildings.getMembers(bid);
      const manager = res.data?.manager ?? null;
      setMembersState({
        buildingId: bid,
        buildingName: building.name,
        manager,
        staff: res.data?.staff ?? [],
      });
      if (!manager) {
        setIsLoadingManagers(true);
        try {
          const userRes = await adminApi.users.list({ role: 'manager', limit: '200' });
          const raw = userRes as unknown as { data?: { items?: AdminUser[] } | AdminUser[] };
          const list =
            (raw?.data as { items?: AdminUser[] })?.items ??
            (Array.isArray(raw?.data) ? (raw.data as AdminUser[]) : []);
          const unassigned = list.filter(
            (u) => !u.assignedBuildings || u.assignedBuildings.length === 0
          );
          setUnassignedManagers(unassigned);
        } catch (err) {
          console.error('Không thể tải danh sách quản lý:', err);
        } finally {
          setIsLoadingManagers(false);
        }
      }
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'Không thể tải danh sách thành viên');
    } finally {
      setIsMembersLoading(false);
    }
  };

  const handleAssignManager = async (managerId: string) => {
    if (!token || !membersState) return;
    setIsMembersLoading(true);
    setMembersError(null);
    try {
      await assignManagerToBuilding(token, membersState.buildingId, managerId);
      const res = await adminApi.buildings.getMembers(membersState.buildingId);
      setMembersState({
        ...membersState,
        manager: res.data?.manager ?? null,
        staff: res.data?.staff ?? [],
      });
      await refresh();
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'Không thể gán quản lý');
    } finally {
      setIsMembersLoading(false);
    }
  };

  const openViewDetail = async (building: Building) => {
    const bid = building.backendId || building.id;
    setDetailState({ buildingName: building.name, pricePolicies: [], packages: [] });
    setIsDetailLoading(true);
    setDetailError(null);
    try {
      const [policyRes, pkgRes] = await Promise.all([
        adminApi.buildings.listPricePolicies(bid),
        adminApi.buildings.listPackages(bid),
      ]);
      setDetailState({
        buildingName: building.name,
        pricePolicies: (policyRes as { data?: { items: AdminPricePolicy[] } })?.data?.items ?? [],
        packages: (pkgRes as { data?: { items: AdminBuildingPackage[] } })?.data?.items ?? [],
      });
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Không thể tải chi tiết tòa nhà');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const confirmDeleteMember = async () => {
    if (!token || !pendingDeleteMember || !membersState) return;
    const isManager = membersState.manager?._id === pendingDeleteMember._id;
    const buildingId = membersState.buildingId;
    try {
      setIsDeletingMember(true);
      if (isManager) {
        await revokeManagerFromBuilding(token, buildingId, pendingDeleteMember._id);
      } else {
        await revokeStaffFromBuilding(token, buildingId, pendingDeleteMember._id);
      }
      await deleteAdminUser(token, pendingDeleteMember._id);
      setMembersState((prev) =>
        prev
          ? {
              ...prev,
              manager: isManager ? null : prev.manager,
              staff: prev.staff.filter((s) => s._id !== pendingDeleteMember._id),
            }
          : null,
      );
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể xóa thành viên');
    } finally {
      setIsDeletingMember(false);
      setPendingDeleteMember(null);
    }
  };

  const openCreateModal = () => {
    setActionError(null);
    setSelectedBuilding(null);
    setForm({ name: '', code: '', floors: '1', address: '', hourlyRate: '0' });
    setIsModalOpen(true);
  };

  const openEditModal = (building: Building) => {
    setActionError(null);
    setSelectedBuilding(building);
    setForm({
      name: building.name,
      code: building.id,
      floors: String(building.floors),
      address: building.address,
      hourlyRate: '0',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBuilding(null);
    setIsSaving(false);
    setActionError(null);
  };

  const saveBuilding = async () => {
    if (!token) return;
    try {
      setIsSaving(true);
      setActionError(null);
      if (selectedBuilding) {
        await updateBuilding(token, selectedBuilding.backendId || selectedBuilding.id, {
          name: form.name,
          code: form.code,
          totalFloors: Number(form.floors),
          fullAddress: form.address,
        });
      } else {
        await createBuilding(token, {
          name: form.name,
          code: form.code,
          totalFloors: Number(form.floors),
          fullAddress: form.address,
          hourlyRate: Number(form.hourlyRate),
        });
      }
      await refresh();
      closeModal();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể lưu tòa nhà');
      setIsSaving(false);
    }
  };

  const toggleBuildingStatus = async (building: Building) => {
    if (!token) return;
    try {
      setActionError(null);
      const nextStatus = building.status === 'active' ? 'inactive' : 'active';
      await updateBuildingStatus(token, building.backendId || building.id, nextStatus);
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể đổi trạng thái tòa nhà');
    }
  };

  const removeBuildingById = (building: Building) => {
    if (!token) return;
    setPendingDeleteBuilding(building);
  };

  const confirmRemoveBuilding = async () => {
    if (!token || !pendingDeleteBuilding) return;
    try {
      setIsDeleting(true);
      setActionError(null);
      await deleteBuilding(token, pendingDeleteBuilding.backendId || pendingDeleteBuilding.id);
      await refresh();
      setPendingDeleteBuilding(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể xóa tòa nhà');
    } finally {
      setIsDeleting(false);
    }
  };

  const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: DataColumn<Building>[] = [
    { key: 'name', title: 'Tên tòa nhà' },
    { key: 'address', title: 'Địa chỉ' },
    { key: 'floors', title: 'Số tầng' },
    {
      key: 'occupancyRate',
      title: 'Mức độ đông đúc',
      render: (row) => (
        <div className="w-32">
          <div className="mb-1 text-xs text-muted-foreground">{row.occupancyRate}%</div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${row.occupancyRate}%` }} />
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) => <StatusBadge status={row.status} />,
    },
    { key: 'manager', title: 'Người quản lý' },
    {
      key: 'revenueToday',
      title: 'Doanh thu hôm nay',
      render: (row) => `${row.revenueToday.toLocaleString('vi-VN')} ₫`,
    },
    {
      key: 'actions',
      title: 'Hành động',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="gap-1"
            onClick={() => openViewDetail(row)}
          >
            <Eye size={12} /> Chi tiết
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="gap-1"
            onClick={() => openViewMembers(row)}
          >
            <Users size={12} /> Thành viên
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openEditModal(row)}>
            Sửa
          </Button>
          <Button variant="secondary" size="sm" onClick={() => toggleBuildingStatus(row)}>
            {row.status === 'active' ? 'Ngưng' : 'Kích hoạt'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => removeBuildingById(row)}>
            Xóa
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      {actionError ? <div className="text-sm text-red-600">{actionError}</div> : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <SearchFilterBar
          query={query}
          onQueryChange={(value) => {
            setPage(1);
            setQuery(value);
          }}
          filterValue={statusFilter}
          onFilterChange={(value) => {
            setPage(1);
            setStatusFilter(value);
          }}
          filterOptions={['all', 'active', 'inactive', 'maintenance', 'warning']}
        />
        <Button onClick={openCreateModal}>Tạo tòa nhà</Button>
      </div>

      <DataTable title="Tòa nhà" rows={pageRows} columns={columns} />

      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Trước
        </Button>
        <span className="text-sm text-muted-foreground">
          Trang {page} / {maxPage}
        </span>
        <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(maxPage, p + 1))}>
          Tiếp
        </Button>
      </div>

      {/* Members Modal */}
      {membersState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Thành viên — {membersState.buildingName}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setMembersState(null)}>
                ✕
              </Button>
            </div>

            {isMembersLoading ? (
              <p className="text-sm text-muted-foreground">Đang tải danh sách thành viên...</p>
            ) : membersError ? (
              <p className="text-sm text-red-600">{membersError}</p>
            ) : (
              <div className="grid gap-4">
                <section>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Quản lý
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
                        Xóa
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-xl border border-dashed border-border p-4 bg-muted/20">
                      <p className="text-sm text-muted-foreground italic">Chưa có quản lý cho tòa nhà này</p>
                      {isLoadingManagers ? (
                        <p className="text-xs text-muted-foreground font-mono animate-pulse">Đang tải danh sách quản lý chưa được gán...</p>
                      ) : unassignedManagers.length === 0 ? (
                        <p className="text-xs text-amber-500 font-medium">Không có quản lý nào chưa được gán tòa nhà.</p>
                      ) : (
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Gán quản lý:</label>
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
                                  Gán
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
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Nhân viên ({membersState.staff.length})
                  </h3>
                  {membersState.staff.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Chưa có nhân viên</p>
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
                              Xóa
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
      ) : null}

      {/* Building Detail Modal (read-only operator view) */}
      {detailState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Chi tiết tòa nhà — {detailState.buildingName}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setDetailState(null)}>
                ✕
              </Button>
            </div>

            {isDetailLoading ? (
              <p className="text-sm text-muted-foreground">Đang tải chi tiết tòa nhà...</p>
            ) : detailError ? (
              <p className="text-sm text-red-600">{detailError}</p>
            ) : (
              <div className="grid max-h-[70vh] gap-5 overflow-y-auto">
                {/* Chính sách giá */}
                <section>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Chính sách giá ({detailState.pricePolicies.length})
                  </h3>
                  {detailState.pricePolicies.length === 0 ? (
                    <p className="text-sm italic text-muted-foreground">Tòa nhà chưa cấu hình chính sách giá.</p>
                  ) : (
                    <div className="grid gap-2">
                      {detailState.pricePolicies.map((p) => (
                        <div key={p._id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
                          <div>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {vehicleTypeLabel(p.vehicleType)} · {fmtVnd(p.hourlyRate)}/giờ
                              {p.dailyCap ? ` · trần ngày ${fmtVnd(p.dailyCap)}` : ''}
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
                    Gói dài hạn ({detailState.packages.length})
                  </h3>
                  {detailState.packages.length === 0 ? (
                    <p className="text-sm italic text-muted-foreground">Tòa nhà chưa phát hành gói dài hạn nào.</p>
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
                              {vehicleTypeLabel(pkg.vehicleType)} · {fmtVnd(pkg.price)} · {pkg.durationDays} ngày
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
      ) : null}

      {/* Edit / Create Building Modal */}
      <ModalForm
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        title={selectedBuilding ? 'Sửa tòa nhà' : 'Tạo tòa nhà'}
        onSubmit={saveBuilding}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tên tòa nhà</label>
            <Input
              placeholder="Nhập tên tòa nhà"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mã tòa nhà</label>
            <Input
              placeholder="Nhập mã tòa nhà"
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Địa chỉ</label>
            <Input
              placeholder="Nhập địa chỉ"
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Số tầng</label>
            <Input
              placeholder="Nhập số tầng"
              value={form.floors}
              onChange={(e) => setForm((prev) => ({ ...prev, floors: e.target.value }))}
            />
          </div>
          {!selectedBuilding ? (
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Giá theo giờ (VND)</label>
              <Input
                placeholder="Nhập giá theo giờ"
                value={form.hourlyRate}
                onChange={(e) => setForm((prev) => ({ ...prev, hourlyRate: e.target.value }))}
              />
            </div>
          ) : null}
        </div>
        {isSaving ? <p className="text-xs text-muted-foreground">Đang lưu...</p> : null}
      </ModalForm>

      <ConfirmModal
        open={Boolean(pendingDeleteBuilding)}
        title="Xác nhận xóa tòa nhà"
        description={`Bạn có chắc chắn muốn xóa tòa nhà ${pendingDeleteBuilding?.name || ''}? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        isConfirming={isDeleting}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteBuilding(null);
        }}
        onConfirm={confirmRemoveBuilding}
      />

      <ConfirmModal
        open={Boolean(pendingDeleteMember)}
        title={`Xóa tài khoản ${pendingDeleteMember?.role === 'manager' ? 'quản lý' : 'nhân viên'}`}
        description={`Xóa vĩnh viễn tài khoản "${pendingDeleteMember?.fullName || pendingDeleteMember?.email || ''}" (${pendingDeleteMember?.email || ''})? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        isConfirming={isDeletingMember}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteMember(null);
        }}
        onConfirm={confirmDeleteMember}
      />
    </div>
  );
}
