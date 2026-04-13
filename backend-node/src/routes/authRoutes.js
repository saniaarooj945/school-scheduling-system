import { Router } from 'express'
import { login, me } from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/login', login)
router.get('/me', requireAuth, me)
router.post('/logout', (req, res) => res.json({ success: true, message: 'Logged out' }))

export default router
