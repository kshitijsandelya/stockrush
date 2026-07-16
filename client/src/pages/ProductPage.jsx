import { useEffect, useState } from 'react'
import { apiFetch } from '../api'
import CountdownTimer from '../components/CountdownTimer'

function ProductPage() {
  const [sale, setSale] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('fixed')
  const [buying, setBuying] = useState(false)
  const [message, setMessage] = useState(null)

  async function loadSale() {
    setLoading(true)
    try {
      const data = await apiFetch('/sales')
      setSale(data.sales[0] || null)
    } catch (err) {
      setMessage(err.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadSale()
  }, [])

  async function handleBuy() {
    if (!sale) return
    setBuying(true)
    setMessage(null)

    try {
      if (mode === 'naive') {
        const data = await apiFetch('/orders/buy-naive', {
          method: 'POST',
          body: JSON.stringify({ saleId: sale.id })
        })
        setMessage(`order placed, id ${data.order.id}`)
      } else {
        const idempotencyKey = crypto.randomUUID()
        const data = await apiFetch('/orders/buy', {
          method: 'POST',
          headers: { 'Idempotency-Key': idempotencyKey },
          body: JSON.stringify({ saleId: sale.id })
        })
        setMessage(`order placed, id ${data.order.id}`)
      }
    } catch (err) {
      setMessage(err.message)
    }

    setBuying(false)
  }

  if (loading) {
    return <p>Loading...</p>
  }

  if (!sale) {
    return <p>No sale scheduled yet. Create one from the admin panel.</p>
  }

  return (
    <div className="page">
      <h2>{sale.product_name}</h2>
      <p>{sale.product_description}</p>

      <CountdownTimer startTime={sale.start_time} endTime={sale.end_time} />

      <p className="stock-line">{sale.stock_remaining} / {sale.stock_total} units left (as of last page load)</p>

      <div className="mode-toggle">
        <label>
          <input
            type="radio"
            name="mode"
            value="fixed"
            checked={mode === 'fixed'}
            onChange={() => setMode('fixed')}
          />
          Fixed (Redis atomic)
        </label>
        <label>
          <input
            type="radio"
            name="mode"
            value="naive"
            checked={mode === 'naive'}
            onChange={() => setMode('naive')}
          />
          Naive (racy)
        </label>
      </div>

      <button onClick={handleBuy} disabled={buying}>
        {buying ? 'Buying...' : 'Buy now'}
      </button>

      {message && <p className="message">{message}</p>}
    </div>
  )
}

export default ProductPage
