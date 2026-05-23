import { useMemo, useState } from 'react';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { SearchFilterBar } from '@/components/shared/SearchFilterBar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAdminDataset } from '@/hooks/admin/useAdminDataset';
import type { AuditLog } from '@/types';

export function AuditLogsPage() {
  const { data, isLoading, error } = useAdminDataset();
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('all');

  const filtered = useMemo(() => {
    const source = data?.auditLogs ?? [];

    return source.filter((log) => {
      const q = query.trim().toLowerCase();
      const matchQuery =
        log.actor.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.target.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q);
      const matchSeverity = severity === 'all' || log.severity === severity;
      return matchQuery && matchSeverity;
    });
  }, [data?.auditLogs, query, severity]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Đang tải nhật ký kiểm toán...</div>;
  }

  if (error || !data) {
    return <div className="text-sm text-red-600">{error || 'Tải nhật ký thất bại.'}</div>;
  }

  const columns: DataColumn<AuditLog>[] = [
    { key: 'id', title: 'ID' },
    { key: 'actor', title: 'Người thực hiện' },
    { key: 'action', title: 'Hành động' },
    { key: 'target', title: 'Bảng mục tiêu' },
    { key: 'details', title: 'Chi tiết' },
    { key: 'timestamp', title: 'Thời gian' },
    {
      key: 'severity',
      title: 'Mức độ',
      render: (row) => <StatusBadge status={row.severity} />,
    },
  ];

  return (
    <div className="grid gap-4">
      <SearchFilterBar
        query={query}
        onQueryChange={setQuery}
        filterValue={severity}
        onFilterChange={setSeverity}
        filterOptions={['all', 'low', 'medium', 'high', 'critical']}
      />

      <DataTable title="Nhật ký kiểm toán" rows={filtered} columns={columns} />
    </div>
  );
}
