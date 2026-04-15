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
  const portalTheme =
    activePortal?.key === 'student'
      ? {
          header: 'from-emerald-500 to-green-500',
          icon: 'bg-emerald-700/35',
          description: 'text-emerald-100',
        }
      : activePortal?.key === 'faculty'
        ? {
            header: 'from-amber-500 to-orange-500',
            icon: 'bg-amber-700/30',
            description: 'text-amber-100',
          }
        : {
            header: 'from-indigo-500 to-violet-500',
            icon: 'bg-indigo-700/35',
            description: 'text-indigo-100',
          }

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
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#f8fbff_0%,#e9eef5_42%,#e3e9f1_100%)] px-4 py-10">
      <div className="w-full max-w-[1080px]">
        {!activePortal && (
          <>
            <h1 className="mb-8 text-center text-[46px] font-extrabold leading-tight tracking-[-0.03em] text-slate-700 whitespace-nowrap">
              Automatic Timetable Management System
            </h1>
            <div className="mx-auto grid max-w-[960px] gap-4 md:grid-cols-3">
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
                    className={`rounded-[18px] bg-gradient-to-r px-5 py-5 text-left text-white shadow-[0_12px_28px_rgba(37,99,235,0.18)] transition duration-150 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(37,99,235,0.22)] ${palette}`}
                  >
                    <p className="text-[16px] font-black leading-none tracking-[-0.02em] text-white">
                      {portal.key === 'student' ? 'STUDENT DASHBOARD' : portal.key === 'faculty' ? 'FACULTY DASHBOARD' : 'ADMIN DASHBOARD'}
                    </p>
                    <p className="mt-2 text-[14px] text-white/90">{subtitle}</p>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {activePortal && (
          <div>
            <h1 className="mb-4 text-center text-[46px] font-extrabold leading-tight tracking-[-0.03em] text-slate-700 whitespace-nowrap">
              Automatic Timetable Management System
            </h1>
            <Card className="mx-auto mt-10 w-full max-w-[360px] overflow-hidden border-slate-200/70 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
              <CardHeader className={`bg-gradient-to-r py-8 text-white ${portalTheme.header}`}>
                <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full ${portalTheme.icon}`}>
                  <Shield size={16} />
                </div>
                <CardTitle className="text-center text-[21px] font-semibold text-white">{activePortal.title}</CardTitle>
                <CardDescription className={`text-center text-[12px] ${portalTheme.description}`}>
                  {activePortal.key === 'admin'
                    ? 'Secure access for system administrators'
                    : activePortal.key === 'faculty'
                      ? 'Access for teaching faculty'
                      : 'Secure access for students'}
                </CardDescription>
              </CardHeader>
              <CardContent className="bg-white px-6 py-7">
                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <Label className="text-[13px] font-medium text-slate-600">Email</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="mt-2 h-11 rounded-[12px] border-slate-200/70 bg-slate-50 px-4 shadow-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-[13px] font-medium text-slate-600">Password</Label>
                    <div className="relative mt-2">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 rounded-[12px] border-slate-200/70 bg-slate-50 px-4 pr-12 shadow-sm"
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
                  <Button type="submit" className="h-11 w-full rounded-[12px] bg-gradient-to-r from-blue-600 to-indigo-600 text-[15px] text-white hover:from-blue-700 hover:to-indigo-700" disabled={loading}>
                    {loading ? 'Signing in...' : 'Login to Dashboard'}
                  </Button>
                  <Button type="button" variant="outline" className="h-10 w-full rounded-[12px] border-slate-200 bg-white text-[15px] hover:bg-slate-50" onClick={resetPortal}>
                    Go back
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
