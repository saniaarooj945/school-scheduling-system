import mongoose from 'mongoose'

const academicSessionSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    start_date: { type: String, required: true, trim: true },
    end_date: { type: String, required: true, trim: true },
    is_active: { type: Number, default: 1 },
  },
  { timestamps: true }
)

export const AcademicSession = mongoose.model('AcademicSession', academicSessionSchema)
