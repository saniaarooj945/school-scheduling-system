import mongoose from 'mongoose'

const adminSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    full_name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

export const Admin = mongoose.model('Admin', adminSchema)
