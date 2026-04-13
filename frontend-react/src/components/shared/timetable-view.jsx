import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { exportUrl } from '@/lib/api'

export function TimetableView({ title, sessions, selectedSession, onSessionChange, rows }) {
  return (
    <Card className="border-blue-200/70 bg-white/80 shadow-md backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-blue-900">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 md:gap-3">
          <div>
            <Label className="font-medium text-blue-900">Academic Session</Label>
            <select
              className="mt-1 h-10 min-w-64 rounded-md border border-blue-200 bg-white px-3 text-foreground shadow-sm outline-none ring-0 transition focus:border-blue-400"
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
            variant="outline"
            onClick={() => window.open(exportUrl('csv', selectedSession), '_blank')}
            disabled={!selectedSession}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open(exportUrl('pdf', selectedSession), '_blank')}
            disabled={!selectedSession}
          >
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open(exportUrl('ics', selectedSession), '_blank')}
            disabled={!selectedSession}
          >
            Export Calendar
          </Button>
        </div>

        <Table className="overflow-hidden rounded-lg border border-blue-100 bg-white/70">
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Faculty</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Slot</TableHead>
              <TableHead>Day</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Section</TableHead>
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
                <TableRow key={row.id}>
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
