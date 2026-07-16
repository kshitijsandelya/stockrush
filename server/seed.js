require('dotenv').config()
const pool = require('./db/pool')
const { client: redis, connectRedis } = require('./redis/client')

async function seed() {
  await connectRedis()

  const productResult = await pool.query(
    'INSERT INTO products (name, description) VALUES ($1, $2) RETURNING id',
    ['Limited Edition Sneakers', 'Flash sale drop, 100 units only']
  )
  const productId = productResult.rows[0].id

  const now = new Date()
  const end = new Date(now.getTime() + 60 * 60 * 1000)
  const stock = 100

  const saleResult = await pool.query(
    'INSERT INTO sales (product_id, start_time, end_time, stock_total, stock_remaining) VALUES ($1, $2, $3, $4, $4) RETURNING id',
    [productId, now, end, stock]
  )
  const saleId = saleResult.rows[0].id

  await redis.set(`sale:${saleId}:stock`, stock)

  console.log('seeded product', productId, 'sale', saleId, 'with', stock, 'units')

  await pool.end()
  await redis.quit()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
