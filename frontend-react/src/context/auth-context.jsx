import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { detectRole, login as doLogin, logout as doLogout } from '@/lib/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [role, setRole] = useState(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    detectRole()
      .then((detectedRole) => {
        if (!mounted) return
        setRole(detectedRole)
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  async function login(email, password) {
    const result = await doLogin(email, password)
    if (result?.success) {
      const detectedRole = result?.user?.role || (result.redirect?.includes('/admin/')
        ? 'admin'
        : result.redirect?.includes('/faculty/')
          ? 'faculty'
          : 'student')
      setRole(detectedRole)
      setName(result?.user?.name || email)
    }
    return result
  }

  async function logout() {
    try {
      await doLogout()
    } finally {
      setRole(null)
      setName('')
    }
  }

  const value = useMemo(
    () => ({ role, loading, name, setName, login, logout }),
    [role, loading, name]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
