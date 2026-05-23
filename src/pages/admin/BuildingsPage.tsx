import { useMemo, useState } from 'react';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { ModalForm } from '@/components/shared/ModalForm';
import { SearchFilterBar } from '@/components/shared/SearchFilterBar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminDataset } from '@/hooks/admin/useAdminDataset';
import { useAuth } from '@/hooks/useAuth';
import {
  createBuilding,
  deleteBuilding,
  updateBuilding,
  updateBuildingStatus,
} from '@/services/admin/adminCrud';
import type { Building } from '@/types';

const PAGE_SIZE = 3;

export function BuildingsPage() {
  const { data, isLoading, error, refresh } = useAdminDataset();
  const { session } = useAuth();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
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

  const openCreateModal = () => {
    setActionError(null);
    setSelectedBuilding(null);
    setForm({
      name: '',
      code: '',
      floors: '1',
      address: '',
      hourlyRate: '0',
    });
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

  const removeBuildingById = async (building: Building) => {
    if (!token) return;
    if (!window.confirm(`Xóa tòa nhà ${building.name}?`)) return;
    try {
      setActionError(null);
      await deleteBuilding(token, building.backendId || building.id);
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể xóa tòa nhà');
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
      title: 'Doanh thu',
      render: (row) => `${row.revenueToday.toLocaleString()} VND`,
    },
    {
      key: 'actions',
      title: 'Hành động',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
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
    </div>
  );
}
