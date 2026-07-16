const express = require('express')
const pool = require('../db/pool')
const requireAuth = require('../middleware/auth')

const router = express.Router()

router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC')
  res.json({ products: result.rows })
})

router.post('/', requireAuth, async (req, res) => {
  const { name, description } = req.body
  if (!name) {
    return res.status(400).json({ error: 'name required' })
  }

  const result = await pool.query(
    'INSERT INTO products (name, description) VALUES ($1, $2) RETURNING *',
    [name, description || null]
  )

  res.status(201).json({ product: result.rows[0] })
})

module.exports = router
