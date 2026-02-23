'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface DataTableColumn<T> {
  id: string;
  header: React.ReactNode;
  /** When set, header becomes clickable and calls onSort(id). Table shows sort indicator when sortState.key === id */
  sortKey?: string;
  cell: (row: T) => React.ReactNode;
  /** Optional cell className (default: px-6 py-4 text-sm text-gray-600) */
  cellClassName?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  getRowClassName?: (row: T) => string;
  /** Current sort key and direction; used with columns[].sortKey and onSort */
  sortState?: { key: string; direction: 'asc' | 'desc' };
  onSort?: (key: string) => void;
  /** Number of columns for loading/empty row colspan */
  colSpan?: number;
}

const defaultLoadingMessage = 'Loading...';
const defaultEmptyMessage = 'No data found.';

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  loadingMessage = defaultLoadingMessage,
  emptyMessage = defaultEmptyMessage,
  onRowClick,
  getRowClassName,
  sortState,
  onSort,
  colSpan,
}: DataTableProps<T>) {
  const span = colSpan ?? columns.length;

  return (
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow>
          {columns.map((col) => {
            const isSortable = Boolean(col.sortKey && onSort);
            const isActiveSort = sortState && col.sortKey === sortState.key;
            return (
              <TableHead
                key={col.id}
                className={
                  isSortable
                    ? 'px-6 py-4 text-xs font-semibold uppercase text-muted-foreground cursor-pointer select-none hover:text-primary transition-colors'
                    : 'px-6 py-4 text-xs font-semibold uppercase text-muted-foreground'
                }
                onClick={
                  isSortable && col.sortKey
                    ? () => onSort(col.sortKey!)
                    : undefined
                }
                title={isSortable ? 'Click to toggle sort order' : undefined}
              >
                {col.header}
                {isSortable && isActiveSort && (
                  <span className="ml-1">
                    {sortState.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell
              colSpan={span}
              className="p-8 text-center text-muted-foreground"
            >
              {loadingMessage}
            </TableCell>
          </TableRow>
        ) : data.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={span}
              className="p-8 text-center text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          data.map((row) => {
            const key = keyExtractor(row);
            const rowClass = getRowClassName?.(row) ?? '';
            return (
              <TableRow
                key={key}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={
                  onRowClick
                    ? `group transition-colors cursor-pointer ${rowClass}`.trim()
                    : rowClass.trim() || undefined
                }
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.id}
                    className={col.cellClassName ?? 'px-6 py-4 text-sm text-gray-600'}
                  >
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
