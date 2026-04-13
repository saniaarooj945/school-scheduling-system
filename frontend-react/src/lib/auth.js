import axios from 'axios'

const TOKEN_KEY = 'auth_token'

const authApi = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_BASE_URL || '/api',
})

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

function setStoredToken(token) {
  if (!token) return
  localStorage.setItem(TOKEN_KEY, token)
}

function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY)
}

function authHeader() {
  const token = getStoredToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function login(email, password) {
  const response = await authApi.post('/auth/login', { email, password })
  const data = response.data
  if (data?.success && data?.token) {
    setStoredToken(data.token)
  }
  return data
}

export async function logout() {
  try {
    await authApi.post('/auth/logout', null, {
      headers: authHeader(),
    })
  } catch {
    // Ignore logout network errors and clear local token regardless.
  }
  clearStoredToken()
}

export async function detectRole() {
  try {
    const response = await authApi.get('/auth/me', {
      headers: authHeader(),
    })
    return response.data?.user?.role || null
  } catch {
    clearStoredToken()
    return null
  }
}
