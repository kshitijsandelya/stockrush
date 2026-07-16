import { useEffect, useState } from 'react'
import { apiFetch } from '../api'

function AdminPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [stock, setStock] = useState(100)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [sales, setSales] = useState([])
  const [message, setMessage] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function loadSales() {
    try {
      const data = await apiFetch('/sales')
      setSales(data.sales)
    } catch (err) {
      setMessage(err.message)
    }
  }

  useEffect(() => {
    loadSales()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)

    try {
      const productData = await apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify({ name, description })
      })

      await apiFetch('/sales', {
        method: 'POST',
        body: JSON.stringify({
          productId: productData.product.id,
          startTime,
          endTime,
          stock: Number(stock)
        })
      })

      setMessage('sale created')
      setName('')
      setDescription('')
      setStock(100)
      setStartTime('')
      setEndTime('')
      loadSales()
    } catch (err) {
      setMessage(err.message)
    }

    setSubmitting(false)
  }

  return (
    <div className="page">
      <h2>Admin panel</h2>

      <form onSubmit={handleSubmit} className="admin-form">
        <label>
          Product name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        <label>
          Description
          <input value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <label>
          Stock
          <input type="number" min="1" value={stock} onChange={(e) => setStock(e.target.value)} required />
        </label>

        <label>
          Start time
          <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
        </label>

        <label>
          End time
          <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create sale'}
        </button>
      </form>

      {message && <p className="message">{message}</p>}

      <h3>Existing sales</h3>
      <table className="sales-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Product</th>
            <th>Stock</th>
            <th>Start</th>
            <th>End</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id}>
              <td>{sale.id}</td>
              <td>{sale.product_name}</td>
              <td>{sale.stock_remaining} / {sale.stock_total}</td>
              <td>{new Date(sale.start_time).toLocaleString()}</td>
              <td>{new Date(sale.end_time).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AdminPage
