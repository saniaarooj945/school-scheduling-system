import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/authRoutes.js'
import actionRoutes from './routes/actionRoutes.js'
import { connectDB } from './config/db.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

dotenv.config()

const app = express()
const preferredPort = Number(process.env.PORT || 5000)
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

app.use(
  cors({
    origin: clientOrigin,
    credentials: false,
  })
)
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running' })
})

app.use('/api/auth', authRoutes)
app.use('/api/actions', actionRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

function startServer(startPort) {
  const maxAttempts = process.env.NODE_ENV === 'production' ? 1 : 10
  let attempts = 0

  const tryListen = (port) => {
    const server = app.listen(port, () => {
      console.log(`Node auth API running on http://localhost:${port}`)
      if (port !== preferredPort) {
        console.log(`Requested port ${preferredPort} was busy; using ${port} instead.`)
      }
    })

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE' && attempts < maxAttempts - 1) {
        attempts += 1
        const nextPort = port + 1
        console.warn(`Port ${port} in use, retrying on ${nextPort}...`)
        tryListen(nextPort)
        return
      }

      console.error('Failed to start HTTP server', error)
      process.exit(1)
    })
  }

  tryListen(startPort)
}

connectDB()
  .then(() => {
    startServer(preferredPort)
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB', error)
    process.exit(1)
  })
