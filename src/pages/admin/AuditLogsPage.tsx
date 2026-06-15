import { useMemo, useState } from 'react';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { SearchFilterBar } from '@/components/common/SearchFilterBar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { useAdminDataset } from '@/hooks/admin/useAdminDataset';
import type { AuditLog } from '@/types';

// Nhãn tiếng Việt cho từng bảng mục tiêu (targetTable) của nhật ký.
const TARGET_LABELS: Record<string, string> = {
  users: 'Người dùng',
  buildings: 'Tòa nhà',
  floors: 'Tầng',
  gates: 'Cổng',
  parking_slots: 'Chỗ đỗ',
  vehicle_types: 'Loại xe',
  price_policies: 'Bảng giá',
  long_term_packages: 'Gói dài hạn',
  reservation_policies: 'Chính sách đặt chỗ',
  shifts: 'Ca làm việc',
  staff_shifts: 'Phân ca nhân viên',
  feedbacks: 'Phản hồi',
  revenue_distributions: 'Phân phối doanh thu',
  subscription_packages: 'Gói dịch vụ',
  subscriptions: 'Đăng ký gói',
  wallets: 'Ví',
  transactions: 'Giao dịch',
};

const targetLabel = (target: string) => TARGET_LABELS[target] ?? target;

// Động từ tiếng Việt suy ra từ tiền tố của mã hành động (CREATE_/UPDATE_/...).
const ACTION_VERBS: Record<string, string> = {
  CREATE: 'Tạo',
  UPDATE: 'Cập nhật',
  DELETE: 'Xóa',
  ASSIGN: 'Gán',
  REVOKE: 'Thu hồi',
  GRANT: 'Cấp',
  RESPOND: 'Phản hồi',
  DISTRIBUTE: 'Phân phối',
  LOGIN: 'Đăng nhập',
  LOGOUT: 'Đăng xuất',
};

// "UPDATE_PRICE_POLICY" trên bảng price_policies → "Cập nhật bảng giá".
const friendlyDetails = (log: AuditLog) => {
  const verbKey = Object.keys(ACTION_VERBS).find((v) => log.action.startsWith(v));
  if (!verbKey) return log.details;
  return `${ACTION_VERBS[verbKey]} ${targetLabel(log.target).toLowerCase()}`;
};

const PAGE_SIZE = 8;

export function AuditLogsPage() {
  const { data, isLoading, error } = useAdminDataset();
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('all');
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const logs = useMemo(() => data?.auditLogs ?? [], [data?.auditLogs]);

  // Nhóm nhật ký theo bảng mục tiêu để tách thành các tab nhỏ.
  const groups = useMemo(() => {
    const map = new Map<string, AuditLog[]>();
    for (const log of logs) {
      const key = log.target || 'khác';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(log);
    }
    return Array.from(map.entries())
      .map(([key, items]) => ({ key, items }))
      .sort((a, b) => targetLabel(a.key).localeCompare(targetLabel(b.key), 'vi'));
  }, [logs]);

  const currentTab = activeTab && groups.some((g) => g.key === activeTab)
    ? activeTab
    : groups[0]?.key ?? null;

  const filtered = useMemo(() => {
    const source = groups.find((g) => g.key === currentTab)?.items ?? [];
    return source.filter((log) => {
      const q = query.trim().toLowerCase();
      const matchQuery =
        log.actor.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.target.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        (log.building?.toLowerCase().includes(q) ?? false);
      const matchSeverity = severity === 'all' || log.severity === severity;
      return matchQuery && matchSeverity;
    });
  }, [groups, currentTab, query, severity]);

  const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, maxPage);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Đang tải nhật ký hoạt động...</div>;
  }

  if (error || !data) {
    return <div className="text-sm text-red-600">{error || 'Tải nhật ký thất bại.'}</div>;
  }

  const columns: DataColumn<AuditLog>[] = [
    { key: 'actor', title: 'Người thực hiện' },
    {
      key: 'details',
      title: 'Chi tiết',
      render: (row) => (
        <div>
          <div className="text-foreground">{friendlyDetails(row)}</div>
          <div className="text-xs text-muted-foreground">
            {row.building ? `Tòa nhà: ${row.building}` : 'Toàn hệ thống'}
          </div>
        </div>
      ),
    },
    { key: 'timestamp', title: 'Thời gian' },
    {
      key: 'severity',
      title: 'Mức độ',
      render: (row) => <StatusBadge status={row.severity} />,
    },
  ];

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Chưa có nhật ký hoạt động nào.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {/* Tab nhỏ cho từng bảng mục tiêu */}
      <div className="flex flex-wrap gap-2">
        {groups.map((g) => {
          const isActive = g.key === currentTab;
          return (
            <button
              key={g.key}
              type="button"
              onClick={() => {
                setActiveTab(g.key);
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              {targetLabel(g.key)}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
                }`}
              >
                {g.items.length}
              </span>
            </button>
          );
        })}
      </div>

      <SearchFilterBar
        query={query}
        onQueryChange={(value) => {
          setPage(1);
          setQuery(value);
        }}
        filterValue={severity}
        onFilterChange={(value) => {
          setPage(1);
          setSeverity(value);
        }}
        filterOptions={['all', 'low', 'medium', 'high', 'critical']}
      />

      <DataTable
        title={`Nhật ký: ${currentTab ? targetLabel(currentTab) : ''}`}
        rows={pageRows}
        columns={columns}
      />

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {filtered.length > 0
            ? `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filtered.length)} / ${filtered.length} bản ghi`
            : 'Không có bản ghi phù hợp'}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Trước
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {safePage} / {maxPage}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={safePage >= maxPage}
            onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
          >
            Tiếp
          </Button>
        </div>
      </div>
    </div>
  );
}
