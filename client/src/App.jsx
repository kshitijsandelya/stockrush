import { Routes, Route, Link } from 'react-router-dom'
import TokenBar from './components/TokenBar'
import ProductPage from './pages/ProductPage'
import AdminPage from './pages/AdminPage'
import OrdersPage from './pages/OrdersPage'

function App() {
  return (
    <div className="app">
      <header>
        <h1>StockRush</h1>
        <nav>
          <Link to="/">Product</Link>
          <Link to="/admin">Admin</Link>
          <Link to="/orders">Orders</Link>
        </nav>
      </header>

      <TokenBar />

      <main>
        <Routes>
          <Route path="/" element={<ProductPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/orders" element={<OrdersPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
