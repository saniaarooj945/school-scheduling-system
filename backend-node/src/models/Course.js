import mongoose from 'mongoose'

const courseSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    credit_hours: { type: Number, default: 3 },
    semester: { type: Number, default: 1 },
    department_id: { type: Number, default: null },
    sessions_per_week: { type: Number, default: 3 },
    prerequisite_course_id: { type: Number, default: null },
    is_active: { type: Number, default: 1 },
  },
  { timestamps: true }
)

courseSchema.index({ code: 1 }, { unique: true })

export const Course = mongoose.model('Course', courseSchema)
