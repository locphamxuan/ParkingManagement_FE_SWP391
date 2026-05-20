import { useMemo, useState } from 'react';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { ModalForm } from '@/components/shared/ModalForm';
import { SearchFilterBar } from '@/components/shared/SearchFilterBar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminDataset } from '@/hooks/useAdminDataset';
import type { Building } from '@/types';

const PAGE_SIZE = 3;

export function BuildingsPage() {
  const { data, isLoading, error } = useAdminDataset();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
  ];

  return (
    <div className="grid gap-4">
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
        <Button onClick={() => setIsModalOpen(true)}>Tạo tòa nhà</Button>
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
        onOpenChange={setIsModalOpen}
        title="Tạo / Sửa tòa nhà"
        onSubmit={() => setIsModalOpen(false)}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Tên tòa nhà" />
          <Input placeholder="Địa chỉ" />
          <Input placeholder="Số tầng" />
          <Input placeholder="Quản lý" />
        </div>
      </ModalForm>
    </div>
  );
}
