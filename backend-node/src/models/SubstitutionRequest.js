import mongoose from 'mongoose'

const substitutionRequestSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    faculty_id: { type: Number, required: true },
    schedule_id: { type: Number, required: true },
    requested_date: { type: String, required: true, trim: true },
    reason: { type: String, default: null },
    status: { type: String, default: 'pending', trim: true },
    admin_notes: { type: String, default: null },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export const SubstitutionRequest = mongoose.model('SubstitutionRequest', substitutionRequestSchema)
