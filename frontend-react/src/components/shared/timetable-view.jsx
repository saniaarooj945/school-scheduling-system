import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
    <Card className="border-slate-200 bg-[#f4f6fb] shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-slate-800">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 rounded-md border border-slate-200 bg-white p-3 md:gap-3">
          <div>
            <Label className="text-sm font-semibold text-slate-700">Academic Session</Label>
            <select
              className="mt-1 h-10 min-w-64 rounded-md border border-slate-300 bg-white px-3 text-foreground shadow-sm outline-none transition focus:border-slate-400"
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
            className="h-9 bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-400"
            onClick={() => handleExport('csv')}
            disabled={!selectedSession || !!activeExport}
          >
            {activeExport === 'csv' ? 'Exporting CSV...' : 'Export CSV'}
          </Button>
          <Button
            className="h-9 bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-400"
            onClick={() => handleExport('pdf')}
            disabled={!selectedSession || !!activeExport}
          >
            {activeExport === 'pdf' ? 'Exporting PDF...' : 'Export PDF'}
          </Button>
          <Button
            className="h-9 bg-sky-600 text-white hover:bg-sky-700 disabled:bg-sky-400"
            onClick={() => handleExport('ics')}
            disabled={!selectedSession || !!activeExport}
          >
            {activeExport === 'ics' ? 'Exporting Calendar...' : 'Export Calendar'}
          </Button>
        </div>

        <Table className="overflow-hidden rounded-lg border border-slate-200 bg-white">
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
              <TableRow>
                <TableCell colSpan={8} className="py-6 text-center text-muted-foreground">
                  No schedule found.
                </TableCell>
              </TableRow>
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
