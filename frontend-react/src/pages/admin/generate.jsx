import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { fetchList, requestJson } from '@/lib/api'
import { toast } from 'sonner'

export function AdminGeneratePage() {
  const [sessions, setSessions] = useState([])
  const [courses, setCourses] = useState([])
  const [rooms, setRooms] = useState([])
  const [slots, setSlots] = useState([])
  const [schedule, setSchedule] = useState([])
  const [selectedCourseIds, setSelectedCourseIds] = useState([])
  const [form, setForm] = useState({ academic_session_id: '', semester: 1, section: 'A', clear_first: true })
  const [move, setMove] = useState({ schedule_id: '', room_id: '', time_slot_id: '' })

  useEffect(() => {
    Promise.all([
      fetchList('/actions/sessions.php'),
      fetchList('/actions/courses.php'),
      fetchList('/actions/rooms.php'),
      fetchList('/actions/time_slots.php'),
    ]).then(([sessionRows, courseRows, roomRows, slotRows]) => {
      setSessions(sessionRows || [])
      setCourses(courseRows || [])
      setRooms(roomRows || [])
      setSlots(slotRows || [])
      if (sessionRows?.[0]?.id) {
        setForm((prev) => ({ ...prev, academic_session_id: sessionRows[0].id }))
      }
    })
  }, [])

  async function generate() {
    try {
      const payload = {
        ...form,
        academic_session_id: Number(form.academic_session_id),
        semester: Number(form.semester),
        clear_first: Boolean(form.clear_first),
        course_ids: selectedCourseIds,
      }
      const result = await requestJson({ method: 'POST', url: '/actions/generate.php', data: payload })
      toast.success(result.message || 'Timetable generated')
      loadSchedule()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Generation failed')
    }
  }

  async function loadSchedule() {
    if (!form.academic_session_id) return
    const data = await requestJson({
      method: 'GET',
      url: '/actions/schedule.php',
      params: {
        academic_session_id: Number(form.academic_session_id),
        semester: Number(form.semester),
        section: form.section,
      },
    })
    setSchedule(data.list || [])
  }

  async function moveSchedule() {
    try {
      const result = await requestJson({
        method: 'POST',
        url: '/actions/schedule_move.php',
        data: {
          schedule_id: Number(move.schedule_id),
          room_id: move.room_id ? Number(move.room_id) : undefined,
          time_slot_id: move.time_slot_id ? Number(move.time_slot_id) : undefined,
        },
      })
      toast.success(result.message || 'Schedule updated')
      loadSchedule()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Move failed')
    }
  }

  return (
    <div className="space-y-5">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3"><CardTitle>Generate Timetable</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label>Session</Label>
            <select className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3" value={form.academic_session_id} onChange={(e) => setForm((prev) => ({ ...prev, academic_session_id: e.target.value }))}>
              <option value="">-- Select --</option>
              {sessions.map((session) => <option key={session.id} value={session.id}>{session.name}</option>)}
            </select>
          </div>
          <div><Label>Semester</Label><Input type="number" min={1} value={form.semester} onChange={(e) => setForm((prev) => ({ ...prev, semester: e.target.value }))} /></div>
          <div><Label>Section</Label><Input value={form.section} onChange={(e) => setForm((prev) => ({ ...prev, section: e.target.value }))} /></div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.clear_first} onChange={(e) => setForm((prev) => ({ ...prev, clear_first: e.target.checked }))} />Clear first</label>
          </div>
          <div className="md:col-span-2 lg:col-span-4">
            <Label>Include Courses (optional)</Label>
            <div className="mt-2 grid max-h-40 grid-cols-1 gap-1 overflow-auto rounded-md border p-2 md:grid-cols-2">
              {courses.map((course) => (
                <label key={course.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedCourseIds.includes(Number(course.id))}
                    onChange={(e) => {
                      setSelectedCourseIds((prev) =>
                        e.target.checked ? [...prev, Number(course.id)] : prev.filter((id) => id !== Number(course.id))
                      )
                    }}
                  />
                  {course.code} - {course.name}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2 md:col-span-2 lg:col-span-4">
            <Button className="h-10 bg-blue-600 text-white hover:bg-blue-700" onClick={generate}>Generate</Button>
            <Button variant="outline" className="h-10 border-slate-300 bg-white" onClick={loadSchedule}>Load Schedule</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3"><CardTitle>Manual Move</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div><Label>Schedule ID</Label><Input value={move.schedule_id} onChange={(e) => setMove((prev) => ({ ...prev, schedule_id: e.target.value }))} /></div>
          <div>
            <Label>Room</Label>
            <select className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3" value={move.room_id} onChange={(e) => setMove((prev) => ({ ...prev, room_id: e.target.value }))}>
              <option value="">-- Keep current --</option>
              {rooms.map((room) => <option key={room.id} value={room.id}>{room.room_number}</option>)}
            </select>
          </div>
          <div>
            <Label>Time Slot</Label>
            <select className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3" value={move.time_slot_id} onChange={(e) => setMove((prev) => ({ ...prev, time_slot_id: e.target.value }))}>
              <option value="">-- Keep current --</option>
              {slots.map((slot) => <option key={slot.id} value={slot.id}>{slot.slot_label}</option>)}
            </select>
          </div>
          <div className="md:col-span-3"><Button className="h-10 bg-blue-600 text-white hover:bg-blue-700" onClick={moveSchedule}>Apply Move</Button></div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3"><CardTitle>Schedule</CardTitle></CardHeader>
        <CardContent>
          <Table className="overflow-hidden rounded-lg border border-slate-200">
            <TableHeader>
              <TableRow className="bg-slate-100 hover:bg-slate-100">
                <TableHead className="bg-slate-100 text-slate-700">ID</TableHead>
                <TableHead className="bg-slate-100 text-slate-700">Course</TableHead>
                <TableHead className="bg-slate-100 text-slate-700">Faculty</TableHead>
                <TableHead className="bg-slate-100 text-slate-700">Room</TableHead>
                <TableHead className="bg-slate-100 text-slate-700">Slot</TableHead>
                <TableHead className="bg-slate-100 text-slate-700">Semester</TableHead>
                <TableHead className="bg-slate-100 text-slate-700">Section</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.course_code} - {row.course_name}</TableCell>
                  <TableCell>{row.faculty_name}</TableCell>
                  <TableCell>{row.room_number}</TableCell>
                  <TableCell>{row.slot_label}</TableCell>
                  <TableCell>{row.semester}</TableCell>
                  <TableCell>{row.section}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
