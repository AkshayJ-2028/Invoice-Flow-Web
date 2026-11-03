import { useEffect, useState } from 'react'
import { clearSession, getName, getToken, setUnauthorizedHandler } from './api'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Invoices from './pages/Invoices.jsx'
import Clients from './pages/Clients.jsx'
import Products from './pages/Products.jsx'

const NAV = [
  ['dashboard', '📊', 'Dashboard'],
  ['invoices', '🧾', 'Invoices'],
  ['clients', '👥', 'Clients'],
  ['products', '📦', 'Products']
]

// Very small router: the page name lives in the URL after the #  (for example  #/invoices)
function useRoute() {
  const read = () => window.location.hash.replace('#/', '') || 'dashboard'
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const onChange = () => setRoute(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export default function App() {
  const [session, setSession] = useState(() => (getToken() ? { name: getName() || 'User' } : null))
  const route = useRoute()
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('theme', theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  // If the backend says the token is no longer valid, go back to the login page.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession()
      setSession(null)
    })
  }, [])

  if (!session) return <Login onLogin={setSession} />

  const [page, sub] = route.split('/')
  const current = NAV.some(n => n[0] === page) ? page : 'dashboard'
  const title = NAV.find(n => n[0] === current)[2]

  function logout() {
    clearSession()
    setSession(null)
  }

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <span className="logo">IF</span>
          <div>
            <b>Invoice Flow</b>
            <small>Smart billing</small>
          </div>
        </div>
        <nav className="nav">
          {NAV.map(([key, icon, label]) => (
            <a key={key} href={'#/' + key} className={current === key ? 'active' : ''}>
              {icon} {label}
            </a>
          ))}
        </nav>
        <div className="side-foot">
          <div className="user">
            <span className="avatar">{session.name.charAt(0).toUpperCase()}</span>
            <span>{session.name}</span>
          </div>
          <div className="foot-btns">
            <button className="ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button className="ghost" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="content">
        <div className="topbar">
          <h1>{title}</h1>
          {(current === 'dashboard' || current === 'invoices') && (
            <a className="btn" href="#/invoices/new">
              + New invoice
            </a>
          )}
        </div>

        {current === 'dashboard' && <Dashboard />}
        {current === 'invoices' && <Invoices openNew={sub === 'new'} />}
        {current === 'clients' && <Clients />}
        {current === 'products' && <Products />}
      </div>
    </div>
  )
}
