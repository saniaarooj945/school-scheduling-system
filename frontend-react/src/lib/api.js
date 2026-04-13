import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: false,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export async function requestJson({ method = 'GET', url, params, data, headers }) {
  const response = await api.request({ method, url, params, data, headers })
  return response.data
}

export async function fetchList(url, params) {
  return requestJson({ method: 'GET', url, params })
}

export function exportUrl(format, sessionId) {
  return `/api/actions/export.php?format=${encodeURIComponent(format)}&academic_session_id=${encodeURIComponent(sessionId)}`
}
