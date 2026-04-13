import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppShell } from '@/components/app-shell'
import { ProtectedRoute } from '@/components/protected-route'
import { useAuth } from '@/context/auth-context'
import { LoginPage } from '@/pages/login'
import { AdminDashboardPage } from '@/pages/admin/dashboard'
import { AdminDepartmentsPage } from '@/pages/admin/departments'
import { AdminCoursesPage } from '@/pages/admin/courses'
import { AdminFacultyPage } from '@/pages/admin/faculty'
import { AdminStudentsPage } from '@/pages/admin/students'
import { AdminRoomsPage } from '@/pages/admin/rooms'
import { AdminSessionsPage } from '@/pages/admin/sessions'
import { AdminGeneratePage } from '@/pages/admin/generate'
import { AdminSubstitutionsPage } from '@/pages/admin/substitutions'
import { FacultyTimetablePage } from '@/pages/faculty/index'
import { FacultyAvailabilityPage } from '@/pages/faculty/availability'
import { FacultySubstitutionPage } from '@/pages/faculty/substitution'
import { StudentTimetablePage } from '@/pages/student/index'
import { StudentEnrollmentPage } from '@/pages/student/enrollment'

function RoleLayout({ role }) {
  const auth = useAuth()
  const navigate = useNavigate()

  return (
    <AppShell
      role={role}
      name={auth.name}
      onLogout={async () => {
        await auth.logout()
        navigate('/login')
      }}
    >
      <Outlet />
    </AppShell>
  )
}

function HomeRedirect() {
  const auth = useAuth()
  if (auth.loading) return <div className="p-8 text-center">Loading...</div>
  return <Navigate to={auth.role ? `/${auth.role}` : '/login'} replace />
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <RoleLayout role="admin" />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="departments" element={<AdminDepartmentsPage />} />
          <Route path="courses" element={<AdminCoursesPage />} />
          <Route path="faculty" element={<AdminFacultyPage />} />
          <Route path="students" element={<AdminStudentsPage />} />
          <Route path="rooms" element={<AdminRoomsPage />} />
          <Route path="sessions" element={<AdminSessionsPage />} />
          <Route path="generate" element={<AdminGeneratePage />} />
          <Route path="substitutions" element={<AdminSubstitutionsPage />} />
        </Route>

        <Route
          path="/faculty"
          element={
            <ProtectedRoute role="faculty">
              <RoleLayout role="faculty" />
            </ProtectedRoute>
          }
        >
          <Route index element={<FacultyTimetablePage />} />
          <Route path="availability" element={<FacultyAvailabilityPage />} />
          <Route path="substitution" element={<FacultySubstitutionPage />} />
        </Route>

        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <RoleLayout role="student" />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentTimetablePage />} />
          <Route path="enrollment" element={<StudentEnrollmentPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </>
  )
}
