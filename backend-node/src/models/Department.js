import mongoose from 'mongoose'

const departmentSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

departmentSchema.index({ name: 1 }, { unique: true })
departmentSchema.index({ code: 1 }, { unique: true })

export const Department = mongoose.model('Department', departmentSchema)
