import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableEmptyState } from '@/components/shared/table-empty-state'
import { downloadTimetableExport } from '@/lib/api'
import { useState } from 'react'

export function TimetableView({ title, sessions, selectedSession, onSessionChange, rows }) {
  const [activeExport, setActiveExport] = useState('')

  const handleExport = async (format) => {
    if (!selectedSession || activeExport) return

    try {
      setActiveExport(format)
      await downloadTimetableExport(format, selectedSession)
    } catch (error) {
      // Keep the UI resilient; users can retry immediately.
      window.alert('Export failed. Please try again.')
    } finally {
      setActiveExport('')
    }
  }

  return (
    <Card className="rounded-[14px] border-slate-200/70 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
      <CardHeader className="px-5 pb-3 pt-5 sm:px-6">
        <CardTitle className="text-[28px] font-bold leading-none tracking-[-0.02em] text-slate-800">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-5 pb-5 sm:px-6">
        <div className="flex flex-wrap items-end gap-2 rounded-[10px] border border-slate-200 bg-white p-4 md:gap-3">
          <div>
            <Label className="text-sm font-semibold text-slate-700">Academic Session</Label>
            <select
              className="mt-1 h-10 min-w-64 rounded-[10px] border border-slate-200 bg-white px-3 text-foreground shadow-sm outline-none transition focus:border-blue-500/30"
              value={selectedSession || ''}
              onChange={(e) => onSessionChange(e.target.value)}
            >
              <option value="">-- Select Session --</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
            </select>
          </div>
          <Button
            className="h-9 rounded-[10px] bg-emerald-600 px-4 text-white hover:bg-emerald-700 disabled:bg-emerald-400"
            onClick={() => handleExport('csv')}
            disabled={!selectedSession || !!activeExport}
          >
            {activeExport === 'csv' ? 'Exporting CSV...' : 'Export CSV'}
          </Button>
          <Button
            className="h-9 rounded-[10px] bg-rose-600 px-4 text-white hover:bg-rose-700 disabled:bg-rose-400"
            onClick={() => handleExport('pdf')}
            disabled={!selectedSession || !!activeExport}
          >
            {activeExport === 'pdf' ? 'Exporting PDF...' : 'Export PDF'}
          </Button>
          <Button
            className="h-9 rounded-[10px] bg-sky-600 px-4 text-white hover:bg-sky-700 disabled:bg-sky-400"
            onClick={() => handleExport('ics')}
            disabled={!selectedSession || !!activeExport}
          >
            {activeExport === 'ics' ? 'Exporting Calendar...' : 'Export Calendar'}
          </Button>
        </div>

        <Table className="overflow-hidden rounded-[10px] border border-slate-200 bg-white">
          <TableHeader>
            <TableRow className="bg-slate-100 hover:bg-slate-100">
              <TableHead className="bg-slate-100 font-semibold text-slate-700">Course</TableHead>
              <TableHead className="bg-slate-100 font-semibold text-slate-700">Faculty</TableHead>
              <TableHead className="bg-slate-100 font-semibold text-slate-700">Room</TableHead>
              <TableHead className="bg-slate-100 font-semibold text-slate-700">Slot</TableHead>
              <TableHead className="bg-slate-100 font-semibold text-slate-700">Day</TableHead>
              <TableHead className="bg-slate-100 font-semibold text-slate-700">Time</TableHead>
              <TableHead className="bg-slate-100 font-semibold text-slate-700">Semester</TableHead>
              <TableHead className="bg-slate-100 font-semibold text-slate-700">Section</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableEmptyState colSpan={8} title="No schedule found" message="Select a session or generate timetable data to populate this table." />
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} className="odd:bg-white even:bg-slate-50/80">
                  <TableCell>{row.course_code} - {row.course_name}</TableCell>
                  <TableCell>{row.faculty_name}</TableCell>
                  <TableCell>{row.room_number}</TableCell>
                  <TableCell>{row.slot_label}</TableCell>
                  <TableCell>{row.day_of_week}</TableCell>
                  <TableCell>{row.start_time} - {row.end_time}</TableCell>
                  <TableCell>{row.semester}</TableCell>
                  <TableCell>{row.section}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
