import { Eye, Users, Pencil, Pause, Play, Trash2 } from 'lucide-react';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { SearchFilterBar } from '@/components/common/SearchFilterBar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import type { BuildingsManagement } from '@/hooks/admin/useBuildingsManagement';
import type { Building } from '@/types';

type BuildingsTableProps = Pick<
  BuildingsManagement,
  | 'query' | 'setQuery' | 'statusFilter' | 'setStatusFilter' | 'page' | 'setPage'
  | 'maxPage' | 'pageRows' | 'openCreateModal' | 'openViewDetail' | 'openViewMembers'
  | 'openEditModal' | 'toggleBuildingStatus' | 'removeBuildingById'
>;

// Danh sách tòa nhà: thanh tìm kiếm/lọc, bảng dữ liệu và phân trang.
export function BuildingsTable({
  query, setQuery, statusFilter, setStatusFilter, page, setPage,
  maxPage, pageRows, openCreateModal, openViewDetail, openViewMembers,
  openEditModal, toggleBuildingStatus, removeBuildingById,
}: BuildingsTableProps) {
  const columns: DataColumn<Building>[] = [
    { key: 'name', title: 'Building Name' },
    { key: 'address', title: 'Address' },
    { key: 'floors', title: 'Floors' },
    {
      key: 'occupancyRate',
      title: 'Occupancy Rate',
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
      title: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    { key: 'manager', title: 'Manager' },
    {
      key: 'revenueToday',
      title: 'Revenue Today',
      render: (row) => `${row.revenueToday.toLocaleString('vi-VN')} ₫`,
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5 flex-nowrap">
          <button
            onClick={() => openViewDetail(row)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:scale-[1.08] active:scale-95 hover:shadow-[0_0_10px_rgba(59,130,246,0.15)] transition-all duration-200"
            title="Details"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => openViewMembers(row)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 hover:scale-[1.08] active:scale-95 hover:shadow-[0_0_10px_rgba(139,92,246,0.15)] transition-all duration-200"
            title="Members"
          >
            <Users size={16} />
          </button>
          <button
            onClick={() => openEditModal(row)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:scale-[1.08] active:scale-95 hover:shadow-[0_0_10px_rgba(245,158,11,0.15)] transition-all duration-200"
            title="Edit"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => toggleBuildingStatus(row)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 hover:scale-[1.08] active:scale-95 ${
              row.status === 'active'
                ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:shadow-[0_0_10px_rgba(244,63,94,0.15)]'
                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:shadow-[0_0_10px_rgba(16,185,129,0.15)]'
            }`}
            title={row.status === 'active' ? 'Deactivate' : 'Activate'}
          >
            {row.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            onClick={() => removeBuildingById(row)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:scale-[1.08] active:scale-95 hover:shadow-[0_0_10px_rgba(239,68,68,0.15)] transition-all duration-200"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
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
        <Button onClick={openCreateModal}>Create Building</Button>
      </div>

      <DataTable title="Buildings" rows={pageRows} columns={columns} />

      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {page} / {maxPage}
        </span>
        <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(maxPage, p + 1))}>
          Next
        </Button>
      </div>
    </>
  );
}
