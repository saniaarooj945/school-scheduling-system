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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fbff_0%,#edf2f7_42%,#e8edf5_100%)] px-3 py-3 sm:px-4 lg:px-6">
      <div className="mx-auto min-h-[calc(100vh-24px)] w-full max-w-[1080px] overflow-hidden border border-slate-200/70 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <header className="border-b border-blue-500/20 bg-[linear-gradient(90deg,#17306f_0%,#284fb0_48%,#3f74ef_100%)] text-white shadow-[0_8px_22px_rgba(37,99,235,0.12)]">
          <div className="flex min-h-[64px] items-center justify-between gap-3 px-5 sm:px-6 lg:px-7">
            <NavLink to={`/${role}`} className="flex shrink-0 items-center gap-2.5 whitespace-nowrap">
              <span className="flex h-7 w-7 items-center justify-center rounded-[5px] text-[16px] text-white">📅</span>
              <h1 className="text-[18px] font-bold leading-none tracking-[-0.02em]">Timetable System</h1>
              <span className="rounded-[6px] bg-white px-2.5 py-1 text-[12px] font-semibold leading-none text-blue-700 shadow-sm">{roleLabel}</span>
            </NavLink>
            <nav className="hidden min-w-0 flex-1 items-center justify-end gap-1 whitespace-nowrap px-2 md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === `/${role}`}
                  className={({ isActive }) =>
                    cn(
                      'shrink-0 rounded-[6px] px-2.5 py-1.5 text-[14px] font-medium leading-none transition-colors duration-200',
                      isActive
                        ? 'border border-white/80 bg-white text-slate-900'
                        : 'border border-transparent text-white/90 hover:bg-white/18'
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" className="h-8 rounded-[8px] border-blue-300/80 bg-blue-400/65 px-3 text-xs font-medium text-white shadow-sm hover:bg-blue-400/80" onClick={onLogout}>
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
                    'shrink-0 rounded-[6px] px-2 py-1 text-[13px] font-medium transition-colors duration-200',
                    isActive
                      ? 'border border-white/80 bg-white text-slate-900'
                      : 'border border-transparent text-white/90 hover:bg-white/18'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </header>

        <main className="px-5 py-6 sm:px-6 lg:px-7 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
