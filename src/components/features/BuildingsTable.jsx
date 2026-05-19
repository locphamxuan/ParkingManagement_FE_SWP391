import { useCallback } from 'react';
import AsyncState from '@/components/common/AsyncState';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import useAsyncResource from '@/hooks/useAsyncResource';
import * as parkingService from '@/services/parkingService';

function statusVariant(status) {
  if (status === 'active') return 'default';
  if (status === 'maintenance') return 'secondary';
  return 'outline';
}

function statusLabel(status) {
  const map = {
    active: 'Hoạt động',
    inactive: 'Ngưng',
    maintenance: 'Bảo trì',
  };
  return map[status] || status || '—';
}

export default function BuildingsTable() {
  const fetchBuildings = useCallback(() => parkingService.getBuildings(), []);
  const { status, items, error, reload } = useAsyncResource(fetchBuildings);

  return (
    <AsyncState
      status={status}
      error={error}
      onRetry={reload}
      loadingRows={4}
      emptyTitle="Chưa có bãi đỗ"
      emptyDescription="Dữ liệu sẽ xuất hiện khi API bãi đỗ được kích hoạt trên backend."
    >
      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Mã</TableHead>
              <TableHead>Tên</TableHead>
              <TableHead>Địa chỉ</TableHead>
              <TableHead className="w-16 text-center">Tầng</TableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((building) => (
              <TableRow key={building._id || building.id || building.code}>
                <TableCell className="font-medium">{building.code || '—'}</TableCell>
                <TableCell>{building.name || '—'}</TableCell>
                <TableCell className="max-w-[220px] truncate text-muted-foreground">
                  {building.address?.fullAddress ||
                    [building.address?.street, building.address?.district, building.address?.city]
                      .filter(Boolean)
                      .join(', ') ||
                    '—'}
                </TableCell>
                <TableCell className="text-center">{building.totalFloors ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(building.status)}>
                    {statusLabel(building.status)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AsyncState>
  );
}
