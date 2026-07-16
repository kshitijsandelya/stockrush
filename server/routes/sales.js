const express = require('express')
const pool = require('../db/pool')
const { client: redis } = require('../redis/client')
const requireAuth = require('../middleware/auth')

const router = express.Router()

router.get('/', async (req, res) => {
  const result = await pool.query(
    `SELECT sales.*, products.name AS product_name, products.description AS product_description
     FROM sales
     JOIN products ON products.id = sales.product_id
     ORDER BY sales.created_at DESC`
  )
  res.json({ sales: result.rows })
})

router.get('/:id', async (req, res) => {
  const result = await pool.query(
    `SELECT sales.*, products.name AS product_name, products.description AS product_description
     FROM sales
     JOIN products ON products.id = sales.product_id
     WHERE sales.id = $1`,
    [req.params.id]
  )
  const sale = result.rows[0]
  if (!sale) {
    return res.status(404).json({ error: 'sale not found' })
  }
  res.json({ sale })
})

router.post('/', requireAuth, async (req, res) => {
  const { productId, startTime, endTime, stock } = req.body
  if (!productId || !startTime || !endTime || !stock) {
    return res.status(400).json({ error: 'productId, startTime, endTime, stock required' })
  }

  const result = await pool.query(
    'INSERT INTO sales (product_id, start_time, end_time, stock_total, stock_remaining) VALUES ($1, $2, $3, $4, $4) RETURNING *',
    [productId, startTime, endTime, stock]
  )
  const sale = result.rows[0]

  await redis.set(`sale:${sale.id}:stock`, stock)

  res.status(201).json({ sale })
})

module.exports = router
