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

export function DataTable<T extends object>({
  title,
  rows,
  columns,
  emptyText = 'Không tìm thấy bản ghi.',
}: DataTableProps<T>) {
  return (
    <Card className="overflow-hidden border border-border/60 bg-white/70 shadow-lg shadow-stone-200/50 backdrop-blur-md">
      <CardHeader className="border-b border-border/40 bg-stone-50/40 p-5">
        <CardTitle className="text-base font-bold tracking-tight text-stone-800">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="bg-stone-50/80 border-b border-border/40">
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-[0.1em] text-stone-500/90"
                  >
                    {column.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {rows.length > 0 ? (
                rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="premium-row group hover:bg-stone-50/40 transition-colors">
                    {columns.map((column) => (
                      <td key={String(column.key)} className="px-6 py-4 text-sm text-stone-800">
                        {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key as string] ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-6 py-8 text-center text-sm text-stone-500 italic" colSpan={columns.length}>
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
