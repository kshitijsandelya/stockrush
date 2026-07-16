const express = require('express')
const pool = require('../db/pool')
const { client: redis } = require('../redis/client')
const requireAuth = require('../middleware/auth')

const router = express.Router()

router.get('/mine', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT orders.*, products.name AS product_name, sales.start_time, sales.end_time
     FROM orders
     JOIN sales ON sales.id = orders.sale_id
     JOIN products ON products.id = sales.product_id
     WHERE orders.user_id = $1
     ORDER BY orders.created_at DESC`,
    [req.user.id]
  )
  res.json({ orders: result.rows })
})

router.post('/buy-naive', requireAuth, async (req, res) => {
  const { saleId } = req.body
  if (!saleId) {
    return res.status(400).json({ error: 'saleId required' })
  }

  const saleResult = await pool.query('SELECT stock_remaining FROM sales WHERE id = $1', [saleId])
  const sale = saleResult.rows[0]
  if (!sale) {
    return res.status(404).json({ error: 'sale not found' })
  }

  if (sale.stock_remaining <= 0) {
    return res.status(409).json({ error: 'sold out' })
  }

  await pool.query('UPDATE sales SET stock_remaining = stock_remaining - 1 WHERE id = $1', [saleId])

  const orderResult = await pool.query(
    'INSERT INTO orders (user_id, sale_id, quantity, status) VALUES ($1, $2, 1, $3) RETURNING *',
    [req.user.id, saleId, 'confirmed']
  )

  res.status(201).json({ order: orderResult.rows[0] })
})

router.post('/buy', requireAuth, async (req, res) => {
  const { saleId } = req.body
  const idempotencyKey = req.headers['idempotency-key']

  if (!saleId) {
    return res.status(400).json({ error: 'saleId required' })
  }
  if (!idempotencyKey) {
    return res.status(400).json({ error: 'Idempotency-Key header required' })
  }

  const idemRedisKey = `idem:${idempotencyKey}`
  const locked = await redis.set(idemRedisKey, 'pending', { NX: true, EX: 86400 })

  if (!locked) {
    const existing = await pool.query('SELECT * FROM orders WHERE idempotency_key = $1', [idempotencyKey])
    if (existing.rows.length > 0) {
      return res.status(200).json({ order: existing.rows[0], replayed: true })
    }
    return res.status(409).json({ error: 'request already in progress, retry shortly' })
  }

  const stockKey = `sale:${saleId}:stock`
  const remaining = await redis.decr(stockKey)

  if (remaining < 0) {
    await redis.incr(stockKey)
    await redis.del(idemRedisKey)
    return res.status(409).json({ error: 'sold out' })
  }

  try {
    const orderResult = await pool.query(
      'INSERT INTO orders (user_id, sale_id, quantity, status, idempotency_key) VALUES ($1, $2, 1, $3, $4) RETURNING *',
      [req.user.id, saleId, 'confirmed', idempotencyKey]
    )

    await pool.query('UPDATE sales SET stock_remaining = stock_remaining - 1 WHERE id = $1', [saleId])
    await redis.set(idemRedisKey, 'done', { EX: 86400 })

    res.status(201).json({ order: orderResult.rows[0] })
  } catch (err) {
    await redis.incr(stockKey)
    await redis.del(idemRedisKey)
    throw err
  }
})

module.exports = router
