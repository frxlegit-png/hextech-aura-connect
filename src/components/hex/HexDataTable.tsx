import * as React from 'react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  mono?: boolean;
}

interface HexDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  className?: string;
}

export function HexDataTable<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  className,
}: HexDataTableProps<T>) {
  return (
    <div className={cn('w-full overflow-auto rounded-lg border border-border', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left font-medium text-muted-foreground">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'border-b border-border/50 bg-card transition-colors hover:bg-muted',
                onRowClick && 'cursor-pointer'
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn('px-4 py-3 text-foreground', col.mono && 'font-mono text-primary')}
                >
                  {col.render ? col.render(row) : (row[col.key] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
