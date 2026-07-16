import { useEffect, useState } from 'react'
import { apiFetch } from '../api'

function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function loadOrders() {
    setLoading(true)
    try {
      const data = await apiFetch('/orders/mine')
      setOrders(data.orders)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadOrders()
  }, [])

  if (loading) {
    return <p>Loading...</p>
  }

  if (error) {
    return <p className="message">{error}</p>
  }

  if (orders.length === 0) {
    return <p>No orders yet.</p>
  }

  return (
    <div className="page">
      <h2>Order history</h2>
      <table className="sales-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Product</th>
            <th>Qty</th>
            <th>Status</th>
            <th>Placed</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.product_name}</td>
              <td>{order.quantity}</td>
              <td>{order.status}</td>
              <td>{new Date(order.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default OrdersPage
