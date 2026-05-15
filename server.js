const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const dotenv = require('dotenv')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/barber_salon'

// CHANGE THIS LINE - Add the frontend URL to CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'https://barborshop.netlify.app',
    credentials: true
}))
app.use(express.json())

const bookingSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    appointmentDate: { type: Date, required: true },
    treatments: [
      {
        id: String,
        name: String,
        description: String,
        price: Number,
      },
    ],
    deals: [
      {
        id: String,
        name: String,
        discountPercent: Number,
        discountedPrice: Number,
        treatments: [
          {
            id: String,
            name: String,
            price: Number,
          },
        ],
      },
    ],
    totalCost: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
)

const Booking = mongoose.model('Booking', bookingSchema)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/bookings', async (_req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 })
    return res.json({ count: bookings.length, bookings })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch bookings.', error: error.message })
  }
})

app.post('/api/bookings', async (req, res) => {
  try {
    const { customerName, phone, appointmentDate, treatments = [], deals = [], totalCost } = req.body
    const hasSelection = treatments.length > 0 || deals.length > 0

    if (!hasSelection) {
      return res.status(400).json({ message: 'At least one treatment or deal is required.' })
    }

    const booking = await Booking.create({
      customerName,
      phone,
      appointmentDate,
      treatments,
      deals,
      totalCost,
    })

    return res.status(201).json({ message: 'Booking saved.', booking })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to save booking.', error: error.message })
  }
})

async function start() {
  try {
    await mongoose.connect(MONGO_URI)
    app.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`)
    })
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    process.exit(1)
  }
}

start()
