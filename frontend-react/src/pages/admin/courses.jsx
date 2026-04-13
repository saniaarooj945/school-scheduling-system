import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createItem, deleteItem, fetchList, fetchPaged, updateItem } from '@/lib/crud'
import { requestJson } from '@/lib/api'
import { toast } from 'sonner'

export function AdminCoursesPage() {
  const [departments, setDepartments] = useState([])
  const [faculty, setFaculty] = useState([])
  const [courses, setCourses] = useState([])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [total, setTotal] = useState(0)
  const [editingId, setEditingId] = useState(null)
  const [selectedCourseId, setSelectedCourseId] = useState(null)
  const [assignedFaculty, setAssignedFaculty] = useState([])
  const [selectedFacultyId, setSelectedFacultyId] = useState('')
  const [form, setForm] = useState({
    code: '',
    name: '',
    credit_hours: 3,
    semester: 1,
    department_id: '',
    sessions_per_week: 3,
  })

  useEffect(() => {
    fetchList('/actions/departments.php').then((rows) => setDepartments(rows || []))
    fetchList('/actions/faculty.php').then((rows) => setFaculty(rows || []))
  }, [])

  useEffect(() => {
    load()
  }, [page, pageSize])

  async function load() {
    const data = await fetchPaged('/actions/courses.php', { page, pageSize, q: query })
    setCourses(data.items || [])
    setTotal(data.total || 0)
  }

  async function submit(event) {
    event.preventDefault()
    const payload = {
      ...form,
      department_id: form.department_id ? Number(form.department_id) : null,
      credit_hours: Number(form.credit_hours || 3),
      semester: Number(form.semester || 1),
      sessions_per_week: Number(form.sessions_per_week || 3),
    }

    try {
      if (editingId) {
        await updateItem('/actions/courses.php', { ...payload, id: editingId })
        toast.success('Course updated')
      } else {
        await createItem('/actions/courses.php', payload)
        toast.success('Course created')
      }
      setEditingId(null)
      setForm({ code: '', name: '', credit_hours: 3, semester: 1, department_id: '', sessions_per_week: 3 })
      load()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Save failed')
    }
  }

  async function removeCourse(id) {
    if (!window.confirm('Delete this course?')) return
    try {
      await deleteItem('/actions/courses.php', id)
      toast.success('Course removed')
      load()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Delete failed')
    }
  }

  async function openAssignment(courseId) {
    setSelectedCourseId(courseId)
    const rows = await requestJson({ method: 'GET', url: '/actions/course_faculty.php', params: { course_id: courseId } })
    setAssignedFaculty(rows || [])
  }

  async function assignFaculty() {
    if (!selectedCourseId || !selectedFacultyId) return
    try {
      await requestJson({ method: 'POST', url: '/actions/course_faculty.php', data: { course_id: selectedCourseId, faculty_id: Number(selectedFacultyId) } })
      toast.success('Faculty assigned')
      openAssignment(selectedCourseId)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Assign failed')
    }
  }

  async function unassignFaculty(facultyId) {
    try {
      await requestJson({ method: 'DELETE', url: '/actions/course_faculty.php', data: { course_id: selectedCourseId, faculty_id: facultyId } })
      toast.success('Faculty removed')
      openAssignment(selectedCourseId)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Remove failed')
    }
  }

  return (
    <div className="space-y-5">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle>Courses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search courses" className="h-10 w-full max-w-sm bg-white" />
            <Button className="h-10 bg-blue-600 text-white hover:bg-blue-700" onClick={() => { setPage(1); load() }}>Search</Button>
          </div>

          <Table className="overflow-hidden rounded-lg border border-slate-200">
            <TableHeader>
              <TableRow className="bg-slate-100 hover:bg-slate-100">
                <TableHead className="bg-slate-100 text-slate-700">Code</TableHead>
                <TableHead className="bg-slate-100 text-slate-700">Name</TableHead>
                <TableHead className="bg-slate-100 text-slate-700">Semester</TableHead>
                <TableHead className="bg-slate-100 text-slate-700">Sessions/Week</TableHead>
                <TableHead className="bg-slate-100 text-slate-700">Department</TableHead>
                <TableHead className="bg-slate-100 text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>{course.code}</TableCell>
                  <TableCell>{course.name}</TableCell>
                  <TableCell>{course.semester}</TableCell>
                  <TableCell>{course.sessions_per_week}</TableCell>
                  <TableCell>{course.department_name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(course.id)
                          setForm({
                            code: course.code,
                            name: course.name,
                            credit_hours: course.credit_hours,
                            semester: course.semester,
                            department_id: course.department_id ? String(course.department_id) : '',
                            sessions_per_week: course.sessions_per_week,
                          })
                        }}
                      >
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => removeCourse(course.id)}>Delete</Button>
                      <Button size="sm" variant="secondary" onClick={() => openAssignment(course.id)}>Assign Faculty</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-sm">
            <div>Page {page} · Total {total}</div>
            <div className="flex items-center gap-2">
              <select className="h-10 rounded-md border border-slate-300 bg-white px-2" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}>
                {[25, 50, 75, 100].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
              <Button variant="outline" onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle>{editingId ? 'Edit Course' : 'Add Course'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={submit}>
            <div><Label>Code</Label><Input required value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))} /></div>
            <div><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} /></div>
            <div><Label>Credit Hours</Label><Input type="number" min={1} value={form.credit_hours} onChange={(e) => setForm((prev) => ({ ...prev, credit_hours: e.target.value }))} /></div>
            <div><Label>Semester</Label><Input type="number" min={1} value={form.semester} onChange={(e) => setForm((prev) => ({ ...prev, semester: e.target.value }))} /></div>
            <div><Label>Sessions / Week</Label><Input type="number" min={1} value={form.sessions_per_week} onChange={(e) => setForm((prev) => ({ ...prev, sessions_per_week: e.target.value }))} /></div>
            <div>
              <Label>Department</Label>
              <select className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3" value={form.department_id} onChange={(e) => setForm((prev) => ({ ...prev, department_id: e.target.value }))}>
                <option value="">-- None --</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>{department.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2"><Button type="submit" className="h-10 bg-blue-600 text-white hover:bg-blue-700">{editingId ? 'Update' : 'Create'}</Button></div>
          </form>
        </CardContent>
      </Card>

      {selectedCourseId && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle>Faculty Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <select className="h-10 min-w-64 rounded-md border border-slate-300 bg-white px-3" value={selectedFacultyId} onChange={(e) => setSelectedFacultyId(e.target.value)}>
                <option value="">-- Select Faculty --</option>
                {faculty.map((f) => (
                  <option key={f.id} value={f.id}>{f.full_name} ({f.email})</option>
                ))}
              </select>
              <Button className="h-10 bg-blue-600 text-white hover:bg-blue-700" onClick={assignFaculty}>Assign</Button>
            </div>
            <Table className="overflow-hidden rounded-lg border border-slate-200">
              <TableHeader>
                <TableRow className="bg-slate-100 hover:bg-slate-100">
                  <TableHead className="bg-slate-100 text-slate-700">Name</TableHead>
                  <TableHead className="bg-slate-100 text-slate-700">Email</TableHead>
                  <TableHead className="bg-slate-100 text-slate-700">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedFaculty.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>{f.full_name}</TableCell>
                    <TableCell>{f.email}</TableCell>
                    <TableCell><Button size="sm" variant="destructive" onClick={() => unassignFaculty(Number(f.id))}>Remove</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
