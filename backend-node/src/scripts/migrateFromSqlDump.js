import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { connectDB } from '../config/db.js'
import { Counter } from '../models/Counter.js'
import { Admin } from '../models/Admin.js'
import { Department } from '../models/Department.js'
import { AcademicSession } from '../models/AcademicSession.js'
import { Faculty } from '../models/Faculty.js'
import { Student } from '../models/Student.js'
import { Course } from '../models/Course.js'
import { Room } from '../models/Room.js'
import { TimeSlot } from '../models/TimeSlot.js'
import { CourseFaculty } from '../models/CourseFaculty.js'
import { Schedule } from '../models/Schedule.js'
import { Enrollment } from '../models/Enrollment.js'
import { SubstitutionRequest } from '../models/SubstitutionRequest.js'

dotenv.config()

const legacyPath = process.env.LEGACY_SQL_DUMP

const splitRows = (valuesText) => {
  const rows = []
  let current = ''
  let depth = 0
  let inQuote = false

  for (let i = 0; i < valuesText.length; i += 1) {
    const ch = valuesText[i]
    const prev = i > 0 ? valuesText[i - 1] : ''

    if (ch === "'" && prev !== '\\') inQuote = !inQuote
    if (!inQuote && ch === '(') depth += 1
    if (!inQuote && ch === ')') depth -= 1

    current += ch

    if (!inQuote && depth === 0 && ch === ')') {
      rows.push(current.trim())
      current = ''
      if (valuesText[i + 1] === ',') i += 1
    }
  }

  return rows
}

const parseValue = (token) => {
  const trimmed = token.trim()
  if (/^null$/i.test(trimmed)) return null
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, '\\')
  }
  const asNumber = Number(trimmed)
  return Number.isFinite(asNumber) ? asNumber : trimmed
}

const splitColumns = (rowText) => {
  const inner = rowText.replace(/^\(/, '').replace(/\)$/, '')
  const values = []
  let current = ''
  let inQuote = false

  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i]
    const prev = i > 0 ? inner[i - 1] : ''

    if (ch === "'" && prev !== '\\') inQuote = !inQuote

    if (!inQuote && ch === ',') {
      values.push(parseValue(current))
      current = ''
    } else {
      current += ch
    }
  }

  if (current.length) values.push(parseValue(current))
  return values
}

