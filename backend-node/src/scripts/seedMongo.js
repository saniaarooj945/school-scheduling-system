import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { connectDB } from '../config/db.js'
import { Admin } from '../models/Admin.js'
import { Department } from '../models/Department.js'
import { AcademicSession } from '../models/AcademicSession.js'
import { Faculty } from '../models/Faculty.js'
import { Student } from '../models/Student.js'
import { Course } from '../models/Course.js'
import { CourseFaculty } from '../models/CourseFaculty.js'
import { Room } from '../models/Room.js'
import { TimeSlot } from '../models/TimeSlot.js'
import { Counter } from '../models/Counter.js'

dotenv.config()

const upsertCounter = async (key, value) => {
  await Counter.updateOne({ key }, { $set: { seq: value } }, { upsert: true })
}

const seedTimeSlots = async () => {
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  const starts = ['08:00:00', '09:00:00', '10:00:00', '11:00:00', '12:00:00']
  const slots = []
  let id = 1

  dayNames.forEach((day, di) => {
    starts.forEach((start, si) => {
      const hour = Number(start.slice(0, 2))
      const end = `${String(hour).padStart(2, '0')}:50:00`
      slots.push({
        id,
        day_of_week: di + 1,
        start_time: start,
        end_time: end,
        slot_label: `${day}-${si + 1}`,
      })
      id += 1
    })
  })

  await Promise.all(
    slots.map((slot) =>
      TimeSlot.updateOne({ id: slot.id }, { $set: slot }, { upsert: true })
    )
  )

  await upsertCounter('time_slot', slots.length)
}

const run = async () => {
  await connectDB()

  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10)
  await Admin.updateOne(
    { email: (process.env.ADMIN_EMAIL || 'admin@isp.edu.pk').toLowerCase() },
    {
      $set: {
        id: 1,
        email: (process.env.ADMIN_EMAIL || 'admin@isp.edu.pk').toLowerCase(),
        password_hash: adminPassword,
        full_name: process.env.ADMIN_NAME || 'System Admin',
      },
    },
    { upsert: true }
  )

  const departments = [
    { id: 1, code: 'CS', name: 'Computer Science' },
    { id: 2, code: 'IT', name: 'Information Technology' },
    { id: 3, code: 'EE', name: 'Electrical Engineering' },
    { id: 4, code: 'BBA', name: 'Business Administration' },
  ]

  await Promise.all(
    departments.map((d) => Department.updateOne({ id: d.id }, { $set: d }, { upsert: true }))
  )

  const sessions = [
    { id: 1, name: 'Spring 2025', start_date: '2025-02-01', end_date: '2025-06-15', is_active: 0 },
    { id: 2, name: 'Fall 2025', start_date: '2025-09-01', end_date: '2026-01-31', is_active: 0 },
    { id: 3, name: 'Spring 2026', start_date: '2026-02-01', end_date: '2026-06-15', is_active: 1 },
  ]

  await Promise.all(
    sessions.map((s) => AcademicSession.updateOne({ id: s.id }, { $set: s }, { upsert: true }))
  )

  const facultyPassword = await bcrypt.hash('faculty123', 10)
  const facultyRows = [
    { id: 1, email: 'dr.ahmed@seed.edu', full_name: 'Dr. Ahmed Khan', department_id: 1 },
    { id: 2, email: 'prof.sara@seed.edu', full_name: 'Prof. Sara Ali', department_id: 2 },
    { id: 3, email: 'dr.raza@seed.edu', full_name: 'Dr. Raza Hassan', department_id: 3 },
    { id: 4, email: 'prof.bilquis@seed.edu', full_name: 'Prof. Bilquis Bano', department_id: 4 },
  ]

  await Promise.all(
    facultyRows.map((f) =>
      Faculty.updateOne(
        { id: f.id },
        {
          $set: {
            ...f,
            password_hash: facultyPassword,
            availability_notes: '',
            is_active: 1,
          },
        },
        { upsert: true }
      )
    )
  )

  const studentPassword = await bcrypt.hash('student123', 10)
  const students = [
    { id: 1, email: 'student1@seed.edu', full_name: 'Ali Ahmed', department_id: 1, semester: 2, section: 'A' },
    { id: 2, email: 'student2@seed.edu', full_name: 'Sara Khan', department_id: 1, semester: 1, section: 'A' },
    { id: 3, email: 'student3@seed.edu', full_name: 'Omar Hassan', department_id: 2, semester: 2, section: 'A' },
    { id: 4, email: 'student4@seed.edu', full_name: 'Fatima Ali', department_id: 3, semester: 2, section: 'A' },
    { id: 5, email: 'student5@seed.edu', full_name: 'Hassan Raza', department_id: 4, semester: 2, section: 'A' },
  ]

  await Promise.all(
    students.map((s) =>
      Student.updateOne(
        { id: s.id },
        {
          $set: {
            ...s,
            password_hash: studentPassword,
            is_active: 1,
          },
        },
        { upsert: true }
      )
    )
  )

  const courses = [
    { id: 1, code: 'CS101', name: 'Programming I', semester: 1, department_id: 1, prerequisite_course_id: null },
    { id: 2, code: 'CS201', name: 'Data Structures', semester: 2, department_id: 1, prerequisite_course_id: 1 },
    { id: 3, code: 'IT201', name: 'Database Systems', semester: 2, department_id: 2, prerequisite_course_id: null },
    { id: 4, code: 'EE101', name: 'Circuit Analysis', semester: 1, department_id: 3, prerequisite_course_id: null },
    { id: 5, code: 'BBA101', name: 'Principles of Management', semester: 1, department_id: 4, prerequisite_course_id: null },
  ]

  await Promise.all(
    courses.map((c) =>
      Course.updateOne(
        { id: c.id },
        {
          $set: {
            ...c,
            credit_hours: 3,
            sessions_per_week: 3,
            is_active: 1,
          },
        },
        { upsert: true }
      )
    )
  )

  const courseFaculty = [
    { course_id: 1, faculty_id: 1 },
    { course_id: 2, faculty_id: 1 },
    { course_id: 3, faculty_id: 2 },
    { course_id: 4, faculty_id: 3 },
    { course_id: 5, faculty_id: 4 },
  ]

  await Promise.all(
    courseFaculty.map((cf) =>
      CourseFaculty.updateOne({ course_id: cf.course_id, faculty_id: cf.faculty_id }, { $set: cf }, { upsert: true })
    )
  )

  const rooms = [
    { id: 1, room_number: 'R101', capacity: 40, room_type: 'classroom', is_active: 1 },
    { id: 2, room_number: 'R102', capacity: 35, room_type: 'classroom', is_active: 1 },
    { id: 3, room_number: 'LAB1', capacity: 25, room_type: 'lab', is_active: 1 },
    { id: 4, room_number: 'HALL-A', capacity: 80, room_type: 'hall', is_active: 1 },
  ]

  await Promise.all(rooms.map((r) => Room.updateOne({ id: r.id }, { $set: r }, { upsert: true })))

  await seedTimeSlots()

  await upsertCounter('admin', 1)
  await upsertCounter('department', departments.length)
  await upsertCounter('academic_session', sessions.length)
  await upsertCounter('faculty', facultyRows.length)
  await upsertCounter('student', students.length)
  await upsertCounter('course', courses.length)
  await upsertCounter('room', rooms.length)
  await upsertCounter('schedule', 0)
  await upsertCounter('substitution_request', 0)

  console.log('Mongo seed completed.')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
