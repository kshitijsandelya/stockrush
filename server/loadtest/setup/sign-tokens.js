require('dotenv').config({ path: __dirname + '/../../.env' })
const jwt = require('jsonwebtoken')
const fs = require('fs')

const users = JSON.parse(fs.readFileSync(__dirname + '/users.json'))
const tokens = users.map(u => jwt.sign({ id: u.id, email: u.email }, process.env.JWT_SECRET, { expiresIn: '2h' }))

fs.writeFileSync(__dirname + '/tokens.json', JSON.stringify(tokens))
console.log('signed', tokens.length, 'tokens')
