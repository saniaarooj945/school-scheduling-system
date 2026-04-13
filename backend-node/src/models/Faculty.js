import mongoose from 'mongoose'

const facultySchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    full_name: { type: String, required: true, trim: true },
    department_id: { type: Number, default: null },
    availability_notes: { type: String, default: '' },
    is_active: { type: Number, default: 1 },
  },
  { timestamps: true }
)

export const Faculty = mongoose.model('Faculty', facultySchema)
