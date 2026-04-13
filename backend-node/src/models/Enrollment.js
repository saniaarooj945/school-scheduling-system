import mongoose from 'mongoose'

const enrollmentSchema = new mongoose.Schema(
  {
    student_id: { type: Number, required: true },
    course_id: { type: Number, required: true },
    academic_session_id: { type: Number, required: true },
    status: { type: String, default: 'enrolled', trim: true },
  },
  { timestamps: true }
)

enrollmentSchema.index({ student_id: 1, course_id: 1, academic_session_id: 1 }, { unique: true })

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema)
