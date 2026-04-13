import { useEffect, useState } from 'react'
import { requestJson } from '@/lib/api'
import { TimetableView } from '@/components/shared/timetable-view'

export function StudentTimetablePage() {
  const [sessions, setSessions] = useState([])
  const [sessionId, setSessionId] = useState('')
  const [rows, setRows] = useState([])

  useEffect(() => {
    requestJson({ method: 'GET', url: '/actions/sessions.php' }).then((data) => {
      setSessions(data || [])
      if (data?.[0]?.id) setSessionId(String(data[0].id))
    })
  }, [])

  useEffect(() => {
    if (!sessionId) return
    requestJson({
      method: 'GET',
      url: '/actions/schedule.php',
      params: { academic_session_id: Number(sessionId) },
    }).then((data) => setRows(data.list || []))
  }, [sessionId])

  return (
    <TimetableView
      title="Student Timetable"
      sessions={sessions}
      selectedSession={sessionId}
      onSessionChange={setSessionId}
      rows={rows}
    />
  )
}
