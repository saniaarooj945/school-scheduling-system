import mongoose from 'mongoose'

const roomSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    room_number: { type: String, required: true, unique: true, trim: true },
    capacity: { type: Number, default: 30 },
    room_type: { type: String, default: 'classroom', trim: true },
    is_active: { type: Number, default: 1 },
  },
  { timestamps: true }
)

export const Room = mongoose.model('Room', roomSchema)
