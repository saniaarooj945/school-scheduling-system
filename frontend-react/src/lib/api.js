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
  return `/api/actions/export?format=${encodeURIComponent(format)}&academic_session_id=${encodeURIComponent(sessionId)}`
}

export async function downloadTimetableExport(format, sessionId) {
  const response = await api.request({
    method: 'GET',
    url: '/actions/export',
    params: { format, academic_session_id: sessionId },
    responseType: 'blob',
  })

  const blob = response.data
  const contentDisposition = response.headers?.['content-disposition'] || ''
  const fileNameMatch = /filename="?([^"]+)"?/i.exec(contentDisposition)
  const extensionByFormat = { csv: 'csv', pdf: 'pdf', ics: 'ics' }
  const fallbackName = `timetable_${sessionId}.${extensionByFormat[format] || 'txt'}`
  const fileName = fileNameMatch?.[1] || fallbackName

  const objectUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(objectUrl)
}
