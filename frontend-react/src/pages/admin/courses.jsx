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
  const [isFormOpen, setIsFormOpen] = useState(false)
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
    fetchList('/actions/departments').then((rows) => setDepartments(rows || []))
    fetchList('/actions/faculty').then((rows) => setFaculty(rows || []))
  }, [])

  useEffect(() => {
    load()
  }, [page, pageSize])

  const load = async (next = {}) => {
    const currentPage = next.page ?? page
    const currentPageSize = next.pageSize ?? pageSize
    const currentQuery = next.query ?? query
    try {
      const data = await fetchPaged('/actions/courses', {
        page: currentPage,
        pageSize: currentPageSize,
        q: currentQuery,
      })
      setCourses(data.items || [])
      setTotal(data.total || 0)
    } catch (error) {
      const status = error?.response?.status
      const message = error?.response?.data?.message || error?.message || 'Failed to load courses'
      toast.error(status ? `${status}: ${message}` : message)
    }
  }

  const submit = async (event) => {
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
        await updateItem('/actions/courses', { ...payload, id: editingId })
        toast.success('Course updated')
      } else {
        await createItem('/actions/courses', payload)
        toast.success('Course created')
      }
      setEditingId(null)
      setIsFormOpen(false)
      setForm({ code: '', name: '', credit_hours: 3, semester: 1, department_id: '', sessions_per_week: 3 })
      load()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Save failed')
    }
  }

  const removeCourse = async (id) => {
    if (!window.confirm('Delete this course?')) return
    try {
      await deleteItem('/actions/courses', id)
      toast.success('Course removed')
      load()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Delete failed')
    }
  }

  const openAssignment = async (courseId) => {
    try {
      setSelectedCourseId(courseId)
      const rows = await requestJson({ method: 'GET', url: '/actions/course_faculty', params: { course_id: courseId } })
      setAssignedFaculty(rows || [])
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load faculty assignment')
    }
  }

  const assignFaculty = async () => {
    if (!selectedCourseId || !selectedFacultyId) {
      toast.error('Please select a faculty member')
      return
    }
    try {
      await requestJson({ method: 'POST', url: '/actions/course_faculty', data: { course_id: selectedCourseId, faculty_id: Number(selectedFacultyId) } })
      toast.success('Faculty assigned')
      setSelectedFacultyId('')
      openAssignment(selectedCourseId)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Assign failed')
    }
  }

  const unassignFaculty = async (facultyId) => {
    try {
      await requestJson({ method: 'DELETE', url: '/actions/course_faculty', data: { course_id: selectedCourseId, faculty_id: facultyId } })
      toast.success('Faculty removed')
      openAssignment(selectedCourseId)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Remove failed')
    }
  }

  const openCreateForm = () => {
    setEditingId(null)
    setForm({ code: '', name: '', credit_hours: 3, semester: 1, department_id: '', sessions_per_week: 3 })
    setIsFormOpen(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setIsFormOpen(false)
    setForm({ code: '', name: '', credit_hours: 3, semester: 1, department_id: '', sessions_per_week: 3 })
    setQuery('')
    setPage(1)
    load({ page: 1, query: '' })
  }

  const openEditForm = (course) => {
    setEditingId(course.id)
    setForm({
      code: course.code,
      name: course.name,
      credit_hours: course.credit_hours,
      semester: course.semester,
      department_id: course.department_id ? String(course.department_id) : '',
      sessions_per_week: course.sessions_per_week,
    })
    setIsFormOpen(true)
  }

  return (
    <div className="space-y-5">
      <Card className="border-slate-200 bg-[#f4f6fb] shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-2xl font-bold text-slate-800">Course Management</CardTitle>
          <Button
            className="h-10 rounded-md bg-blue-600 px-4 text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
            onClick={openCreateForm}
          >
            Add Course
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-white p-3">
            <Label className="text-sm font-semibold text-slate-700">Search</Label>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const normalizedQuery = String(query ?? '').trim()
                  setQuery(normalizedQuery)
                  setPage(1)
                  load({ page: 1, query: normalizedQuery })
                }
              }}
              placeholder="Search by code or name"
              className="h-9 w-full max-w-sm bg-white"
            />
            <Button
              className="h-9 rounded-md bg-blue-600 text-white transition-all duration-200 hover:bg-blue-700"
              onClick={() => {
                const normalizedQuery = String(query ?? '').trim()
                setQuery(normalizedQuery)
                setPage(1)
                load({ page: 1, query: normalizedQuery })
              }}
            >
              Search
            </Button>
            <Button
              variant="outline"
              className="h-9 border-slate-300 bg-white"
              onClick={resetForm}
            >
              Reset Form
            </Button>
          </div>

          <Table className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <TableHeader>
              <TableRow className="bg-slate-100 hover:bg-slate-100">
                <TableHead className="bg-slate-100 font-semibold text-slate-700">Code</TableHead>
                <TableHead className="bg-slate-100 font-semibold text-slate-700">Name</TableHead>
                <TableHead className="bg-slate-100 font-semibold text-slate-700">Credit Hrs</TableHead>
                <TableHead className="bg-slate-100 font-semibold text-slate-700">Semester</TableHead>
                <TableHead className="bg-slate-100 font-semibold text-slate-700">Dept</TableHead>
                <TableHead className="bg-slate-100 font-semibold text-slate-700">Sessions/Week</TableHead>
                <TableHead className="bg-slate-100 font-semibold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id} className="odd:bg-white even:bg-slate-50/80">
                  <TableCell>{course.code}</TableCell>
                  <TableCell>{course.name}</TableCell>
                  <TableCell>{course.credit_hours}</TableCell>
                  <TableCell>{course.semester}</TableCell>
                  <TableCell>{course.department_name}</TableCell>
                  <TableCell>{course.sessions_per_week}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-md bg-cyan-500 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-cyan-600 hover:shadow-md"
                        onClick={() => openAssignment(course.id)}
                      >
                        Assign Faculty
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-md border-yellow-400 bg-yellow-400 text-slate-800 transition-all duration-200 hover:-translate-y-0.5 hover:border-yellow-500 hover:bg-yellow-500 hover:shadow-md"
                        onClick={() => openEditForm(course)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="rounded-md bg-rose-500 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-600 hover:shadow-md"
                        onClick={() => removeCourse(course.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-sm text-slate-600">
            <div>Showing page {page} · Total {total} courses</div>
            <div className="flex items-center gap-2">
              <select className="h-10 rounded-md border border-slate-300 bg-white px-2" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}>
                {[25, 50, 75, 100].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
              <Button variant="outline" onClick={() => setPage((p) => Math.min(Math.max(1, Math.ceil(total / pageSize)), p + 1))}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isFormOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[1px]">
          <Card className="w-full max-w-2xl overflow-hidden border border-blue-100 bg-white shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 pb-3">
              <CardTitle className="text-white">{editingId ? 'Edit Course' : 'Add Course'}</CardTitle>
            </CardHeader>
            <CardContent className="bg-white">
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
                <div className="flex gap-2 md:col-span-2">
                  <Button type="submit" className="h-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700">{editingId ? 'Update' : 'Create'}</Button>
                  <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {selectedCourseId && (
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-800">Faculty Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <select className="h-10 min-w-64 rounded-md border border-slate-300 bg-white px-3" value={selectedFacultyId} onChange={(e) => setSelectedFacultyId(e.target.value)}>
                <option value="">-- Select Faculty --</option>
                {faculty.map((f) => (
                  <option key={f.id} value={f.id}>{f.full_name} ({f.email})</option>
                ))}
              </select>
              <Button className="h-10 bg-cyan-500 text-white hover:bg-cyan-600" onClick={assignFaculty}>Assign</Button>
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
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                        onClick={() => unassignFaculty(Number(f.id))}
                      >
                        Remove
                      </Button>
                    </TableCell>
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
