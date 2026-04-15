import mongoose from 'mongoose'

const DEFAULT_RETRY_DELAY_MS = 5000

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI
  if (!mongoUri) {
    throw new Error('MONGO_URI is not set in environment variables')
  }

  await mongoose.connect(mongoUri)
  console.log('MongoDB connected')
}

export const connectDBWithRetry = async () => {
  const retryDelayMs = Number(process.env.MONGO_RETRY_DELAY_MS || DEFAULT_RETRY_DELAY_MS)

  const tryConnect = async () => {
    try {
      await connectDB()
    } catch (error) {
      console.error(
        `Failed to connect to MongoDB. Retrying in ${retryDelayMs}ms...`,
        error.message || error
      )
      setTimeout(tryConnect, retryDelayMs)
    }
  }

  await tryConnect()
}

export const pingDb = async () => {
  const state = mongoose.connection.readyState
  if (state !== 1) return false
  await mongoose.connection.db.admin().ping()
  return true
}
