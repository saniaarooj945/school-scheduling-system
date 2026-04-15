import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableEmptyState } from '@/components/shared/table-empty-state'
import { requestJson } from '@/lib/api'
import { toast } from 'sonner'

export function StudentEnrollmentPage() {
  const [rows, setRows] = useState([])
  const [sessionId, setSessionId] = useState('')
  const [sessionName, setSessionName] = useState('')

  async function load() {
    try {
      const data = await requestJson({ method: 'GET', url: '/actions/enrollment' })
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
        url: '/actions/enrollment',
        data: { course_id: Number(courseId), academic_session_id: Number(sessionId) },
      })
      toast.success(result.message || 'Enrolled')
      load()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Enrollment failed')
    }
  }

  return (
    <Card className="rounded-[14px] border-slate-200/70 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
      <CardHeader className="px-5 pb-3 pt-5 sm:px-6">
        <CardTitle className="text-[28px] font-bold leading-none tracking-[-0.02em] text-slate-800">Course Enrollment</CardTitle>
        <p className="text-sm text-slate-500">Current session: {sessionName || '-'}</p>
      </CardHeader>
      <CardContent className="px-5 pb-5 sm:px-6">
        <Table className="overflow-hidden rounded-[10px] border border-slate-200 bg-white">
          <TableHeader>
            <TableRow className="bg-slate-100 hover:bg-slate-100">
              <TableHead className="bg-slate-100 font-semibold text-slate-700">Code</TableHead>
              <TableHead className="bg-slate-100 font-semibold text-slate-700">Course Name</TableHead>
              <TableHead className="bg-slate-100 font-semibold text-slate-700">Semester</TableHead>
              <TableHead className="bg-slate-100 font-semibold text-slate-700">Credit Hours</TableHead>
              <TableHead className="bg-slate-100 font-semibold text-slate-700">Prerequisite</TableHead>
              <TableHead className="bg-slate-100 font-semibold text-slate-700">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableEmptyState colSpan={6} title="No courses available" message="There are no courses available for enrollment right now." />
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} className="odd:bg-white even:bg-slate-50/80">
                  <TableCell>{row.code}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.semester}</TableCell>
                  <TableCell>{row.credit_hours}</TableCell>
                  <TableCell>{row.prerequisite_code ? `${row.prerequisite_code} - ${row.prerequisite_name}` : '-'}</TableCell>
                  <TableCell>
                    {row.enrolled ? (
                      <span className="text-sm font-medium text-green-600">Enrolled</span>
                    ) : (
                      <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => enroll(row.id)}>
                        Enroll
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
