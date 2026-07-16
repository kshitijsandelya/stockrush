import http from 'k6/http'
import { check } from 'k6'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000'
const SALE_ID = Number(__ENV.SALE_ID)
const tokens = JSON.parse(open('./setup/tokens.json'))

export const options = {
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  scenarios: {
    flash_sale: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 500 },
        { duration: '15s', target: 500 },
        { duration: '5s', target: 0 }
      ]
    }
  }
}

export default function () {
  const token = tokens[__VU % tokens.length]

  const res = http.post(
    `${BASE_URL}/api/orders/buy-naive`,
    JSON.stringify({ saleId: SALE_ID }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    }
  )

  check(res, {
    'status is 201 or 409': (r) => r.status === 201 || r.status === 409
  })
}
