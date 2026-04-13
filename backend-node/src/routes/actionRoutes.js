import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { nextId } from '../utils/id.js'
import { Department } from '../models/Department.js'
import { AcademicSession } from '../models/AcademicSession.js'
import { Course } from '../models/Course.js'
import { Faculty } from '../models/Faculty.js'
import { Student } from '../models/Student.js'
import { Room } from '../models/Room.js'
import { TimeSlot } from '../models/TimeSlot.js'
import { CourseFaculty } from '../models/CourseFaculty.js'
import { Schedule } from '../models/Schedule.js'
import { Enrollment } from '../models/Enrollment.js'
import { SubstitutionRequest } from '../models/SubstitutionRequest.js'

const router = Router()

const parseId = (v) => {
  const n = Number(v)
  return Number.isInteger(n) && n > 0 ? n : 0
}

const asTrimmed = (v) => (v == null ? '' : String(v).trim())

const pickPageSize = (value) => {
  const allowed = [25, 50, 75, 100]
  const pageSize = Number(value || 25)
  return allowed.includes(pageSize) ? pageSize : 25
}

const to12h = (timeText) => {
  if (!timeText) return ''
  const [hRaw = '0', mRaw = '00'] = String(timeText).split(':')
  const hour24 = Number(hRaw)
  if (!Number.isFinite(hour24)) return String(timeText)
  const ampm = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return `${hour12}:${mRaw} ${ampm}`
}

const apiError = (res, message, status = 400) => res.status(status).json({ success: false, message })

const parseBody = (req) => (req.body && typeof req.body === 'object' ? req.body : {})

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const pagedResult = (items, page, pageSize, total) => ({
  success: true,
  items,
  total,
  page,
  page_size: pageSize,
})

const withDepartmentName = async (rows) => {
  const deptIds = [...new Set(rows.map((x) => Number(x.department_id)).filter((x) => x > 0))]
  if (!deptIds.length) return rows
  const departments = await Department.find({ id: { $in: deptIds } }).lean()
  const map = new Map(departments.map((d) => [Number(d.id), d.name]))
  return rows.map((row) => ({ ...row, department_name: map.get(Number(row.department_id)) || null }))
}

router.use(requireAuth)

