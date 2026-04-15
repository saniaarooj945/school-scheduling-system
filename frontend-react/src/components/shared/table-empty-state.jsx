import { Inbox } from 'lucide-react'
import { TableCell, TableRow } from '@/components/ui/table'

export function TableEmptyState({
  colSpan,
  title = 'No data found',
  message = 'There are no records to display right now.',
}) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-10 text-center">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Inbox size={18} />
          </span>
          <p className="text-sm font-semibold text-slate-600">{title}</p>
          <p className="text-xs text-slate-500">{message}</p>
        </div>
      </TableCell>
    </TableRow>
  )
}