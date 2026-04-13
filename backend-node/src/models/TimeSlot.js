import mongoose from 'mongoose'

const timeSlotSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    slot_label: { type: String, required: true, trim: true },
    day_of_week: { type: Number, required: true },
    start_time: { type: String, required: true, trim: true },
    end_time: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

export const TimeSlot = mongoose.model('TimeSlot', timeSlotSchema)
