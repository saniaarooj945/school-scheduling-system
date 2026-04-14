import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { requestJson } from '@/lib/api'
import { toast } from 'sonner'

export function FacultySubstitutionPage() {
  const [sessions, setSessions] = useState([])
  const [sessionId, setSessionId] = useState('')
  const [schedule, setSchedule] = useState([])
  const [requests, setRequests] = useState([])
  const [form, setForm] = useState({ schedule_id: '', requested_date: '', reason: '' })

  useEffect(() => {
    requestJson({ method: 'GET', url: '/actions/sessions' }).then((data) => {
      setSessions(data || [])
      if (data?.[0]?.id) setSessionId(String(data[0].id))
    })
    loadRequests()
  }, [])

  useEffect(() => {
    if (!sessionId) return
    requestJson({ method: 'GET', url: '/actions/schedule', params: { academic_session_id: Number(sessionId) } }).then((data) => {
      setSchedule(data.list || [])
    })
  }, [sessionId])

  const loadRequests = async () => {
    const rows = await requestJson({ method: 'GET', url: '/actions/substitution' })
    setRequests(rows || [])
  }

  const submit = async () => {
    try {
      if (!form.schedule_id) {
        toast.error('Please select a scheduled class')
        return
      }
      if (!form.requested_date) {
        toast.error('Please select requested date')
        return
      }
      if (!String(form.reason || '').trim()) {
        toast.error('Please enter a reason')
        return
      }
      const result = await requestJson({
        method: 'POST',
        url: '/actions/substitution',
        data: {
          schedule_id: Number(form.schedule_id),
          requested_date: form.requested_date,
          reason: String(form.reason).trim(),
        },
      })
      toast.success(result.message || 'Submitted')
      setForm({ schedule_id: '', requested_date: '', reason: '' })
      loadRequests()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Submit failed')
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Request Substitution</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <Label>Session</Label>
            <select className="mt-1 h-10 w-full rounded-md border px-3" value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
              <option value="">-- Select --</option>
              {sessions.map((session) => <option key={session.id} value={session.id}>{session.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Scheduled Class</Label>
            <select className="mt-1 h-10 w-full rounded-md border px-3" value={form.schedule_id} onChange={(e) => setForm((prev) => ({ ...prev, schedule_id: e.target.value }))}>
              <option value="">-- Select --</option>
              {schedule.map((row) => (
                <option key={row.id} value={row.id}>{row.course_code} - {row.course_name} ({row.slot_label})</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Requested Date</Label>
            <Input type="date" value={form.requested_date} onChange={(e) => setForm((prev) => ({ ...prev, requested_date: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <Label>Reason</Label>
            <Textarea value={form.reason} onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))} />
          </div>
          <div className="md:col-span-2"><Button onClick={submit}>Submit Request</Button></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>My Requests</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Admin Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.course_code} - {row.course_name}</TableCell>
                  <TableCell>{row.requested_date}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell>{row.admin_notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
