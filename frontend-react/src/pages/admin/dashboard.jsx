import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { fetchPaged } from '@/lib/crud'

const cards = [
  { key: 'departments', title: 'Departments', endpoint: '/actions/departments' },
  { key: 'courses', title: 'Courses', endpoint: '/actions/courses' },
  { key: 'faculty', title: 'Faculty', endpoint: '/actions/faculty' },
  { key: 'students', title: 'Students', endpoint: '/actions/students' },
  { key: 'rooms', title: 'Rooms', endpoint: '/actions/rooms' },
  { key: 'sessions', title: 'Sessions', endpoint: '/actions/sessions' },
]

export function AdminDashboardPage() {
  const [counts, setCounts] = useState({})

  useEffect(() => {
    let mounted = true
    Promise.all(
      cards.map(async (item) => {
        const data = await fetchPaged(item.endpoint, { page: 1, pageSize: 25, q: '' })
        return [item.key, data.total || 0]
      })
    ).then((entries) => {
      if (!mounted) return
      setCounts(Object.fromEntries(entries))
    })

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 md:text-4xl">Admin Dashboard</h2>
        <p className="mt-1 text-base text-slate-500">Manage courses, faculty, rooms, and generate timetables</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((item) => (
          <Card key={item.key} className="border-slate-200 shadow-none">
            <CardContent className="p-4 text-center">
              <p className="text-4xl font-extrabold leading-none text-blue-600">{counts[item.key] ?? '-'}</p>
              <p className="mt-1 text-sm text-slate-500">{item.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">Quick actions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base text-slate-500">
            Use the navigation bar to open{' '}
            <Link className="text-blue-600 underline" to="/admin/departments">Departments</Link>,{' '}
            <Link className="text-blue-600 underline" to="/admin/courses">Courses</Link>,{' '}
            <Link className="text-blue-600 underline" to="/admin/faculty">Faculty</Link>,{' '}
            <Link className="text-blue-600 underline" to="/admin/students">Students</Link>,{' '}
            <Link className="text-blue-600 underline" to="/admin/rooms">Rooms</Link>,{' '}
            <Link className="text-blue-600 underline" to="/admin/sessions">Sessions</Link>,{' '}
            <Link className="text-blue-600 underline" to="/admin/generate">Generate</Link> timetable, or{' '}
            <Link className="text-blue-600 underline" to="/admin/substitutions">Substitutions</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
