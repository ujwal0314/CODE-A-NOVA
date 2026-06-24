import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const initialProductForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
  supplier: '',
}

const initialSupplierForm = {
  name: '',
  contact: '',
  email: '',
  address: '',
}

const initialSaleForm = {
  product: '',
  quantity: '',
  customerName: '',
}

const initialPurchaseForm = {
  product: '',
  quantity: '',
  supplier: '',
}

const navItems = ['home', 'about', 'services', 'products', 'contact', 'login', 'dashboard']

const services = [
  {
    title: 'Product Management',
    body: 'Create product records, assign suppliers, track prices, and monitor SKU availability.',
  },
  {
    title: 'Stock Control',
    body: 'Record purchases and sales so stock levels stay updated for shop-owner decisions.',
  },
  {
    title: 'Supplier Records',
    body: 'Maintain supplier contact details and connect purchase entries to supplier history.',
  },
  {
    title: 'Dashboard Reports',
    body: 'Review low-stock alerts, product counts, movement totals, and recent transactions.',
  },
]

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function App() {
  const [page, setPage] = useState('home')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [sales, setSales] = useState([])
  const [purchases, setPurchases] = useState([])
  const [activeForm, setActiveForm] = useState('product')
  const [editingProduct, setEditingProduct] = useState(null)
  const [productForm, setProductForm] = useState(initialProductForm)
  const [supplierForm, setSupplierForm] = useState(initialSupplierForm)
  const [saleForm, setSaleForm] = useState(initialSaleForm)
  const [purchaseForm, setPurchaseForm] = useState(initialPurchaseForm)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      const [productsRes, suppliersRes, salesRes, purchasesRes] = await Promise.all([
        fetch(`${API_BASE}/products`),
        fetch(`${API_BASE}/suppliers`),
        fetch(`${API_BASE}/sales`),
        fetch(`${API_BASE}/purchases`),
      ])

      if (![productsRes, suppliersRes, salesRes, purchasesRes].every((res) => res.ok)) {
        throw new Error('One or more inventory requests failed.')
      }

      const [productsData, suppliersData, salesData, purchasesData] = await Promise.all([
        productsRes.json(),
        suppliersRes.json(),
        salesRes.json(),
        purchasesRes.json(),
      ])

      setProducts(productsData)
      setSuppliers(suppliersData)
      setSales(salesData)
      setPurchases(purchasesData)
    } catch (err) {
      setError(`${err.message} Start the API server and MongoDB, then refresh.`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const metrics = useMemo(() => {
    const inventoryValue = products.reduce(
      (sum, product) => sum + Number(product.price || 0) * Number(product.stock || 0),
      0,
    )
    const lowStockItems = products.filter((product) => Number(product.stock) <= 10)
    const unitsSold = sales.reduce((sum, sale) => sum + Number(sale.quantity || 0), 0)
    const unitsPurchased = purchases.reduce(
      (sum, purchase) => sum + Number(purchase.quantity || 0),
      0,
    )
    const salesValue = sales.reduce(
      (sum, sale) => sum + Number(sale.quantity || 0) * Number(sale.product?.price || 0),
      0,
    )

    return { inventoryValue, lowStockItems, unitsSold, unitsPurchased, salesValue }
  }, [products, purchases, sales])

  const productOptions = products.map((product) => (
    <option key={product._id} value={product._id}>
      {product.name}
    </option>
  ))

  const supplierOptions = suppliers.map((supplier) => (
    <option key={supplier._id} value={supplier._id}>
      {supplier.name}
    </option>
  ))

  const moveTo = (nextPage) => {
    setStatus('')
    setError('')
    setPage(nextPage)
  }

  const submitJson = async (path, payload, successMessage, method = 'POST') => {
    setSaving(true)
    setStatus('')
    setError('')

    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Save failed.')
      }

      setStatus(successMessage)
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleProductSubmit = async (event) => {
    event.preventDefault()
    const productPayload = {
      ...productForm,
      price: Number(productForm.price),
      stock: Number(productForm.stock),
      supplier: productForm.supplier || undefined,
    }

    await submitJson(
      editingProduct ? `/products/${editingProduct._id}` : '/products',
      productPayload,
      editingProduct ? 'Product updated.' : 'Product added.',
      editingProduct ? 'PUT' : 'POST',
    )
    setProductForm(initialProductForm)
    setEditingProduct(null)
  }

  const handleSupplierSubmit = async (event) => {
    event.preventDefault()
    await submitJson('/suppliers', supplierForm, 'Supplier added.')
    setSupplierForm(initialSupplierForm)
  }

  const handleSaleSubmit = async (event) => {
    event.preventDefault()
    await submitJson(
      '/sales',
      {
        ...saleForm,
        quantity: Number(saleForm.quantity),
      },
      'Sale recorded.',
    )
    setSaleForm(initialSaleForm)
  }

  const handlePurchaseSubmit = async (event) => {
    event.preventDefault()
    await submitJson(
      '/purchases',
      {
        ...purchaseForm,
        quantity: Number(purchaseForm.quantity),
      },
      'Purchase recorded.',
    )
    setPurchaseForm(initialPurchaseForm)
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price: String(product.price ?? ''),
      stock: String(product.stock ?? ''),
      supplier: product.supplier?._id || product.supplier || '',
    })
    setActiveForm('product')
    setPage('dashboard')
    setStatus('Editing product. Update the form and save changes.')
    setError('')
  }

  const handleCancelEdit = () => {
    setEditingProduct(null)
    setProductForm(initialProductForm)
    setStatus('')
  }

  const handleDeleteProduct = async (productId) => {
    setSaving(true)
    setError('')
    setStatus('')

    try {
      const response = await fetch(`${API_BASE}/products/${productId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Product delete failed.')
      }

      setStatus('Product deleted.')
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogin = (event) => {
    event.preventDefault()
    setIsLoggedIn(true)
    setStatus('Shop owner login successful.')
    setPage('dashboard')
  }

  const handleContact = (event) => {
    event.preventDefault()
    setStatus('Message saved for project demo.')
    setContactForm({ name: '', email: '', message: '' })
  }

  const renderPage = () => {
    if (page === 'about') {
      return <AboutPage />
    }

    if (page === 'services') {
      return <ServicesPage />
    }

    if (page === 'products') {
      return <ProductsPage products={products} loading={loading} />
    }

    if (page === 'contact') {
      return (
        <ContactPage
          contactForm={contactForm}
          setContactForm={setContactForm}
          onSubmit={handleContact}
        />
      )
    }

    if (page === 'login') {
      return (
        <LoginPage
          loginForm={loginForm}
          setLoginForm={setLoginForm}
          onSubmit={handleLogin}
        />
      )
    }

    if (page === 'dashboard') {
      if (!isLoggedIn) {
        return <LockedDashboard onLogin={() => moveTo('login')} />
      }

      return (
        <DashboardPage
          activeForm={activeForm}
          editingProduct={editingProduct}
          error={error}
          handleCancelEdit={handleCancelEdit}
          handleDeleteProduct={handleDeleteProduct}
          handleEditProduct={handleEditProduct}
          handleProductSubmit={handleProductSubmit}
          handlePurchaseSubmit={handlePurchaseSubmit}
          handleSaleSubmit={handleSaleSubmit}
          handleSupplierSubmit={handleSupplierSubmit}
          loading={loading}
          loadData={loadData}
          metrics={metrics}
          productForm={productForm}
          productOptions={productOptions}
          products={products}
          purchaseForm={purchaseForm}
          purchases={purchases}
          saleForm={saleForm}
          sales={sales}
          saving={saving}
          setActiveForm={setActiveForm}
          setProductForm={setProductForm}
          setPurchaseForm={setPurchaseForm}
          setSaleForm={setSaleForm}
          setSupplierForm={setSupplierForm}
          status={status}
          supplierForm={supplierForm}
          supplierOptions={supplierOptions}
          suppliers={suppliers}
        />
      )
    }

    return <HomePage metrics={metrics} products={products} onStart={() => moveTo('login')} />
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="brand" type="button" onClick={() => moveTo('home')}>
          IMS
        </button>
        <nav className="site-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item}
              className={page === item ? 'active' : ''}
              type="button"
              onClick={() => moveTo(item)}
            >
              {item === 'dashboard' ? 'Shop Dashboard' : titleCase(item)}
            </button>
          ))}
        </nav>
      </header>
      {renderPage()}
    </div>
  )
}

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function HomePage({ metrics, products, onStart }) {
  return (
    <main className="page">
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Level 1(a) Full Stack Project</p>
          <h1>Inventory Management System</h1>
          <p>
            Manage products, suppliers, stock levels, sales, purchases, and low-stock alerts from
            one practical shop-owner dashboard.
          </p>
          <div className="hero-actions">
            <button className="primary" type="button" onClick={onStart}>
              Login to Dashboard
            </button>
          </div>
        </div>
        <div className="hero-board" aria-label="Inventory overview">
          <div>
            <span>Total Products</span>
            <strong>{products.length}</strong>
          </div>
          <div>
            <span>Low Stock Alerts</span>
            <strong>{metrics.lowStockItems.length}</strong>
          </div>
          <div>
            <span>Inventory Value</span>
            <strong>{money.format(metrics.inventoryValue)}</strong>
          </div>
        </div>
      </section>
    </main>
  )
}

function AboutPage() {
  return (
    <main className="page narrow-page">
      <p className="eyebrow">About</p>
      <h1>Built for learning real business CRUD operations</h1>
      <p>
        This project demonstrates how a shop owner can maintain products, supplier details,
        purchases, sales, and dashboard analytics using a MERN-style full-stack application.
      </p>
      <div className="info-grid">
        <article>
          <h2>Frontend</h2>
          <p>React and Vite provide a responsive interface for public pages and dashboard work.</p>
        </article>
        <article>
          <h2>Backend</h2>
          <p>Express and MongoDB handle products, suppliers, sales, purchases, and users.</p>
        </article>
      </div>
    </main>
  )
}

function ServicesPage() {
  return (
    <main className="page">
      <p className="eyebrow">Our Services</p>
      <h1>Inventory workflows covered in this system</h1>
      <section className="cards-grid">
        {services.map((service) => (
          <article className="service-card" key={service.title}>
            <h2>{service.title}</h2>
            <p>{service.body}</p>
          </article>
        ))}
      </section>
    </main>
  )
}

function ProductsPage({ products, loading }) {
  return (
    <main className="page">
      <p className="eyebrow">Our Products</p>
      <h1>Available inventory</h1>
      <section className="cards-grid product-grid">
        {loading && <p>Loading products...</p>}
        {!loading && products.length === 0 && <p>No public products available yet.</p>}
        {products.map((product) => (
          <article className="product-card" key={product._id}>
            <div className="product-mark">{product.name.slice(0, 2).toUpperCase()}</div>
            <h2>{product.name}</h2>
            <p>{product.description || 'Product details will appear here after entry.'}</p>
            <div className="product-meta">
              <span>{money.format(Number(product.price || 0))}</span>
              <strong>{product.stock} in stock</strong>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}

function ContactPage({ contactForm, setContactForm, onSubmit }) {
  return (
    <main className="page form-page">
      <div>
        <p className="eyebrow">Contact</p>
        <h1>Request inventory support</h1>
        <p>Use this demo form for project contact details and future support workflows.</p>
      </div>
      <form className="contact-form" onSubmit={onSubmit}>
        <label>
          Name
          <input
            value={contactForm.name}
            onChange={(event) => setContactForm({ ...contactForm, name: event.target.value })}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={contactForm.email}
            onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })}
            required
          />
        </label>
        <label>
          Message
          <textarea
            value={contactForm.message}
            onChange={(event) => setContactForm({ ...contactForm, message: event.target.value })}
            rows="5"
            required
          />
        </label>
        <button className="primary" type="submit">
          Send Message
        </button>
      </form>
    </main>
  )
}

function LoginPage({ loginForm, setLoginForm, onSubmit }) {
  return (
    <main className="page form-page">
      <div>
        <p className="eyebrow">Login</p>
        <h1>Shop owner access</h1>
        <p>For this project step, login unlocks the dashboard demo without adding auth security yet.</p>
      </div>
      <form className="login-form" onSubmit={onSubmit}>
        <label>
          Email
          <input
            type="email"
            value={loginForm.email}
            onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={loginForm.password}
            onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
            required
          />
        </label>
        <button className="primary" type="submit">
          Open Dashboard
        </button>
      </form>
    </main>
  )
}

function LockedDashboard({ onLogin }) {
  return (
    <main className="page narrow-page locked-page">
      <p className="eyebrow">Dashboard</p>
      <h1>Login required</h1>
      <p>Shop owner tools are available after login.</p>
      <button className="primary" type="button" onClick={onLogin}>
        Go to Login
      </button>
    </main>
  )
}

function DashboardPage(props) {
  const {
    activeForm,
    editingProduct,
    error,
    handleCancelEdit,
    handleDeleteProduct,
    handleEditProduct,
    handleProductSubmit,
    handlePurchaseSubmit,
    handleSaleSubmit,
    handleSupplierSubmit,
    loading,
    loadData,
    metrics,
    productForm,
    productOptions,
    products,
    purchaseForm,
    purchases,
    saleForm,
    sales,
    saving,
    setActiveForm,
    setProductForm,
    setPurchaseForm,
    setSaleForm,
    setSupplierForm,
    status,
    supplierForm,
    supplierOptions,
    suppliers,
  } = props

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Shop Owner Dashboard</p>
          <h1>Stock Management System</h1>
        </div>
        <button className="icon-button" type="button" onClick={loadData} aria-label="Refresh data">
          R
        </button>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {status && <div className="alert alert-success">{status}</div>}

      <section className="metrics" aria-label="Inventory summary">
        <article>
          <span>Total SKUs</span>
          <strong>{products.length}</strong>
        </article>
        <article>
          <span>Stock Value</span>
          <strong>{money.format(metrics.inventoryValue)}</strong>
        </article>
        <article>
          <span>Low Stock</span>
          <strong>{metrics.lowStockItems.length}</strong>
        </article>
        <article>
          <span>Sales Value</span>
          <strong>{money.format(metrics.salesValue)}</strong>
        </article>
      </section>

      <section className="workspace">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Product Catalog</h2>
              <p>{loading ? 'Loading inventory...' : `${products.length} products tracked`}</p>
            </div>
          </div>
          <InventoryTable
            products={products}
            loading={loading}
            saving={saving}
            handleDeleteProduct={handleDeleteProduct}
            handleEditProduct={handleEditProduct}
          />
        </div>

        <InventoryForms
          activeForm={activeForm}
          editingProduct={editingProduct}
          handleCancelEdit={handleCancelEdit}
          handleProductSubmit={handleProductSubmit}
          handlePurchaseSubmit={handlePurchaseSubmit}
          handleSaleSubmit={handleSaleSubmit}
          handleSupplierSubmit={handleSupplierSubmit}
          productForm={productForm}
          productOptions={productOptions}
          products={products}
          purchaseForm={purchaseForm}
          saving={saving}
          saleForm={saleForm}
          setActiveForm={setActiveForm}
          setProductForm={setProductForm}
          setPurchaseForm={setPurchaseForm}
          setSaleForm={setSaleForm}
          setSupplierForm={setSupplierForm}
          supplierForm={supplierForm}
          supplierOptions={supplierOptions}
          suppliers={suppliers}
        />
      </section>

      <section className="activity-grid">
        <ReportPanel metrics={metrics} />
        <ActivityPanel sales={sales} purchases={purchases} />
      </section>
    </main>
  )
}

function InventoryTable({ products, loading, saving, handleDeleteProduct, handleEditProduct }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Supplier</th>
            <th>Price</th>
            <th>Stock</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {!loading && products.length === 0 && (
            <tr>
              <td colSpan="5" className="empty">
                No products yet.
              </td>
            </tr>
          )}
          {products.map((product) => (
            <tr key={product._id}>
              <td>
                <strong>{product.name}</strong>
                <span>{product.description || 'No description'}</span>
              </td>
              <td>{product.supplier?.name || 'Unassigned'}</td>
              <td>{money.format(Number(product.price || 0))}</td>
              <td>
                <span className={Number(product.stock) <= 10 ? 'badge warning' : 'badge'}>
                  {product.stock}
                </span>
              </td>
              <td>
                <div className="row-actions">
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => handleEditProduct(product)}
                    disabled={saving}
                    aria-label={`Edit ${product.name}`}
                  >
                    E
                  </button>
                  <button
                    className="icon-button danger"
                    type="button"
                    onClick={() => handleDeleteProduct(product._id)}
                    disabled={saving}
                    aria-label={`Delete ${product.name}`}
                  >
                    X
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function InventoryForms(props) {
  const {
    activeForm,
    editingProduct,
    handleCancelEdit,
    handleProductSubmit,
    handlePurchaseSubmit,
    handleSaleSubmit,
    handleSupplierSubmit,
    productForm,
    productOptions,
    products,
    purchaseForm,
    saving,
    saleForm,
    setActiveForm,
    setProductForm,
    setPurchaseForm,
    setSaleForm,
    setSupplierForm,
    supplierForm,
    supplierOptions,
    suppliers,
  } = props

  return (
    <aside className="panel form-panel">
      <div className="tabs" role="tablist" aria-label="Create records">
        {['product', 'supplier', 'sale', 'purchase'].map((tab) => (
          <button
            key={tab}
            className={activeForm === tab ? 'active' : ''}
            type="button"
            onClick={() => setActiveForm(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeForm === 'product' && (
        <form onSubmit={handleProductSubmit}>
          <h2>{editingProduct ? 'Update Product' : 'Add Product'}</h2>
          <label>
            Name
            <input
              value={productForm.name}
              onChange={(event) => setProductForm({ ...productForm, name: event.target.value })}
              required
            />
          </label>
          <label>
            Description
            <textarea
              value={productForm.description}
              onChange={(event) =>
                setProductForm({ ...productForm, description: event.target.value })
              }
              rows="3"
            />
          </label>
          <div className="field-row">
            <label>
              Price
              <input
                type="number"
                min="0"
                value={productForm.price}
                onChange={(event) => setProductForm({ ...productForm, price: event.target.value })}
                required
              />
            </label>
            <label>
              Stock
              <input
                type="number"
                min="0"
                value={productForm.stock}
                onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })}
                required
              />
            </label>
          </div>
          <label>
            Supplier
            <select
              value={productForm.supplier}
              onChange={(event) => setProductForm({ ...productForm, supplier: event.target.value })}
            >
              <option value="">None</option>
              {supplierOptions}
            </select>
          </label>
          <div className="form-actions">
            <button className="primary" type="submit" disabled={saving}>
              {editingProduct ? 'Update Product' : 'Save Product'}
            </button>
            {editingProduct && (
              <button className="secondary" type="button" onClick={handleCancelEdit} disabled={saving}>
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {activeForm === 'supplier' && (
        <form onSubmit={handleSupplierSubmit}>
          <h2>Add Supplier</h2>
          <label>
            Name
            <input
              value={supplierForm.name}
              onChange={(event) => setSupplierForm({ ...supplierForm, name: event.target.value })}
              required
            />
          </label>
          <label>
            Contact
            <input
              value={supplierForm.contact}
              onChange={(event) =>
                setSupplierForm({ ...supplierForm, contact: event.target.value })
              }
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={supplierForm.email}
              onChange={(event) => setSupplierForm({ ...supplierForm, email: event.target.value })}
            />
          </label>
          <label>
            Address
            <textarea
              value={supplierForm.address}
              onChange={(event) =>
                setSupplierForm({ ...supplierForm, address: event.target.value })
              }
              rows="3"
            />
          </label>
          <button className="primary" type="submit" disabled={saving}>
            Save Supplier
          </button>
        </form>
      )}

      {activeForm === 'sale' && (
        <form onSubmit={handleSaleSubmit}>
          <h2>Sell Details</h2>
          <label>
            Product
            <select
              value={saleForm.product}
              onChange={(event) => setSaleForm({ ...saleForm, product: event.target.value })}
              required
            >
              <option value="">Select product</option>
              {productOptions}
            </select>
          </label>
          <label>
            Quantity
            <input
              type="number"
              min="1"
              value={saleForm.quantity}
              onChange={(event) => setSaleForm({ ...saleForm, quantity: event.target.value })}
              required
            />
          </label>
          <label>
            Customer
            <input
              value={saleForm.customerName}
              onChange={(event) => setSaleForm({ ...saleForm, customerName: event.target.value })}
            />
          </label>
          <button className="primary" type="submit" disabled={saving || products.length === 0}>
            Save Sale
          </button>
        </form>
      )}

      {activeForm === 'purchase' && (
        <form onSubmit={handlePurchaseSubmit}>
          <h2>Purchase Details</h2>
          <label>
            Product
            <select
              value={purchaseForm.product}
              onChange={(event) =>
                setPurchaseForm({ ...purchaseForm, product: event.target.value })
              }
              required
            >
              <option value="">Select product</option>
              {productOptions}
            </select>
          </label>
          <label>
            Supplier
            <select
              value={purchaseForm.supplier}
              onChange={(event) =>
                setPurchaseForm({ ...purchaseForm, supplier: event.target.value })
              }
              required
            >
              <option value="">Select supplier</option>
              {supplierOptions}
            </select>
          </label>
          <label>
            Quantity
            <input
              type="number"
              min="1"
              value={purchaseForm.quantity}
              onChange={(event) =>
                setPurchaseForm({ ...purchaseForm, quantity: event.target.value })
              }
              required
            />
          </label>
          <button
            className="primary"
            type="submit"
            disabled={saving || products.length === 0 || suppliers.length === 0}
          >
            Save Purchase
          </button>
        </form>
      )}
    </aside>
  )
}

function ReportPanel({ metrics }) {
  return (
    <div className="panel report-panel">
      <h2>Reports</h2>
      <ul className="activity-list">
        <li>
          <span>Units sold</span>
          <strong>{metrics.unitsSold}</strong>
        </li>
        <li>
          <span>Units purchased</span>
          <strong>{metrics.unitsPurchased}</strong>
        </li>
        <li>
          <span>Low-stock products</span>
          <strong>{metrics.lowStockItems.length}</strong>
        </li>
      </ul>
      <div className="low-stock-list">
        <h3>Low-stock alerts</h3>
        {metrics.lowStockItems.length === 0 && <p>No alerts right now.</p>}
        {metrics.lowStockItems.map((product) => (
          <span key={product._id}>{product.name}</span>
        ))}
      </div>
    </div>
  )
}

function ActivityPanel({ sales, purchases }) {
  return (
    <div className="panel">
      <h2>Recent Business Activity</h2>
      <ul className="activity-list">
        {sales.slice(0, 3).map((sale) => (
          <li key={sale._id}>
            <span>{sale.product?.name || 'Product'}</span>
            <strong>{sale.quantity} sold</strong>
          </li>
        ))}
        {purchases.slice(0, 3).map((purchase) => (
          <li key={purchase._id}>
            <span>{purchase.product?.name || 'Product'}</span>
            <strong>{purchase.quantity} purchased{purchase.supplier?.name ? ` from ${purchase.supplier.name}` : ''}</strong>
          </li>
        ))}
        {sales.length === 0 && purchases.length === 0 && (
          <li className="empty-item">No sales or purchases recorded.</li>
        )}
      </ul>
    </div>
  )
}

export default App
