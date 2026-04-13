import mongoose from 'mongoose'

const courseFacultySchema = new mongoose.Schema(
  {
    course_id: { type: Number, required: true },
    faculty_id: { type: Number, required: true },
  },
  { timestamps: true }
)

courseFacultySchema.index({ course_id: 1, faculty_id: 1 }, { unique: true })

export const CourseFaculty = mongoose.model('CourseFaculty', courseFacultySchema)
