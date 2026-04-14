import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/auth-context'
import { toast } from 'sonner'
import { Eye, EyeOff, Shield } from 'lucide-react'

const portalOptions = [
  {
    key: 'admin',
    title: 'Admin Portal',
    email: 'admin@isp.edu.pk',
    password: 'admin123',
  },
  {
    key: 'faculty',
    title: 'Faculty Portal',
    email: 'dr.ahmed@seed.edu',
    password: 'faculty123',
  },
  {
    key: 'student',
    title: 'Student Portal',
    email: 'student1@seed.edu',
    password: 'student123',
  },
]

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedPortal, setSelectedPortal] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const auth = useAuth()

  const activePortal = portalOptions.find((portal) => portal.key === selectedPortal)

  useEffect(() => {
    const role = searchParams.get('role')
    if (!role) return
    const matched = portalOptions.find((portal) => portal.key === role)
    if (matched) {
      setSelectedPortal(matched.key)
      setEmail(matched.email)
      setPassword(matched.password)
    }
  }, [searchParams])

  function applyPortal(portal) {
    setSelectedPortal(portal.key)
    setEmail(portal.email)
    setPassword(portal.password)
    setSearchParams({ role: portal.key })
  }

  function resetPortal() {
    setSelectedPortal(null)
    setEmail('')
    setPassword('')
    setShowPassword(false)
    setSearchParams({})
  }

  async function onSubmit(event) {
    event.preventDefault()
    try {
      setLoading(true)
      const normalizedEmail = email.trim().toLowerCase()
      const normalizedPassword = password.trim()
      const result = await auth.login(normalizedEmail, normalizedPassword)
      if (!result?.success) {
        toast.error(result?.message || 'Invalid credentials')
        return
      }
      const role = result.redirect?.includes('/admin/')
        ? 'admin'
        : result.redirect?.includes('/faculty/')
          ? 'faculty'
          : 'student'
      navigate(`/${role}`)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-200 px-4 py-12">
      <div className="w-full max-w-5xl">
        {!activePortal && (
          <>
            <h1 className="mb-10 text-center text-5xl font-extrabold tracking-tight text-slate-700">
              Automatic Timetable Management System
            </h1>
            <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-3">
              {portalOptions.map((portal) => {
                const palette =
                  portal.key === 'student'
                    ? 'from-emerald-500 to-green-500 shadow-emerald-500/25'
                    : portal.key === 'faculty'
                      ? 'from-amber-500 to-orange-500 shadow-orange-500/25'
                      : 'from-indigo-500 to-violet-500 shadow-violet-500/25'

                const subtitle =
                  portal.key === 'student'
                    ? 'View timetable & enroll in courses'
                    : portal.key === 'faculty'
                      ? 'View timetable & manage classes'
                      : 'Manage data & generate timetable'

                return (
                  <button
                    key={portal.key}
                    type="button"
                    onClick={() => applyPortal(portal)}
                    className={`rounded-2xl bg-gradient-to-r px-5 py-6 text-left text-white shadow-lg transition duration-150 hover:scale-[1.01] ${palette}`}
                  >
                    <p className="text-[30px] font-extrabold leading-none">{portal.key === 'student' ? 'STUDENT DASHBOARD' : portal.key === 'faculty' ? 'FACULTY DASHBOARD' : 'ADMIN DASHBOARD'}</p>
                    <p className="mt-3 text-base text-white/90">{subtitle}</p>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {activePortal && (
          <Card className="mx-auto w-full max-w-md overflow-hidden border-slate-300 bg-white/95 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-violet-500 py-9 text-white">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-700/40">
                <Shield size={24} />
              </div>
              <CardTitle className="text-center text-4xl font-semibold text-white">{activePortal.title}</CardTitle>
              <CardDescription className="text-center text-base text-indigo-100">
                {activePortal.key === 'admin'
                  ? 'Secure access for system administrators'
                  : activePortal.key === 'faculty'
                    ? 'Secure access for faculty members'
                    : 'Secure access for students'}
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-slate-100 px-7 py-8">
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <Label className="font-medium text-slate-600">Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-2 h-12 rounded-full border-0 bg-slate-200/90 px-4 shadow-inner"
                  />
                </div>
                <div>
                  <Label className="font-medium text-slate-600">Password</Label>
                  <div className="relative mt-2">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 rounded-full border-0 bg-slate-200/90 px-4 pr-12 shadow-inner"
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="h-12 w-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-lg text-white hover:from-blue-700 hover:to-indigo-700" disabled={loading}>
                  {loading ? 'Signing in...' : 'Login to Dashboard'}
                </Button>
                <Button type="button" variant="outline" className="h-12 w-full rounded-full border-slate-300 bg-transparent text-lg hover:bg-slate-200" onClick={resetPortal}>
                  Go back
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
