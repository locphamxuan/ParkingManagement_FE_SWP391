import { useMemo, useState } from 'react';
import { Users } from 'lucide-react';
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
} from '@/services/admin/adminCrud';
import {
  adminApi,
  type AdminUser,
  type AdminSubscriptionPackage,
  type BuildingSubscriptionStatus,
} from '@/services/admin/adminApi';
import type { Building } from '@/types';

const PAGE_SIZE = 10;

const fmtVnd = (n: number) => `${n.toLocaleString('vi-VN')} ₫`;
const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN') : '—';

interface MembersState {
  buildingId: string;
  buildingName: string;
  manager: AdminUser | null;
  staff: AdminUser[];
  subscription: BuildingSubscriptionStatus | null;
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

  const [pendingDeleteMember, setPendingDeleteMember] = useState<AdminUser | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);

  const [subPackages, setSubPackages] = useState<AdminSubscriptionPackage[]>([]);
  const [grantPackageId, setGrantPackageId] = useState('');
  const [subBusy, setSubBusy] = useState(false);

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
    setMembersState({ buildingId: bid, buildingName: building.name, manager: null, staff: [], subscription: null });
    setIsMembersLoading(true);
    setMembersError(null);
    setGrantPackageId('');
    try {
      const [res, pkgRes] = await Promise.all([
        adminApi.buildings.getMembers(bid),
        adminApi.subscriptionPackages.list({ isActive: 'true' }),
      ]);
      setMembersState({
        buildingId: bid,
        buildingName: building.name,
        manager: res.data?.manager ?? null,
        staff: res.data?.staff ?? [],
        subscription: res.data?.subscription ?? null,
      });
      setSubPackages((pkgRes as { data?: { items: AdminSubscriptionPackage[] } })?.data?.items ?? []);
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'Không thể tải danh sách thành viên');
    } finally {
      setIsMembersLoading(false);
    }
  };

  const reloadMembersSubscription = async (bid: string) => {
    try {
      const res = await adminApi.buildings.getMembers(bid);
      setMembersState((prev) =>
        prev && prev.buildingId === bid
          ? { ...prev, subscription: res.data?.subscription ?? null }
          : prev,
      );
    } catch {
      /* ignore */
    }
  };

  const handleGrantSubscription = async () => {
    if (!membersState || !grantPackageId) return;
    setSubBusy(true);
    setMembersError(null);
    try {
      await adminApi.buildings.grantSubscription(membersState.buildingId, grantPackageId);
      await reloadMembersSubscription(membersState.buildingId);
      setGrantPackageId('');
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'Không thể cấp gói');
    } finally {
      setSubBusy(false);
    }
  };

  const handleRevokeSubscription = async () => {
    if (!membersState) return;
    if (!window.confirm('Thu hồi gói dịch vụ của tòa nhà này? Bảng điều khiển của quản lý sẽ bị khóa ngay.')) return;
    setSubBusy(true);
    setMembersError(null);
    try {
      await adminApi.buildings.revokeSubscription(membersState.buildingId);
      await reloadMembersSubscription(membersState.buildingId);
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'Không thể thu hồi gói');
    } finally {
      setSubBusy(false);
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
      title: 'Tỉ lệ chiếm dụng',
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
                {/* Gói dịch vụ hệ thống */}
                <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                    Gói dịch vụ hệ thống
                  </h3>
                  {membersState.subscription?.active ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm">
                        <p className="font-medium text-foreground">
                          {membersState.subscription.packageName
                            ?? membersState.subscription.package?.name
                            ?? 'Đang hoạt động'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Còn {membersState.subscription.daysRemaining} ngày · hết hạn{' '}
                          {fmtDate(membersState.subscription.endDate)}
                        </p>
                      </div>
                      <Button variant="danger" size="sm" disabled={subBusy} onClick={handleRevokeSubscription}>
                        Thu hồi
                      </Button>
                    </div>
                  ) : (
                    <p className="mb-2 text-sm italic text-muted-foreground">Chưa có gói đang hoạt động</p>
                  )}

                  <div className="mt-2 flex items-center gap-2">
                    <select
                      className="h-9 flex-1 rounded-md border border-border bg-secondary px-3 text-sm text-foreground outline-none"
                      value={grantPackageId}
                      onChange={(e) => setGrantPackageId(e.target.value)}
                    >
                      <option value="">-- Chọn gói để cấp/gia hạn --</option>
                      {subPackages.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} · {fmtVnd(p.price)} · {p.durationDays} ngày
                        </option>
                      ))}
                    </select>
                    <Button size="sm" disabled={subBusy || !grantPackageId} onClick={handleGrantSubscription}>
                      Cấp gói
                    </Button>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Cấp gói thủ công (miễn phí) — không trừ tiền ví tòa nhà.
                  </p>
                </section>

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
                    <p className="text-sm text-muted-foreground italic">Chưa có quản lý</p>
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

      {/* Edit / Create Building Modal */}
      <ModalForm
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        title={selectedBuilding ? 'Sửa tòa nhà' : 'Tạo tòa nhà'}
        onSubmit={saveBuilding}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Tên tòa nhà"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <Input
            placeholder="Mã tòa nhà"
            value={form.code}
            onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
          />
          <Input
            placeholder="Địa chỉ"
            value={form.address}
            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
          />
          <Input
            placeholder="Số tầng"
            value={form.floors}
            onChange={(e) => setForm((prev) => ({ ...prev, floors: e.target.value }))}
          />
          {!selectedBuilding ? (
            <Input
              placeholder="Giá giờ (VND)"
              value={form.hourlyRate}
              onChange={(e) => setForm((prev) => ({ ...prev, hourlyRate: e.target.value }))}
            />
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
