import mongoose from 'mongoose'

const studentSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    full_name: { type: String, required: true, trim: true },
    department_id: { type: Number, default: null },
    semester: { type: Number, default: 1 },
    section: { type: String, default: 'A', trim: true },
    is_active: { type: Number, default: 1 },
  },
  { timestamps: true }
)

export const Student = mongoose.model('Student', studentSchema)
