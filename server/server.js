require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { connectRedis } = require('./redis/client')
const authRoutes = require('./routes/auth')
const orderRoutes = require('./routes/orders')
const productRoutes = require('./routes/products')
const saleRoutes = require('./routes/sales')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/products', productRoutes)
app.use('/api/sales', saleRoutes)

const PORT = process.env.PORT || 4000

process.on('unhandledRejection', (err) => {
  console.error('unhandled rejection:', err)
})

async function start() {
  await connectRedis()
  app.listen(PORT, () => console.log('server running on port', PORT))
}

start()
