import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { requestJson } from '@/lib/api'
import { toast } from 'sonner'

export function AdminSubstitutionsPage() {
  const [rows, setRows] = useState([])
  const [notesById, setNotesById] = useState({})

  async function load() {
    const data = await requestJson({ method: 'GET', url: '/actions/substitution.php' })
    setRows(data || [])
  }

  useEffect(() => {
    load()
  }, [])

  async function updateStatus(id, status) {
    try {
      const result = await requestJson({
        method: 'PUT',
        url: '/actions/substitution.php',
        data: { id, status, admin_notes: notesById[id] || '' },
      })
      toast.success(result.message || 'Updated')
      load()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Update failed')
    }
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3"><CardTitle>Substitution Requests</CardTitle></CardHeader>
      <CardContent>
        <Table className="overflow-hidden rounded-lg border border-slate-200">
          <TableHeader>
            <TableRow className="bg-slate-100 hover:bg-slate-100">
              <TableHead className="bg-slate-100 text-slate-700">Faculty</TableHead>
              <TableHead className="bg-slate-100 text-slate-700">Course</TableHead>
              <TableHead className="bg-slate-100 text-slate-700">Date</TableHead>
              <TableHead className="bg-slate-100 text-slate-700">Reason</TableHead>
              <TableHead className="bg-slate-100 text-slate-700">Status</TableHead>
              <TableHead className="bg-slate-100 text-slate-700">Admin Notes</TableHead>
              <TableHead className="bg-slate-100 text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.faculty_name}</TableCell>
                <TableCell>{row.course_code} - {row.course_name}</TableCell>
                <TableCell>{row.requested_date}</TableCell>
                <TableCell>{row.reason}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>
                  <Textarea
                    value={notesById[row.id] ?? row.admin_notes ?? ''}
                    onChange={(e) => setNotesById((prev) => ({ ...prev, [row.id]: e.target.value }))}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => updateStatus(Number(row.id), 'approved')}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => updateStatus(Number(row.id), 'rejected')}>Reject</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
