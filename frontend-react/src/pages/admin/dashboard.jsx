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
    <div className="space-y-7">
      <div className="pt-1">
        <h2 className="text-[28px] font-bold leading-none tracking-[-0.02em] text-slate-800">Admin Dashboard</h2>
        <p className="mt-2.5 text-[13px] text-slate-500">Manage courses, faculty, rooms, and generate timetables.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((item) => (
          <Card key={item.key} className="rounded-[12px] border-slate-200/70 shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
            <CardContent className="flex min-h-[124px] flex-col items-center justify-center p-5 text-center">
              <p className="text-[48px] font-extrabold leading-none tracking-[-0.03em] text-[#1f6ff4]">{counts[item.key] ?? '-'}</p>
              <p className="mt-1.5 text-[13px] font-medium text-slate-500">{item.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-[12px] border-slate-200/70 shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
        <CardHeader className="px-5 pb-2 pt-5">
          <CardTitle className="text-[20px] font-bold leading-none tracking-[-0.01em] text-slate-800">Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <p className="text-[13px] leading-6 text-slate-500">
            Use the navigation bar to open{' '}
            <Link className="text-blue-600 underline underline-offset-2" to="/admin/departments">Departments</Link>,{' '}
            <Link className="text-blue-600 underline underline-offset-2" to="/admin/courses">Courses</Link>,{' '}
            <Link className="text-blue-600 underline underline-offset-2" to="/admin/faculty">Faculty</Link>,{' '}
            <Link className="text-blue-600 underline underline-offset-2" to="/admin/students">Students</Link>,{' '}
            <Link className="text-blue-600 underline underline-offset-2" to="/admin/rooms">Rooms</Link>,{' '}
            <Link className="text-blue-600 underline underline-offset-2" to="/admin/sessions">Sessions</Link>,{' '}
            <Link className="text-blue-600 underline underline-offset-2" to="/admin/generate">Generate</Link> timetable, or{' '}
            <Link className="text-blue-600 underline underline-offset-2" to="/admin/substitutions">Substitutions</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
