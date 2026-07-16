require('dotenv').config({ path: __dirname + '/../../.env' })
const pool = require('../../db/pool')
const bcrypt = require('bcrypt')
const fs = require('fs')

async function run() {
  const count = 600
  const hash = await bcrypt.hash('loadtest123', 4)
  const tokens = []

  for (let i = 0; i < count; i++) {
    const email = `loadtest${i}@stockrush.test`
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    let userId
    if (existing.rows.length > 0) {
      userId = existing.rows[0].id
    } else {
      const result = await pool.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
        [email, hash]
      )
      userId = result.rows[0].id
    }
    tokens.push({ id: userId, email })
  }

  fs.writeFileSync(__dirname + '/users.json', JSON.stringify(tokens))
  console.log('created/confirmed', tokens.length, 'users')
  await pool.end()
}

run().catch((err) => { console.error(err); process.exit(1) })
