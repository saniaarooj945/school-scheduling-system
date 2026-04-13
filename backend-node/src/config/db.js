import mongoose from 'mongoose'

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI
  if (!mongoUri) {
    throw new Error('MONGO_URI is not set in environment variables')
  }

  await mongoose.connect(mongoUri)
  console.log('MongoDB connected')
}

export const pingDb = async () => {
  const state = mongoose.connection.readyState
  if (state !== 1) return false
  await mongoose.connection.db.admin().ping()
  return true
}
