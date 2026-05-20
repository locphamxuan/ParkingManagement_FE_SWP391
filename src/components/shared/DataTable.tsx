import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReactNode } from 'react';

export interface DataColumn<T> {
  key: keyof T | string;
  title: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  title: string;
  rows: T[];
  columns: DataColumn<T>[];
  emptyText?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  title,
  rows,
  columns,
  emptyText = 'Không tìm thấy bản ghi.',
}: DataTableProps<T>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-0">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className="border-b border-border px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-stone-600"
                  >
                    {column.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columns.map((column) => (
                      <td key={String(column.key)} className="border-b border-border/60 px-3 py-3 text-sm text-foreground">
                        {column.render ? column.render(row) : String(row[column.key as keyof T] ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-6 text-sm text-stone-700" colSpan={columns.length}>
                    {emptyText}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