router.get('/departments.php', requireRole('admin'), async (req, res, next) => {
  try {
    const id = parseId(req.query.id)
    if (id) {
      const row = await Department.findOne({ id }).lean()
      return res.json(row || { success: false })
    }

    const paged = req.query.paged === '1'
    if (paged) {
      const page = Math.max(1, Number(req.query.page || 1))
      const pageSize = pickPageSize(req.query.page_size)
      const q = asTrimmed(req.query.q)
      const filter = q
        ? {
            $or: [
              { name: { $regex: escapeRegex(q), $options: 'i' } },
              { code: { $regex: escapeRegex(q), $options: 'i' } },
            ],
          }
        : {}
      const total = await Department.countDocuments(filter)
      const items = await Department.find(filter)
        .sort({ name: 1, id: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean()
      return res.json(pagedResult(items, page, pageSize, total))
    }

    const rows = await Department.find({}).sort({ name: 1 }).lean()
    return res.json(rows)
  } catch (e) {
    return next(e)
  }
})

router.post('/departments.php', requireRole('admin'), async (req, res, next) => {
  try {
    const body = parseBody(req)
    const name = asTrimmed(body.name)
    const code = asTrimmed(body.code)
    if (!name || !code) return apiError(res, 'Please enter department name and code.')

    const dup = await Department.findOne({
      $or: [{ name: new RegExp(`^${escapeRegex(name)}$`, 'i') }, { code }],
    }).lean()
    if (dup) return apiError(res, 'Department name or code already exists.')

    const id = await nextId('department')
    await Department.create({ id, name, code })
    return res.json({ success: true, id, message: 'Department created.' })
  } catch (e) {
    return next(e)
  }
})

router.put('/departments.php', requireRole('admin'), async (req, res, next) => {
  try {
    const body = parseBody(req)
    const id = parseId(body.id)
    const name = asTrimmed(body.name)
    const code = asTrimmed(body.code)
    if (!id) return apiError(res, 'Invalid department.')
    if (!name || !code) return apiError(res, 'Please enter department name and code.')

    const dup = await Department.findOne({
      id: { $ne: id },
      $or: [{ name: new RegExp(`^${escapeRegex(name)}$`, 'i') }, { code }],
    }).lean()
    if (dup) return apiError(res, 'Department name or code already exists.')

    await Department.updateOne({ id }, { $set: { name, code } })
    return res.json({ success: true, message: 'Department updated.' })
  } catch (e) {
    return next(e)
  }
})

router.delete('/departments.php', requireRole('admin'), async (req, res, next) => {
  try {
    const body = parseBody(req)
    const id = parseId(body.id || req.query.id)
    if (!id) return apiError(res, 'Invalid department.')
    await Department.deleteOne({ id })
    return res.json({ success: true, message: 'Department deleted.' })
  } catch {
    return apiError(res, 'Could not delete department. It may be in use.')
  }
})

router.get('/sessions.php', async (req, res, next) => {
  try {
    const id = parseId(req.query.id)
    if (id) {
      const row = await AcademicSession.findOne({ id }).lean()
      return res.json(row || { success: false })
    }

    const paged = req.query.paged === '1'
    if (paged && req.user.role === 'admin') {
      const page = Math.max(1, Number(req.query.page || 1))
      const pageSize = pickPageSize(req.query.page_size)
      const q = asTrimmed(req.query.q)
      const filter = q ? { name: { $regex: escapeRegex(q), $options: 'i' } } : {}
      const total = await AcademicSession.countDocuments(filter)
      const items = await AcademicSession.find(filter)
        .sort({ start_date: -1, id: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean()
      return res.json(pagedResult(items, page, pageSize, total))
    }

    const rows = await AcademicSession.find({}).sort({ start_date: -1, id: -1 }).lean()
    return res.json(rows)
  } catch (e) {
    return next(e)
  }
})

router.post('/sessions.php', requireRole('admin'), async (req, res, next) => {
  try {
    const body = parseBody(req)
    const name = asTrimmed(body.name)
    const startDate = asTrimmed(body.start_date)
    const endDate = asTrimmed(body.end_date)
    if (!name || !startDate || !endDate) return apiError(res, 'Please enter session name, start date and end date.')

    const id = await nextId('academic_session')
    await AcademicSession.create({ id, name, start_date: startDate, end_date: endDate, is_active: 1 })
    return res.json({ success: true, id, message: 'Session created.' })
  } catch {
    return apiError(res, 'Could not create session. Check dates are valid.')
  }
})

router.put('/sessions.php', requireRole('admin'), async (req, res) => {
  const body = parseBody(req)
  const id = parseId(body.id)
  if (!id) return apiError(res, 'Invalid session.')
  await AcademicSession.updateOne(
    { id },
    {
      $set: {
        name: asTrimmed(body.name),
        start_date: asTrimmed(body.start_date),
        end_date: asTrimmed(body.end_date),
      },
    }
  )
  return res.json({ success: true, message: 'Session updated.' })
})

router.delete('/sessions.php', requireRole('admin'), async (req, res) => {
  const body = parseBody(req)
  const id = parseId(body.id || req.query.id)
  if (!id) return apiError(res, 'Invalid session.')
  try {
    await AcademicSession.deleteOne({ id })
    return res.json({ success: true, message: 'Session deleted.' })
  } catch {
    return apiError(res, 'Could not delete session. It may have schedules.')
  }
})

router.get('/courses.php', requireRole('admin'), async (req, res, next) => {
  try {
    const id = parseId(req.query.id)
    if (id) {
      const row = await Course.findOne({ id, is_active: 1 }).lean()
      if (!row) return res.json({ success: false })
      const withDept = await withDepartmentName([row])
      return res.json(withDept[0])
    }

    const paged = req.query.paged === '1'
    if (paged) {
      const page = Math.max(1, Number(req.query.page || 1))
      const pageSize = pickPageSize(req.query.page_size)
      const q = asTrimmed(req.query.q)
      const filter = {
        is_active: 1,
        ...(q
          ? {
              $or: [
                { name: { $regex: escapeRegex(q), $options: 'i' } },
                { code: { $regex: escapeRegex(q), $options: 'i' } },
              ],
            }
          : {}),
      }

      const total = await Course.countDocuments(filter)
      const items = await Course.find(filter)
        .sort({ semester: 1, code: 1, id: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean()

      const merged = await withDepartmentName(items)
      return res.json(pagedResult(merged, page, pageSize, total))
    }

    const rows = await Course.find({ is_active: 1 }).sort({ semester: 1, code: 1 }).lean()
    const merged = await withDepartmentName(rows)
    return res.json(merged)
  } catch (e) {
    return next(e)
  }
})

router.post('/courses.php', requireRole('admin'), async (req, res) => {
  const body = parseBody(req)
  const code = asTrimmed(body.code)
  const name = asTrimmed(body.name)
  if (!code || !name) return apiError(res, 'Please enter course code and course name.')
  try {
    const dup = await Course.findOne({ code }).lean()
    if (dup) return apiError(res, 'Course code already exists.')

    const id = await nextId('course')
    await Course.create({
      id,
      code,
      name,
      credit_hours: Number(body.credit_hours || 3),
      semester: Number(body.semester || 1),
      department_id: parseId(body.department_id) || null,
      sessions_per_week: Number(body.sessions_per_week || 3),
      prerequisite_course_id: parseId(body.prerequisite_course_id) || null,
      is_active: 1,
    })

    return res.json({ success: true, id, message: 'Course created.' })
  } catch {
    return apiError(res, 'Course code already exists.')
  }
})

router.put('/courses.php', requireRole('admin'), async (req, res) => {
  const body = parseBody(req)
  const id = parseId(body.id)
  if (!id) return apiError(res, 'Invalid course.')

  await Course.updateOne(
    { id },
    {
      $set: {
        code: asTrimmed(body.code),
        name: asTrimmed(body.name),
        credit_hours: Number(body.credit_hours || 3),
        semester: Number(body.semester || 1),
        department_id: parseId(body.department_id) || null,
        sessions_per_week: Number(body.sessions_per_week || 3),
        prerequisite_course_id: parseId(body.prerequisite_course_id) || null,
      },
    }
  )

  return res.json({ success: true, message: 'Course updated.' })
})

router.delete('/courses.php', requireRole('admin'), async (req, res) => {
  const body = parseBody(req)
  const id = parseId(body.id || req.query.id)
  if (!id) return apiError(res, 'Invalid course.')
  await Course.updateOne({ id }, { $set: { is_active: 0 } })
  return res.json({ success: true, message: 'Course removed.' })
})

const peopleCrud = (entity, Model) => {
  router.get(`/${entity}.php`, requireRole('admin'), async (req, res, next) => {
    try {
      const id = parseId(req.query.id)
      if (id) {
        const row = await Model.findOne({ id, is_active: 1 }).lean()
        if (!row) return res.json({ success: false })
        const withDept = await withDepartmentName([row])
        return res.json(withDept[0])
      }

      const paged = req.query.paged === '1'
      if (paged) {
        const page = Math.max(1, Number(req.query.page || 1))
        const pageSize = pickPageSize(req.query.page_size)
        const q = asTrimmed(req.query.q)
        const filter = {
          is_active: 1,
          ...(q
            ? {
                $or: [
                  { full_name: { $regex: escapeRegex(q), $options: 'i' } },
                  { email: { $regex: escapeRegex(q), $options: 'i' } },
                ],
              }
            : {}),
        }

        const total = await Model.countDocuments(filter)
        const items = await Model.find(filter)
          .sort({ full_name: 1, id: -1 })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .lean()

        const merged = await withDepartmentName(items)
        return res.json(pagedResult(merged, page, pageSize, total))
      }

      const rows = await Model.find({ is_active: 1 }).sort({ full_name: 1 }).lean()
      const merged = await withDepartmentName(rows)
      return res.json(merged)
    } catch (e) {
      return next(e)
    }
  })

  router.post(`/${entity}.php`, requireRole('admin'), async (req, res) => {
    const body = parseBody(req)
    const email = asTrimmed(body.email).toLowerCase()
    const fullName = asTrimmed(body.full_name)
    if (!email || !fullName) {
      return apiError(res, `Please enter ${entity === 'faculty' ? 'faculty' : 'students'} email and name.`)
    }

    const password = asTrimmed(body.password || (entity === 'students' ? 'student123' : ''))
    if (entity === 'faculty' && !password) return apiError(res, 'Please enter password.')

    const exists = await Model.findOne({ email }).lean()
    if (exists) return apiError(res, 'Email already exists.')

    const passwordHash = await bcrypt.hash(password, 10)
    const id = await nextId(entity === 'faculty' ? 'faculty' : 'student')

    if (entity === 'faculty') {
      await Faculty.create({
        id,
        email,
        password_hash: passwordHash,
        full_name: fullName,
        department_id: parseId(body.department_id) || null,
        availability_notes: asTrimmed(body.availability_notes),
        is_active: 1,
      })
      return res.json({ success: true, id, message: 'Faculty added.' })
    }

    await Student.create({
      id,
      email,
      password_hash: passwordHash,
      full_name: fullName,
      department_id: parseId(body.department_id) || null,
      semester: Number(body.semester || 1),
      section: asTrimmed(body.section || 'A'),
      is_active: 1,
    })
    return res.json({ success: true, id, message: 'Student added.' })
  })

  router.put(`/${entity}.php`, requireRole('admin'), async (req, res) => {
    const body = parseBody(req)
    const id = parseId(body.id)
    if (!id) return apiError(res, `Invalid ${entity === 'faculty' ? 'faculty' : 'students'}.`)

    const email = asTrimmed(body.email).toLowerCase()
    const fullName = asTrimmed(body.full_name)
    if (!email || !fullName) {
      return apiError(res, `Please enter ${entity === 'faculty' ? 'faculty' : 'students'} email and name.`)
    }

    const updates = {
      email,
      full_name: fullName,
      department_id: parseId(body.department_id) || null,
    }

    if (entity === 'faculty') {
      updates.availability_notes = asTrimmed(body.availability_notes)
    } else {
      updates.semester = Number(body.semester || 1)
      updates.section = asTrimmed(body.section || 'A')
    }

    const nextPassword = asTrimmed(body.password)
    if (nextPassword) {
      updates.password_hash = await bcrypt.hash(nextPassword, 10)
    }

    await Model.updateOne({ id }, { $set: updates })
    return res.json({ success: true, message: `${entity === 'faculty' ? 'Faculty' : 'Students'} updated.` })
  })

  router.delete(`/${entity}.php`, requireRole('admin'), async (req, res) => {
    const body = parseBody(req)
    const id = parseId(body.id || req.query.id)
    if (!id) return apiError(res, `Invalid ${entity === 'faculty' ? 'faculty' : 'students'}.`)
    await Model.updateOne({ id }, { $set: { is_active: 0 } })
    return res.json({ success: true, message: `${entity === 'faculty' ? 'Faculty' : 'Students'} removed.` })
  })
}

peopleCrud('faculty', Faculty)
peopleCrud('students', Student)

router.get('/rooms.php', requireRole('admin'), async (req, res, next) => {
  try {
    const id = parseId(req.query.id)
    if (id) {
      const row = await Room.findOne({ id, is_active: 1 }).lean()
      return res.json(row || { success: false })
    }

    const paged = req.query.paged === '1'
    if (paged) {
      const page = Math.max(1, Number(req.query.page || 1))
      const pageSize = pickPageSize(req.query.page_size)
      const q = asTrimmed(req.query.q)
      const filter = {
        is_active: 1,
        ...(q ? { room_number: { $regex: escapeRegex(q), $options: 'i' } } : {}),
      }
      const total = await Room.countDocuments(filter)
      const items = await Room.find(filter)
        .sort({ room_number: 1, id: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean()
      return res.json(pagedResult(items, page, pageSize, total))
    }

    const rows = await Room.find({ is_active: 1 }).sort({ room_number: 1 }).lean()
    return res.json(rows)
  } catch (e) {
    return next(e)
  }
})

router.post('/rooms.php', requireRole('admin'), async (req, res) => {
  const body = parseBody(req)
  const roomNumber = asTrimmed(body.room_number)
  if (!roomNumber) return apiError(res, 'Please enter room number.')

  try {
    const exists = await Room.findOne({ room_number: roomNumber }).lean()
    if (exists) return apiError(res, 'Room number already exists.')

    const id = await nextId('room')
    await Room.create({
      id,
      room_number: roomNumber,
      capacity: Number(body.capacity || 30),
      room_type: asTrimmed(body.room_type || 'classroom'),
      is_active: 1,
    })

    return res.json({ success: true, id, message: 'Room added.' })
  } catch {
    return apiError(res, 'Room number already exists.')
  }
})

router.put('/rooms.php', requireRole('admin'), async (req, res) => {
  const body = parseBody(req)
  const id = parseId(body.id)
  if (!id) return apiError(res, 'Invalid room.')

  await Room.updateOne(
    { id },
    {
      $set: {
        room_number: asTrimmed(body.room_number),
        capacity: Number(body.capacity || 30),
        room_type: asTrimmed(body.room_type || 'classroom'),
      },
    }
  )

  return res.json({ success: true, message: 'Room updated.' })
})

router.delete('/rooms.php', requireRole('admin'), async (req, res) => {
  const body = parseBody(req)
  const id = parseId(body.id || req.query.id)
  if (!id) return apiError(res, 'Invalid room.')
  await Room.updateOne({ id }, { $set: { is_active: 0 } })
  return res.json({ success: true, message: 'Room removed.' })
})

router.get('/time_slots.php', async (req, res) => {
  const rows = await TimeSlot.find({}).sort({ day_of_week: 1, start_time: 1 }).lean()
  return res.json(rows)
})

router.get('/course_faculty.php', requireRole('admin'), async (req, res) => {
  const courseId = parseId(req.query.course_id)
  if (!courseId) return apiError(res, 'Invalid course.')

  const rows = await CourseFaculty.find({ course_id: courseId }).lean()
  const ids = rows.map((x) => Number(x.faculty_id))
  const faculty = await Faculty.find({ id: { $in: ids }, is_active: 1 })
    .sort({ full_name: 1 })
    .lean()

  return res.json(faculty.map((f) => ({ id: f.id, full_name: f.full_name, email: f.email })))
})

router.post('/course_faculty.php', requireRole('admin'), async (req, res) => {
  const body = parseBody(req)
  const courseId = parseId(body.course_id)
  const facultyId = parseId(body.faculty_id)
  if (!courseId || !facultyId) return apiError(res, 'Course and faculty are required.')

  const exists = await CourseFaculty.findOne({ course_id: courseId, faculty_id: facultyId }).lean()
  if (exists) return apiError(res, 'This faculty is already assigned to this course.')

  await CourseFaculty.create({ course_id: courseId, faculty_id: facultyId })
  return res.json({ success: true, message: 'Faculty assigned.' })
})

router.delete('/course_faculty.php', requireRole('admin'), async (req, res) => {
  const body = parseBody(req)
  const courseId = parseId(body.course_id || req.query.course_id)
  const facultyId = parseId(body.faculty_id || req.query.faculty_id)
  if (!courseId || !facultyId) return apiError(res, 'Course and faculty are required.')

  await CourseFaculty.deleteOne({ course_id: courseId, faculty_id: facultyId })
  return res.json({ success: true, message: 'Faculty removed from course.' })
})

router.get('/faculty_availability.php', requireRole('faculty'), async (req, res) => {
  const row = await Faculty.findOne({ id: parseId(req.user.sub) }).lean()
  return res.json({ availability_notes: row?.availability_notes || '' })
})

router.post('/faculty_availability.php', requireRole('faculty'), async (req, res) => {
  const body = parseBody(req)
  const notes = asTrimmed(body.availability_notes)
  await Faculty.updateOne({ id: parseId(req.user.sub) }, { $set: { availability_notes: notes } })
  return res.json({ success: true, message: 'Preferences saved.' })
})

router.get('/schedule.php', async (req, res) => {
  const sessionId = parseId(req.query.academic_session_id)
  const facultyIdParam = parseId(req.query.faculty_id)
  if (!sessionId && !facultyIdParam) return apiError(res, 'academic_session_id or faculty_id required')

  const filter = {}
  if (sessionId) filter.academic_session_id = sessionId
  if (facultyIdParam) filter.faculty_id = facultyIdParam

  const semester = parseId(req.query.semester)
  const section = asTrimmed(req.query.section)
  if (semester) filter.semester = semester
  if (section) filter.section = section

  if (req.user.role === 'faculty') {
    filter.faculty_id = parseId(req.user.sub)
  }

  if (req.user.role === 'student') {
    const stu = await Student.findOne({ id: parseId(req.user.sub) }).lean()
    if (!stu) return res.json({ success: true, list: [] })
    filter.semester = Number(stu.semester)
    filter.section = asTrimmed(stu.section)
  }

  const paged = req.query.paged === '1'
  const page = Math.max(1, Number(req.query.page || 1))
  const pageSize = pickPageSize(req.query.page_size)

  const total = paged ? await Schedule.countDocuments(filter) : 0
  const schedules = await Schedule.find(filter)
    .sort({ time_slot_id: 1, id: 1 })
    .skip(paged ? (page - 1) * pageSize : 0)
    .limit(paged ? pageSize : 0)
    .lean()

  const courseIds = [...new Set(schedules.map((x) => Number(x.course_id)))]
  const facultyIds = [...new Set(schedules.map((x) => Number(x.faculty_id)))]
  const roomIds = [...new Set(schedules.map((x) => Number(x.room_id)))]
  const slotIds = [...new Set(schedules.map((x) => Number(x.time_slot_id)))]

  const [courses, faculties, rooms, slots] = await Promise.all([
    Course.find({ id: { $in: courseIds } }).lean(),
    Faculty.find({ id: { $in: facultyIds } }).lean(),
    Room.find({ id: { $in: roomIds } }).lean(),
    TimeSlot.find({ id: { $in: slotIds } }).lean(),
  ])

  const deptIds = [...new Set(courses.map((x) => Number(x.department_id)).filter((x) => x > 0))]
  const departments = await Department.find({ id: { $in: deptIds } }).lean()

  const courseMap = new Map(courses.map((c) => [Number(c.id), c]))
  const facultyMap = new Map(faculties.map((f) => [Number(f.id), f]))
  const roomMap = new Map(rooms.map((r) => [Number(r.id), r]))
  const slotMap = new Map(slots.map((t) => [Number(t.id), t]))
  const deptMap = new Map(departments.map((d) => [Number(d.id), d]))

  const list = schedules
    .map((s) => {
      const course = courseMap.get(Number(s.course_id))
      const faculty = facultyMap.get(Number(s.faculty_id))
      const room = roomMap.get(Number(s.room_id))
      const slot = slotMap.get(Number(s.time_slot_id))
      const dept = course?.department_id ? deptMap.get(Number(course.department_id)) : null
      return {
        id: s.id,
        semester: s.semester,
        section: s.section,
        course_id: s.course_id,
        faculty_id: s.faculty_id,
        room_id: s.room_id,
        time_slot_id: s.time_slot_id,
        course_code: course?.code || '',
        course_name: course?.name || '',
        department_name: dept?.name || null,
        faculty_name: faculty?.full_name || '',
        room_number: room?.room_number || '',
        slot_label: slot?.slot_label || '',
        day_of_week: slot?.day_of_week || 1,
        start_time: slot?.start_time || '',
        end_time: slot?.end_time || '',
      }
    })
    .sort((a, b) => a.day_of_week - b.day_of_week || String(a.start_time).localeCompare(String(b.start_time)))

  if (paged) {
    return res.json({ success: true, list, total, page, page_size: pageSize })
  }

  return res.json({ success: true, list })
})

router.post('/schedule_move.php', requireRole('admin'), async (req, res) => {
  const body = parseBody(req)
  const scheduleId = parseId(body.schedule_id)
  const nextRoomId = parseId(body.room_id)
  const nextSlotId = parseId(body.time_slot_id)
  if (!scheduleId) return apiError(res, 'Invalid schedule.')
  if (!nextRoomId && !nextSlotId) return apiError(res, 'room_id or time_slot_id required.')

  const row = await Schedule.findOne({ id: scheduleId }).lean()
  if (!row) return apiError(res, 'Schedule not found.')

  const roomId = nextRoomId || Number(row.room_id)
  const slotId = nextSlotId || Number(row.time_slot_id)

  const roomConflict = await Schedule.findOne({
    id: { $ne: scheduleId },
    academic_session_id: Number(row.academic_session_id),
    room_id: roomId,
    time_slot_id: slotId,
  }).lean()
  if (roomConflict) {
    return res.json({ success: false, message: 'Conflict: Room already booked at this time.', conflict: 'room' })
  }

  const facultyConflict = await Schedule.findOne({
    id: { $ne: scheduleId },
    academic_session_id: Number(row.academic_session_id),
    faculty_id: Number(row.faculty_id),
    time_slot_id: slotId,
  }).lean()
  if (facultyConflict) {
    return res.json({ success: false, message: 'Conflict: Teacher already assigned at this time.', conflict: 'faculty' })
  }

  await Schedule.updateOne({ id: scheduleId }, { $set: { room_id: roomId, time_slot_id: slotId } })
  return res.json({ success: true, message: 'Schedule updated.' })
})

router.get('/enrollment.php', requireRole('student'), async (req, res) => {
  const studentId = parseId(req.user.sub)
  const stu = await Student.findOne({ id: studentId }).lean()
  if (!stu) return apiError(res, 'Student not found.')

  let session = await AcademicSession.findOne({ is_active: 1 }).sort({ start_date: -1 }).lean()
  if (!session) {
    session = await AcademicSession.findOne({}).sort({ start_date: -1 }).lean()
  }

  if (!session) {
    return apiError(res, 'No academic session found. Ask admin to add a session (e.g. Fall 2026).')
  }

  const courses = await Course.find({
    is_active: 1,
    semester: Number(stu.semester),
    $or: [{ department_id: null }, { department_id: Number(stu.department_id) }],
  })
    .sort({ semester: 1, code: 1 })
    .lean()

  const prereqIds = [...new Set(courses.map((x) => Number(x.prerequisite_course_id)).filter((x) => x > 0))]
  const prereqRows = prereqIds.length ? await Course.find({ id: { $in: prereqIds } }).lean() : []
  const prereqMap = new Map(prereqRows.map((x) => [Number(x.id), x]))

  const enrollRows = await Enrollment.find({
    student_id: studentId,
    academic_session_id: Number(session.id),
    status: 'enrolled',
  }).lean()
  const enrolledSet = new Set(enrollRows.map((x) => Number(x.course_id)))

  return res.json({
    success: true,
    courses: courses.map((x) => {
      const prereq = x.prerequisite_course_id ? prereqMap.get(Number(x.prerequisite_course_id)) : null
      return {
        ...x,
        prerequisite_code: prereq?.code || null,
        prerequisite_name: prereq?.name || null,
        enrolled: enrolledSet.has(Number(x.id)),
      }
    }),
    academic_session_id: session.id,
    academic_session_name: session.name,
  })
})

router.post('/enrollment.php', requireRole('student'), async (req, res) => {
  const body = parseBody(req)
  const studentId = parseId(req.user.sub)
  const courseId = parseId(body.course_id)
  const academicSessionId = parseId(body.academic_session_id)
  if (!courseId || !academicSessionId) return apiError(res, 'Course and session required.')

  const course = await Course.findOne({ id: courseId }).lean()
  if (!course) return apiError(res, 'Course not found.')
  if (!Number(course.is_active)) return apiError(res, 'Course is not available for enrollment.')

  if (course.prerequisite_course_id) {
    const prerequisite = await Enrollment.findOne({
      student_id: studentId,
      course_id: Number(course.prerequisite_course_id),
      academic_session_id: { $lte: academicSessionId },
      status: 'enrolled',
    }).lean()

    if (!prerequisite) {
      return apiError(res, 'You must complete the prerequisite course before enrolling in this course.')
    }
  }

  const exists = await Enrollment.findOne({
    student_id: studentId,
    course_id: courseId,
    academic_session_id: academicSessionId,
    status: 'enrolled',
  }).lean()

  if (exists) {
    return apiError(res, 'You are already enrolled in this course for this session.')
  }

  await Enrollment.create({
    student_id: studentId,
    course_id: courseId,
    academic_session_id: academicSessionId,
    status: 'enrolled',
  })

  return res.json({ success: true, message: 'Enrolled successfully.' })
})

router.get('/substitution.php', async (req, res) => {
  const filter = req.user.role === 'faculty' ? { faculty_id: parseId(req.user.sub) } : {}
  const rows = await SubstitutionRequest.find(filter).sort({ created_at: -1, id: -1 }).lean()

  const facultyIds = [...new Set(rows.map((x) => Number(x.faculty_id)))]
  const scheduleIds = [...new Set(rows.map((x) => Number(x.schedule_id)))]

  const [faculties, schedules] = await Promise.all([
    Faculty.find({ id: { $in: facultyIds } }).lean(),
    Schedule.find({ id: { $in: scheduleIds } }).lean(),
  ])

  const courseIds = [...new Set(schedules.map((x) => Number(x.course_id)))]
  const slotIds = [...new Set(schedules.map((x) => Number(x.time_slot_id)))]

  const [courses, slots] = await Promise.all([
    Course.find({ id: { $in: courseIds } }).lean(),
    TimeSlot.find({ id: { $in: slotIds } }).lean(),
  ])

  const facultyMap = new Map(faculties.map((x) => [Number(x.id), x]))
  const scheduleMap = new Map(schedules.map((x) => [Number(x.id), x]))
  const courseMap = new Map(courses.map((x) => [Number(x.id), x]))
  const slotMap = new Map(slots.map((x) => [Number(x.id), x]))

  return res.json(
    rows.map((sr) => {
      const schedule = scheduleMap.get(Number(sr.schedule_id))
      const course = schedule ? courseMap.get(Number(schedule.course_id)) : null
      const slot = schedule ? slotMap.get(Number(schedule.time_slot_id)) : null
      const faculty = facultyMap.get(Number(sr.faculty_id))
      return {
        ...sr,
        faculty_name: faculty?.full_name || '',
        course_name: course?.name || '',
        course_code: course?.code || '',
        slot_label: slot?.slot_label || '',
      }
    })
  )
})

router.post('/substitution.php', requireRole('faculty'), async (req, res) => {
  const body = parseBody(req)
  const facultyId = parseId(req.user.sub)
  const scheduleId = parseId(body.schedule_id)
  const requestedDate = asTrimmed(body.requested_date)
  const reason = asTrimmed(body.reason)
  if (!scheduleId || !requestedDate) return apiError(res, 'schedule_id and requested_date are required.')

  const own = await Schedule.findOne({ id: scheduleId, faculty_id: facultyId }).lean()
  if (!own) return apiError(res, 'You can only request substitution for your own class.')

  const id = await nextId('substitution_request')
  await SubstitutionRequest.create({
    id,
    faculty_id: facultyId,
    schedule_id: scheduleId,
    requested_date: requestedDate,
    reason: reason || null,
    status: 'pending',
    admin_notes: null,
    created_at: new Date(),
  })

  return res.json({ success: true, message: 'Substitution request submitted.' })
})

router.put('/substitution.php', requireRole('admin'), async (req, res) => {
  const body = parseBody(req)
  const id = parseId(body.id)
  const status = asTrimmed(body.status).toLowerCase()
  const adminNotes = asTrimmed(body.admin_notes)
  if (!id) return apiError(res, 'Invalid substitution request.')
  if (!['approved', 'rejected'].includes(status)) return apiError(res, 'Invalid status.')

  const row = await SubstitutionRequest.findOne({ id }).lean()
  if (!row) return apiError(res, 'Substitution request not found.')
  if (row.status !== 'pending') return apiError(res, 'Substitution request is already processed.')

  await SubstitutionRequest.updateOne(
    { id },
    {
      $set: {
        status,
        admin_notes: adminNotes || null,
      },
    }
  )

  return res.json({ success: true, message: `Substitution request ${status}.` })
})

router.post('/generate.php', requireRole('admin'), async (req, res, next) => {
  const startedAt = Date.now()
  try {
    const body = parseBody(req)
    const academicSessionId = parseId(body.academic_session_id)
    const semester = Number(body.semester || 1)
    const section = asTrimmed(body.section || 'A')
    const clearFirst = Boolean(body.clear_first)

    if (!academicSessionId) return apiError(res, 'academic_session_id is required.')

    if (clearFirst) {
      await Schedule.deleteMany({
        academic_session_id: academicSessionId,
        semester,
        section,
      })
    }

    const courseRows = await Course.find({ is_active: 1, semester }).sort({ id: 1 }).lean()
    if (!courseRows.length) return apiError(res, 'No courses found for the selected semester.')

    const slots = await TimeSlot.find({}).sort({ day_of_week: 1, start_time: 1 }).lean()
    if (!slots.length) return apiError(res, 'No time slots found. Run install/setup first.')

    const rooms = await Room.find({ is_active: 1 }).sort({ id: 1 }).lean()
    if (!rooms.length) return apiError(res, 'No active rooms found.')

    const faculties = await Faculty.find({ is_active: 1 }).sort({ id: 1 }).lean()
    if (!faculties.length) return apiError(res, 'No active faculty found.')

    const pairs = await CourseFaculty.find({}).lean()
    const pairMap = new Map()
    for (const pair of pairs) {
      const key = Number(pair.course_id)
      if (!pairMap.has(key)) pairMap.set(key, [])
      pairMap.get(key).push(Number(pair.faculty_id))
    }

    const existing = await Schedule.find({ academic_session_id: academicSessionId }).lean()
    const facultyBusy = new Set(existing.map((x) => `${x.faculty_id}:${x.time_slot_id}`))
    const roomBusy = new Set(existing.map((x) => `${x.room_id}:${x.time_slot_id}`))

    const toInsert = []
    let inserted = 0

    for (const course of courseRows) {
      const needed = Math.max(1, Number(course.sessions_per_week || 1))
      const allowedFaculty = pairMap.get(Number(course.id)) || faculties.map((f) => Number(f.id))
      let placed = 0

      for (const slot of slots) {
        if (placed >= needed) break

        let selectedFaculty = 0
        for (const fId of allowedFaculty) {
          if (!facultyBusy.has(`${fId}:${slot.id}`)) {
            selectedFaculty = fId
            break
          }
        }
        if (!selectedFaculty) continue

        let selectedRoom = 0
        for (const room of rooms) {
          if (!roomBusy.has(`${room.id}:${slot.id}`)) {
            selectedRoom = Number(room.id)
            break
          }
        }
        if (!selectedRoom) continue

        const id = await nextId('schedule')
        toInsert.push({
          id,
          academic_session_id: academicSessionId,
          course_id: Number(course.id),
          faculty_id: selectedFaculty,
          room_id: selectedRoom,
          time_slot_id: Number(slot.id),
          semester,
          section,
        })

        facultyBusy.add(`${selectedFaculty}:${slot.id}`)
        roomBusy.add(`${selectedRoom}:${slot.id}`)
        placed += 1
        inserted += 1
      }
    }

    if (toInsert.length) {
      await Schedule.insertMany(toInsert)
    }

    const elapsedSeconds = (Date.now() - startedAt) / 1000
    return res.json({
      success: true,
      inserted,
      elapsed_seconds: Number(elapsedSeconds.toFixed(2)),
      message: `Generated ${inserted} slots in ${elapsedSeconds.toFixed(2)}s.`,
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/export.php', async (req, res) => {
  const sessionId = parseId(req.query.academic_session_id)
  const format = asTrimmed(req.query.format).toLowerCase()
  if (!sessionId || !['csv', 'pdf', 'ics'].includes(format)) {
    return res.status(400).send('Invalid export parameters.')
  }

  const filter = { academic_session_id: sessionId }

  if (req.user.role === 'faculty') {
    filter.faculty_id = parseId(req.user.sub)
  }

  if (req.user.role === 'student') {
    const stu = await Student.findOne({ id: parseId(req.user.sub) }).lean()
    if (!stu) return res.status(404).send('Student record not found.')
    filter.semester = Number(stu.semester)
    filter.section = asTrimmed(stu.section)
  }

  const schedules = await Schedule.find(filter).lean()
  const courseIds = [...new Set(schedules.map((x) => Number(x.course_id)))]
  const facultyIds = [...new Set(schedules.map((x) => Number(x.faculty_id)))]
  const roomIds = [...new Set(schedules.map((x) => Number(x.room_id)))]
  const slotIds = [...new Set(schedules.map((x) => Number(x.time_slot_id)))]

  const [courses, faculties, rooms, slots] = await Promise.all([
    Course.find({ id: { $in: courseIds } }).lean(),
    Faculty.find({ id: { $in: facultyIds } }).lean(),
    Room.find({ id: { $in: roomIds } }).lean(),
    TimeSlot.find({ id: { $in: slotIds } }).lean(),
  ])

  const courseMap = new Map(courses.map((x) => [Number(x.id), x]))
  const facultyMap = new Map(faculties.map((x) => [Number(x.id), x]))
  const roomMap = new Map(rooms.map((x) => [Number(x.id), x]))
  const slotMap = new Map(slots.map((x) => [Number(x.id), x]))

  const rows = schedules
    .map((s) => {
      const course = courseMap.get(Number(s.course_id))
      const faculty = facultyMap.get(Number(s.faculty_id))
      const room = roomMap.get(Number(s.room_id))
      const slot = slotMap.get(Number(s.time_slot_id))
      return {
        course_code: course?.code || '',
        course_name: course?.name || '',
        faculty_name: faculty?.full_name || '',
        room_number: room?.room_number || '',
        slot_label: slot?.slot_label || '',
        day_of_week: slot?.day_of_week || 1,
        start_time: slot?.start_time || '',
        end_time: slot?.end_time || '',
      }
    })
    .sort((a, b) => a.day_of_week - b.day_of_week || String(a.start_time).localeCompare(String(b.start_time)))

  if (format === 'csv') {
    const lines = ['Course Code,Course Name,Faculty,Room,Slot,Start,End']
    for (const row of rows) {
      lines.push(
        [row.course_code, row.course_name, row.faculty_name, row.room_number, row.slot_label, to12h(row.start_time), to12h(row.end_time)]
          .map((v) => `"${String(v ?? '').replaceAll('"', '""')}"`)
          .join(',')
      )
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename=timetable_${sessionId}.csv`)
    return res.send(lines.join('\n'))
  }

  if (format === 'pdf') {
    const htmlRows = rows
      .map(
        (r) =>
          `<tr><td>${r.course_name} (${r.course_code})</td><td>${r.faculty_name}</td><td>${r.room_number}</td><td>${r.slot_label}</td><td>${to12h(r.start_time)} - ${to12h(r.end_time)}</td></tr>`
      )
      .join('')

    return res.send(`<!doctype html><html><head><meta charset="utf-8"><title>Timetable</title><style>body{font-family:Arial,sans-serif}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}</style></head><body><h2>Timetable</h2><table><thead><tr><th>Course</th><th>Faculty</th><th>Room</th><th>Slot</th><th>Time</th></tr></thead><tbody>${htmlRows}</tbody></table></body></html>`)
  }

  const sess = await AcademicSession.findOne({ id: sessionId }).lean()
  const until = sess?.end_date ? String(sess.end_date).replaceAll('-', '') : '20991231'
  const byDay = { 1: 'MO', 2: 'TU', 3: 'WE', 4: 'TH', 5: 'FR', 6: 'SA', 7: 'SU' }

  const events = rows
    .map((r, i) => {
      const day = byDay[Number(r.day_of_week)] || 'MO'
      const start = String(r.start_time).replaceAll(':', '').slice(0, 6)
      const end = String(r.end_time).replaceAll(':', '').slice(0, 6)
      return [
        'BEGIN:VEVENT',
        `UID:timetable-${sessionId}-${i + 1}@timetable`,
        `DTSTART:20260105T${start}`,
        `DTEND:20260105T${end}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${day};UNTIL=${until}T235959`,
        `SUMMARY:${r.course_name}`,
        `LOCATION:${r.room_number}`,
        `DESCRIPTION:Faculty ${r.faculty_name}`,
        'END:VEVENT',
      ].join('\r\n')
    })
    .join('\r\n')

  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Timetable//EN', events, 'END:VCALENDAR'].join('\r\n')
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename=timetable_${sessionId}.ics`)
  return res.send(ics)
})

export default router
