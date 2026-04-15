import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableEmptyState } from '@/components/shared/table-empty-state'
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
      fetchList('/actions/sessions'),
      fetchList('/actions/courses'),
      fetchList('/actions/rooms'),
      fetchList('/actions/time_slots'),
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

  const generate = async () => {
    try {
      if (!form.academic_session_id) {
        toast.error('Please select a session')
        return
      }
      const payload = {
        ...form,
        academic_session_id: Number(form.academic_session_id),
        semester: Number(form.semester),
        clear_first: Boolean(form.clear_first),
        course_ids: selectedCourseIds,
      }
      const result = await requestJson({ method: 'POST', url: '/actions/generate', data: payload })
      toast.success(result.message || 'Timetable generated')
      loadSchedule()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Generation failed')
    }
  }

  const loadSchedule = async () => {
    if (!form.academic_session_id) {
      toast.error('Please select a session')
      return
    }
    try {
      const data = await requestJson({
        method: 'GET',
        url: '/actions/schedule',
        params: {
          academic_session_id: Number(form.academic_session_id),
          semester: Number(form.semester),
          section: form.section,
        },
      })
      setSchedule(data.list || [])
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load schedule')
    }
  }

  const moveSchedule = async () => {
    try {
      const scheduleId = Number(move.schedule_id)
      if (!Number.isInteger(scheduleId) || scheduleId <= 0) {
        toast.error('Please select a valid schedule')
        return
      }
      const result = await requestJson({
        method: 'POST',
        url: '/actions/schedule_move',
        data: {
          schedule_id: scheduleId,
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
    <div className="space-y-6">
      <Card className="rounded-[12px] border-slate-200/70 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
        <CardHeader className="px-5 pb-4 pt-5"><CardTitle className="text-[28px] font-bold leading-none tracking-[-0.02em] text-slate-800">Generate Timetable</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 px-5 pb-5 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label>Session</Label>
            <select className="mt-1 h-10 w-full rounded-[8px] border border-slate-300 bg-white px-3" value={form.academic_session_id} onChange={(e) => setForm((prev) => ({ ...prev, academic_session_id: e.target.value }))}>
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
            <div className="mt-2 grid max-h-44 grid-cols-1 gap-1 overflow-auto rounded-[10px] border p-3 md:grid-cols-2">
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
            <Button className="h-11 rounded-[8px] bg-blue-600 px-5 text-white hover:bg-blue-700" onClick={generate}>Generate</Button>
            <Button variant="outline" className="h-11 rounded-[8px] border-slate-300 bg-white px-5" onClick={loadSchedule}>Load Schedule</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[12px] border-slate-200/70 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
        <CardHeader className="px-5 pb-4 pt-5"><CardTitle className="text-[22px] font-bold leading-none tracking-[-0.01em] text-slate-800">Manual Move</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 px-5 pb-5 md:grid-cols-3">
          <div>
            <Label>Schedule</Label>
            <select
              className="mt-1 h-10 w-full rounded-[8px] border border-slate-300 bg-white px-3"
              value={move.schedule_id}
              onChange={(e) => setMove((prev) => ({ ...prev, schedule_id: e.target.value }))}
            >
              <option value="">-- Select schedule --</option>
              {schedule.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.id} - {row.course_code} ({row.slot_label})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Room</Label>
            <select className="mt-1 h-10 w-full rounded-[8px] border border-slate-300 bg-white px-3" value={move.room_id} onChange={(e) => setMove((prev) => ({ ...prev, room_id: e.target.value }))}>
              <option value="">-- Keep current --</option>
              {rooms.map((room) => <option key={room.id} value={room.id}>{room.room_number}</option>)}
            </select>
          </div>
          <div>
            <Label>Time Slot</Label>
            <select className="mt-1 h-10 w-full rounded-[8px] border border-slate-300 bg-white px-3" value={move.time_slot_id} onChange={(e) => setMove((prev) => ({ ...prev, time_slot_id: e.target.value }))}>
              <option value="">-- Keep current --</option>
              {slots.map((slot) => <option key={slot.id} value={slot.id}>{slot.slot_label}</option>)}
            </select>
          </div>
          <div className="md:col-span-3"><Button className="h-11 rounded-[8px] bg-blue-600 px-5 text-white hover:bg-blue-700" onClick={moveSchedule}>Apply Move</Button></div>
        </CardContent>
      </Card>

      <Card className="rounded-[12px] border-slate-200/70 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
        <CardHeader className="px-5 pb-4 pt-5"><CardTitle className="text-[22px] font-bold leading-none tracking-[-0.01em] text-slate-800">Schedule</CardTitle></CardHeader>
        <CardContent className="px-5 pb-5">
          <Table className="overflow-hidden rounded-[10px] border border-slate-200">
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
              {schedule.length === 0 ? (
                <TableEmptyState colSpan={7} title="No schedule data" message="Generate or load a schedule to view rows here." />
              ) : (
                schedule.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.course_code} - {row.course_name}</TableCell>
                    <TableCell>{row.faculty_name}</TableCell>
                    <TableCell>{row.room_number}</TableCell>
                    <TableCell>{row.slot_label}</TableCell>
                    <TableCell>{row.semester}</TableCell>
                    <TableCell>{row.section}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
