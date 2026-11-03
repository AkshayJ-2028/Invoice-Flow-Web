import { useState } from 'react'
import { api, setSession } from '../api'

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const register = mode === 'register'

  const change = key => e => setForm({ ...form, [key]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const body = { email: form.email.trim(), password: form.password }
      if (register) body.name = form.name.trim()
      const data = await api('/api/auth/' + mode, { method: 'POST', body })
      setSession(data.token, data.name)
      onLogin({ name: data.name })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <div className="hero">
        <span className="logo">IF</span>
        <h1>Invoice Flow</h1>
        <p>
          Smart billing for small businesses. Create invoices in seconds, track payments, and download
          professional PDFs.
        </p>
        <ul>
          <li>&#10003; Clients, products and tax handled for you</li>
          <li>&#10003; Automatic totals and invoice numbers</li>
          <li>&#10003; One-click PDF download</li>
        </ul>
      </div>
      <div className="authbox">
        <form className="authcard" onSubmit={submit}>
          <h2>{register ? 'Create your account' : 'Welcome back'}</h2>
          <div className="muted">{register ? 'Start billing in a few minutes' : 'Log in to your billing workspace'}</div>

          {register && (
            <>
              <label>Name</label>
              <input value={form.name} onChange={change('name')} autoComplete="name" />
            </>
          )}
          <label>Email</label>
          <input type="email" value={form.email} onChange={change('email')} autoComplete="email" />
          <label>Password (min 6 characters)</label>
          <input type="password" value={form.password} onChange={change('password')} autoComplete="current-password" />

          <button className="btn full" type="submit" disabled={busy}>
            {busy ? 'Please wait...' : register ? 'Register' : 'Login'}
          </button>
          <button
            type="button"
            className="link"
            onClick={() => {
              setMode(register ? 'login' : 'register')
              setError('')
            }}
          >
            {register ? 'Already have an account? Login' : 'New here? Create an account'}
          </button>
          <div className="err">{error}</div>
        </form>
      </div>
    </div>
  )
}