const parseInsertStatements = (sqlText, tableName) => {
  const pattern = new RegExp(`INSERT\\s+INTO\\s+${tableName}\\s*\\(([^)]+)\\)\\s*VALUES\\s*([\\s\\S]*?);`, 'gi')

  const rows = []
  let match = pattern.exec(sqlText)
  while (match) {
    const columns = match[1]
      .split(',')
      .map((c) => c.replace(/[`\"\s]/g, '').trim())
      .filter(Boolean)

    const rowTexts = splitRows(match[2].trim())
    rowTexts.forEach((rowText) => {
      const values = splitColumns(rowText)
      const item = {}
      columns.forEach((col, index) => {
        item[col] = values[index] ?? null
      })
      rows.push(item)
    })

    match = pattern.exec(sqlText)
  }

  return rows
}

const upsertMany = async (Model, rows, keyFields) => {
  if (!rows.length) return
  await Promise.all(
    rows.map((row) => {
      const filter = keyFields.reduce((acc, key) => ({ ...acc, [key]: row[key] }), {})
      return Model.updateOne(filter, { $set: row }, { upsert: true })
    })
  )
}

const syncCounter = async (key, Model) => {
  const maxRow = await Model.findOne({}).sort({ id: -1 }).lean()
  const seq = Number(maxRow?.id || 0)
  await Counter.updateOne({ key }, { $set: { seq } }, { upsert: true })
}

const run = async () => {
  if (!legacyPath) throw new Error('Set LEGACY_SQL_DUMP to a SQL file path before running this script.')

  const fullPath = path.resolve(legacyPath)
  if (!fs.existsSync(fullPath)) throw new Error(`SQL dump file not found: ${fullPath}`)

  const sqlText = fs.readFileSync(fullPath, 'utf8')
  await connectDB()

  const departments = parseInsertStatements(sqlText, 'department').map((x) => ({ id: Number(x.id), name: String(x.name || ''), code: String(x.code || '') }))
  const sessions = parseInsertStatements(sqlText, 'academic_session').map((x) => ({ id: Number(x.id), name: String(x.name || ''), start_date: String(x.start_date || ''), end_date: String(x.end_date || ''), is_active: Number(x.is_active || 1) }))
  const admins = parseInsertStatements(sqlText, 'admin').map((x) => ({ id: Number(x.id), email: String(x.email || '').toLowerCase(), password_hash: String(x.password_hash || ''), full_name: String(x.full_name || '') }))
  const faculty = parseInsertStatements(sqlText, 'faculty').map((x) => ({ id: Number(x.id), email: String(x.email || '').toLowerCase(), password_hash: String(x.password_hash || ''), full_name: String(x.full_name || ''), department_id: x.department_id == null ? null : Number(x.department_id), availability_notes: x.availability_notes == null ? '' : String(x.availability_notes), is_active: Number(x.is_active || 1) }))
  const students = parseInsertStatements(sqlText, 'student').map((x) => ({ id: Number(x.id), email: String(x.email || '').toLowerCase(), password_hash: String(x.password_hash || ''), full_name: String(x.full_name || ''), department_id: x.department_id == null ? null : Number(x.department_id), semester: Number(x.semester || 1), section: String(x.section || 'A'), is_active: Number(x.is_active || 1) }))
  const courses = parseInsertStatements(sqlText, 'course').map((x) => ({ id: Number(x.id), code: String(x.code || ''), name: String(x.name || ''), credit_hours: Number(x.credit_hours || 3), semester: Number(x.semester || 1), department_id: x.department_id == null ? null : Number(x.department_id), sessions_per_week: Number(x.sessions_per_week || 3), is_active: Number(x.is_active || 1), prerequisite_course_id: x.prerequisite_course_id == null ? null : Number(x.prerequisite_course_id) }))
  const rooms = parseInsertStatements(sqlText, 'room').map((x) => ({ id: Number(x.id), room_number: String(x.room_number || ''), capacity: Number(x.capacity || 30), room_type: String(x.room_type || 'classroom'), is_active: Number(x.is_active || 1) }))
  const timeSlots = parseInsertStatements(sqlText, 'time_slot').map((x) => ({ id: Number(x.id), day_of_week: Number(x.day_of_week || 1), start_time: String(x.start_time || ''), end_time: String(x.end_time || ''), slot_label: String(x.slot_label || '') }))
  const courseFaculty = parseInsertStatements(sqlText, 'course_faculty').map((x) => ({ course_id: Number(x.course_id), faculty_id: Number(x.faculty_id) }))
  const schedules = parseInsertStatements(sqlText, 'schedule').map((x) => ({ id: Number(x.id), academic_session_id: Number(x.academic_session_id), course_id: Number(x.course_id), faculty_id: Number(x.faculty_id), room_id: Number(x.room_id), time_slot_id: Number(x.time_slot_id), semester: Number(x.semester || 1), section: String(x.section || 'A') }))
  const enrollments = parseInsertStatements(sqlText, 'enrollment').map((x) => ({ student_id: Number(x.student_id), course_id: Number(x.course_id), academic_session_id: Number(x.academic_session_id), status: String(x.status || 'enrolled') }))
  const substitutions = parseInsertStatements(sqlText, 'substitution_request').map((x) => ({ id: Number(x.id), faculty_id: Number(x.faculty_id), schedule_id: Number(x.schedule_id), requested_date: String(x.requested_date || ''), reason: x.reason == null ? null : String(x.reason), status: String(x.status || 'pending'), admin_notes: x.admin_notes == null ? null : String(x.admin_notes), created_at: x.created_at ? new Date(String(x.created_at)) : new Date() }))

  await upsertMany(Department, departments, ['id'])
  await upsertMany(AcademicSession, sessions, ['id'])
  await upsertMany(Admin, admins, ['id'])
  await upsertMany(Faculty, faculty, ['id'])
  await upsertMany(Student, students, ['id'])
  await upsertMany(Course, courses, ['id'])
  await upsertMany(Room, rooms, ['id'])
  await upsertMany(TimeSlot, timeSlots, ['id'])
  await upsertMany(CourseFaculty, courseFaculty, ['course_id', 'faculty_id'])
  await upsertMany(Schedule, schedules, ['id'])
  await upsertMany(Enrollment, enrollments, ['student_id', 'course_id', 'academic_session_id'])
  await upsertMany(SubstitutionRequest, substitutions, ['id'])

  await syncCounter('admin', Admin)
  await syncCounter('department', Department)
  await syncCounter('academic_session', AcademicSession)
  await syncCounter('faculty', Faculty)
  await syncCounter('student', Student)
  await syncCounter('course', Course)
  await syncCounter('room', Room)
  await syncCounter('time_slot', TimeSlot)
  await syncCounter('schedule', Schedule)
  await syncCounter('substitution_request', SubstitutionRequest)

  console.log('Legacy SQL dump migration complete.')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
