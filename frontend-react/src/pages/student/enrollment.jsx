import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { requestJson } from '@/lib/api'
import { toast } from 'sonner'

export function StudentEnrollmentPage() {
  const [rows, setRows] = useState([])
  const [sessionId, setSessionId] = useState('')
  const [sessionName, setSessionName] = useState('')

  async function load() {
    try {
      const data = await requestJson({ method: 'GET', url: '/actions/enrollment.php' })
      const payload = data.data || data
      setRows(payload.courses || [])
      setSessionId(String(payload.academic_session_id || ''))
      setSessionName(payload.academic_session_name || '')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load enrollment')
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function enroll(courseId) {
    try {
      const result = await requestJson({
        method: 'POST',
        url: '/actions/enrollment.php',
        data: { course_id: Number(courseId), academic_session_id: Number(sessionId) },
      })
      toast.success(result.message || 'Enrolled')
      load()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Enrollment failed')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Enrollment</CardTitle>
        <p className="text-sm text-muted-foreground">Current session: {sessionName || '-'}</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Course Name</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Credit Hours</TableHead>
              <TableHead>Prerequisite</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.code}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.semester}</TableCell>
                <TableCell>{row.credit_hours}</TableCell>
                <TableCell>{row.prerequisite_code ? `${row.prerequisite_code} - ${row.prerequisite_name}` : '-'}</TableCell>
                <TableCell>
                  {row.enrolled ? (
                    <span className="text-sm font-medium text-green-600">Enrolled</span>
                  ) : (
                    <Button size="sm" onClick={() => enroll(row.id)}>Enroll</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
