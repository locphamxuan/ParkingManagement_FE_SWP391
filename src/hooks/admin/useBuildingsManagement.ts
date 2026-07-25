import { useMemo, useState } from 'react';
import { useAdminDataset } from '@/hooks/admin/useAdminDataset';
import {
  adminApi,
  type AdminUser,
  type AdminPricePolicy,
  type AdminBuildingPackage,
} from '@/services/admin/adminApi';
import type { Building } from '@/types';

const PAGE_SIZE = 10;

export interface MembersState {
  buildingId: string;
  buildingName: string;
  manager: AdminUser | null;
  staff: AdminUser[];
}

export interface DetailState {
  buildingName: string;
  pricePolicies: AdminPricePolicy[];
  packages: AdminBuildingPackage[];
}

/**
 * Toàn bộ state + business logic quản lý Buildings ở trang admin (danh sách,
 * lọc/tìm kiếm, tạo/sửa/xoá tòa nhà, xem chi tiết, quản lý thành viên).
 * Tách khỏi BuildingsPage để page chỉ còn lo phần hiển thị.
 */
export function useBuildingsManagement() {
  const { data, isLoading, error, refresh } = useAdminDataset();
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

  const [unassignedStaff, setUnassignedStaff] = useState<AdminUser[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);

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

  const openViewMembers = async (building: Building) => {
    const bid = building.backendId || building.id;
    setMembersState({ buildingId: bid, buildingName: building.name, manager: null, staff: [] });
    setIsMembersLoading(true);
    setMembersError(null);
    setUnassignedManagers([]);
    setUnassignedStaff([]);
    setShowAddStaffForm(false);
    try {
      const res = await adminApi.buildings.getMembers(bid);
      const manager = res.data?.manager ?? null;
      setMembersState({
        buildingId: bid,
        buildingName: building.name,
        manager,
        staff: res.data?.staff ?? [],
      });

      // Fetch unassigned staff
      setIsLoadingStaff(true);
      try {
        const userRes = await adminApi.users.list({ role: 'staff', limit: '200' });
        const list = userRes.data?.items ?? [];
        const unassigned = list.filter(
          (u) => !u.assignedBuildings || u.assignedBuildings.length === 0
        );
        setUnassignedStaff(unassigned);
      } catch {
        setUnassignedStaff([]);
      } finally {
        setIsLoadingStaff(false);
      }

      if (!manager) {
        setIsLoadingManagers(true);
        try {
          const userRes = await adminApi.users.list({ role: 'manager', limit: '200' });
          const list = userRes.data?.items ?? [];
          const unassigned = list.filter(
            (u) => !u.assignedBuildings || u.assignedBuildings.length === 0
          );
          setUnassignedManagers(unassigned);
        } catch {
          setUnassignedManagers([]);
        } finally {
          setIsLoadingManagers(false);
        }
      }
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'Failed to load member list');
    } finally {
      setIsMembersLoading(false);
    }
  };

  const handleAssignManager = async (managerId: string) => {
    if (!membersState) return;
    setIsMembersLoading(true);
    setMembersError(null);
    try {
      await adminApi.buildings.assignManager(membersState.buildingId, managerId);
      const res = await adminApi.buildings.getMembers(membersState.buildingId);
      setMembersState({
        ...membersState,
        manager: res.data?.manager ?? null,
        staff: res.data?.staff ?? [],
      });
      await refresh();
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'Failed to assign manager');
    } finally {
      setIsMembersLoading(false);
    }
  };

  const handleAssignStaff = async (staffId: string) => {
    if (!membersState) return;
    setIsMembersLoading(true);
    setMembersError(null);
    try {
      await adminApi.buildings.assignStaff(membersState.buildingId, staffId);
      const res = await adminApi.buildings.getMembers(membersState.buildingId);
      setMembersState({
        ...membersState,
        manager: res.data?.manager ?? null,
        staff: res.data?.staff ?? [],
      });
      setUnassignedStaff((prev) => prev.filter((s) => s._id !== staffId));
      await refresh();
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'Failed to assign staff');
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
      setDetailError(err instanceof Error ? err.message : 'Failed to load building details');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const confirmDeleteMember = async () => {
    if (!pendingDeleteMember || !membersState) return;
    const isManager = membersState.manager?._id === pendingDeleteMember._id;
    const buildingId = membersState.buildingId;
    try {
      setIsDeletingMember(true);
      if (isManager) {
        await adminApi.buildings.revokeManager(buildingId, pendingDeleteMember._id);
      } else {
        await adminApi.buildings.revokeStaff(buildingId, pendingDeleteMember._id);
      }
      await adminApi.users.remove(pendingDeleteMember._id);
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
      setActionError(err instanceof Error ? err.message : 'Failed to remove member');
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
    try {
      setIsSaving(true);
      setActionError(null);
      if (selectedBuilding) {
        await adminApi.buildings.update(selectedBuilding.backendId || selectedBuilding.id, {
          name: form.name,
          code: form.code,
          totalFloors: Number(form.floors),
          address: { fullAddress: form.address },
        });
      } else {
        await adminApi.buildings.create({
          name: form.name,
          code: form.code,
          totalFloors: Number(form.floors),
          address: { fullAddress: form.address },
          pricing: { hourlyRate: Number(form.hourlyRate) },
          operatingHours: { open: '06:00', close: '22:00' },
          status: 'active',
        });
      }
      await refresh();
      closeModal();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to save building');
      setIsSaving(false);
    }
  };

  const toggleBuildingStatus = async (building: Building) => {
    try {
      setActionError(null);
      const nextStatus = building.status === 'active' ? 'inactive' : 'active';
      await adminApi.buildings.updateStatus(building.backendId || building.id, nextStatus);
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to change building status');
    }
  };

  const removeBuildingById = (building: Building) => {
    setPendingDeleteBuilding(building);
  };

  const confirmRemoveBuilding = async () => {
    if (!pendingDeleteBuilding) return;
    try {
      setIsDeleting(true);
      setActionError(null);
      await adminApi.buildings.remove(pendingDeleteBuilding.backendId || pendingDeleteBuilding.id);
      await refresh();
      setPendingDeleteBuilding(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete building');
    } finally {
      setIsDeleting(false);
    }
  };

  const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return {
    data,
    isLoading,
    error,
    refresh,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    maxPage,
    pageRows,
    isModalOpen,
    setIsModalOpen,
    selectedBuilding,
    isSaving,
    isDeleting,
    actionError,
    pendingDeleteBuilding,
    setPendingDeleteBuilding,
    form,
    setForm,
    membersState,
    setMembersState,
    isMembersLoading,
    membersError,
    unassignedManagers,
    isLoadingManagers,
    unassignedStaff,
    isLoadingStaff,
    showAddStaffForm,
    setShowAddStaffForm,
    pendingDeleteMember,
    setPendingDeleteMember,
    isDeletingMember,
    detailState,
    setDetailState,
    isDetailLoading,
    detailError,
    openViewMembers,
    handleAssignManager,
    handleAssignStaff,
    openViewDetail,
    confirmDeleteMember,
    openCreateModal,
    openEditModal,
    closeModal,
    saveBuilding,
    toggleBuildingStatus,
    removeBuildingById,
    confirmRemoveBuilding,
  };
}

export type BuildingsManagement = ReturnType<typeof useBuildingsManagement>;
