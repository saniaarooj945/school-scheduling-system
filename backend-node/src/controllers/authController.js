import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Admin } from '../models/Admin.js'
import { Faculty } from '../models/Faculty.js'
import { Student } from '../models/Student.js'

const signToken = (user) =>
  jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      role: user.role,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  )

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' })
    }

    const normalizedEmail = String(email).toLowerCase().trim()
    const admin = await Admin.findOne({ email: normalizedEmail }).lean()
    const faculty = admin
      ? null
      : await Faculty.findOne({ email: normalizedEmail, is_active: 1 }).lean()
    const student = admin || faculty
      ? null
      : await Student.findOne({ email: normalizedEmail, is_active: 1 }).lean()

    const user = admin
      ? { ...admin, role: 'admin' }
      : faculty
        ? { ...faculty, role: 'faculty' }
        : student
          ? { ...student, role: 'student' }
          : null

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    const token = signToken(user)

    return res.json({
      success: true,
      message: 'Login successful',
      redirect: `/${user.role}/`,
      token,
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    return next(error)
  }
}

export const me = async (req, res) => {
  return res.json({
    success: true,
    user: {
      id: req.user.sub,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
    },
  })
}
