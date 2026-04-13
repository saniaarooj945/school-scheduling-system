import mongoose from 'mongoose'

const scheduleSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    academic_session_id: { type: Number, required: true },
    course_id: { type: Number, required: true },
    faculty_id: { type: Number, required: true },
    room_id: { type: Number, required: true },
    time_slot_id: { type: Number, required: true },
    semester: { type: Number, required: true },
    section: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

export const Schedule = mongoose.model('Schedule', scheduleSchema)
