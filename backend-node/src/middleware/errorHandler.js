export const notFoundHandler = (req, res) => {
  return res.status(404).json({ success: false, message: 'Route not found' })
}

export const errorHandler = (err, req, res, next) => {
  console.error(err)
  if (res.headersSent) return next(err)
  return res.status(500).json({ success: false, message: 'Internal server error' })
}
