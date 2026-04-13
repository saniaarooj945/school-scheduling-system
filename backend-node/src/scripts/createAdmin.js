import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { connectDB } from '../config/db.js'
import { Admin } from '../models/Admin.js'
import { nextId } from '../utils/id.js'

dotenv.config()

const run = async () => {
  await connectDB()

  const name = process.env.ADMIN_NAME || 'System Admin'
  const email = (process.env.ADMIN_EMAIL || 'admin@isp.edu.pk').toLowerCase()
  const password = process.env.ADMIN_PASSWORD || 'admin123'

  if (!process.env.JWT_SECRET) {
    console.warn('JWT_SECRET is not set. Please configure .env before production use.')
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const existing = await Admin.findOne({ email }).lean()

  if (existing) {
    await Admin.updateOne(
      { email },
      {
        $set: {
          password_hash: passwordHash,
          full_name: name,
        },
      }
    )
  } else {
    const id = await nextId('admin')
    await Admin.create({
      id,
      email,
      password_hash: passwordHash,
      full_name: name,
    })
  }

  console.log(`Admin user ensured: ${email}`)
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
