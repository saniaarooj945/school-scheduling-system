import { Counter } from '../models/Counter.js'

export const nextId = async (key) => {
  const row = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean()

  return Number(row.seq)
}
