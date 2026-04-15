import { NavLink, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function navByRole(role) {
  if (role === 'admin') {
    return [
      { to: '/admin/departments', label: 'Departments' },
      { to: '/admin/courses', label: 'Courses' },
      { to: '/admin/faculty', label: 'Faculty' },
      { to: '/admin/students', label: 'Students' },
      { to: '/admin/rooms', label: 'Rooms' },
      { to: '/admin/sessions', label: 'Sessions' },
      { to: '/admin/generate', label: 'Generate' },
      { to: '/admin/substitutions', label: 'Substitutions' },
    ]
  }

  if (role === 'faculty') {
    return [
      { to: '/faculty', label: 'My Timetable' },
      { to: '/faculty/availability', label: 'Availability' },
      { to: '/faculty/substitution', label: 'Substitution' },
    ]
  }

  return [
    { to: '/student', label: 'My Timetable' },
    { to: '/student/enrollment', label: 'Enrollment' },
  ]
}

export function AppShell({ role, name, onLogout }) {
  const navItems = navByRole(role)
  const roleLabel = role ? role[0].toUpperCase() + role.slice(1) : 'User'

  return (
    <div className="min-h-screen bg-[#e9edf2] px-2 py-3 md:px-4">
      <div className="mx-auto min-h-[calc(100vh-24px)] w-full max-w-[1120px] bg-white shadow-sm">
        <header className="border-b border-blue-500/30 bg-gradient-to-r from-blue-900 to-blue-500 text-white">
          <div className="flex min-h-[56px] items-center justify-between gap-3 px-4 lg:px-5">
            <NavLink to={`/${role}`} className="flex shrink-0 items-center gap-2.5 whitespace-nowrap">
              <span className="text-sm">🧾</span>
              <h1 className="text-[18px] font-bold leading-none">Timetable System</h1>
              <span className="rounded-sm bg-white/90 px-2 py-0.5 text-[11px] font-semibold leading-none text-blue-700">{roleLabel}</span>
            </NavLink>
            <nav className="hidden min-w-0 flex-1 items-center justify-end gap-1 whitespace-nowrap px-2 md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === `/${role}`}
                  className={({ isActive }) =>
                    cn(
                      'shrink-0 rounded-sm px-2.5 py-1.5 text-[13px] font-medium leading-none text-white/90 transition hover:bg-white/10 hover:text-white',
                      isActive && 'bg-white/15 text-white'
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" className="h-7 rounded-sm border-blue-300 bg-blue-400/60 px-2.5 text-xs text-white hover:bg-blue-400/80" onClick={onLogout}>
                Logout
              </Button>
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto border-t border-white/15 px-3 py-2 md:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === `/${role}`}
                className={({ isActive }) =>
                  cn(
                    'shrink-0 rounded px-2 py-1 text-xs font-medium text-white/90',
                    isActive && 'bg-white/15 text-white'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </header>

        <main className="px-5 py-5 lg:px-9 lg:py-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
