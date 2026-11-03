import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, downloadPdf } from '../api'
import { inr, isLate, plusDays, STATUSES } from '../utils'
import { Empty, Field, Modal, Tag, useToast } from '../ui.jsx'

export default function Invoices({ openNew }) {
  const toast = useToast()
  const [list, setList] = useState(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('')
  const [viewing, setViewing] = useState(null)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    try {
      setList(await api('/api/invoices'))
    } catch (e) {
      toast(e.message)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  // The "+ New invoice" button changes the address to #/invoices/new
  useEffect(() => {
    if (openNew) setCreating(true)
  }, [openNew])

  function closeCreate() {
    setCreating(false)
    if (window.location.hash.endsWith('/new')) window.location.hash = '#/invoices'
  }

  async function changeStatus(invoice, value) {
    try {
      await api(`/api/invoices/${invoice.id}/status?value=${value}`, { method: 'PATCH' })
      toast('Status updated to ' + value, true)
      load()
    } catch (e) {
      toast(e.message)
    }
  }

  async function remove(invoice) {
    if (!window.confirm('Delete invoice ' + invoice.invoiceNumber + '?')) return
    try {
      await api('/api/invoices/' + invoice.id, { method: 'DELETE' })
      toast('Invoice deleted', true)
      load()
    } catch (e) {
      toast(e.message)
    }
  }

  async function pdf(invoice) {
    try {
      await downloadPdf(invoice)
    } catch (e) {
      toast(e.message)
    }
  }

  const shown = (list || []).filter(
    i => (!filter || i.status === filter) && (i.invoiceNumber + ' ' + i.clientName).toLowerCase().includes(query.toLowerCase())
  )

  return (
    <>
      <div className="toolbar">
        <input placeholder="Search by invoice number or client..." value={query} onChange={e => setQuery(e.target.value)} />
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map(s => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="card scroll">
        {!list ? (
          <Empty>Loading...</Empty>
        ) : shown.length === 0 ? (
          <Empty>No invoices found. Click "+ New invoice".</Empty>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Number</th>
                <th>Client</th>
                <th>Issued</th>
                <th>Due</th>
                <th className="num">Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(i => (
                <tr key={i.id}>
                  <td>
                    <b>{i.invoiceNumber}</b>
                  </td>
                  <td>{i.clientName}</td>
                  <td>{i.issueDate}</td>
                  <td className={isLate(i) ? 'late' : ''}>{i.dueDate}</td>
                  <td className="num">{inr(i.grandTotal)}</td>
                  <td>
                    <Tag status={i.status} />
                  </td>
                  <td>
                    <div className="acts">
                      <select value={i.status} onChange={e => changeStatus(i, e.target.value)}>
                        {STATUSES.map(s => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                      <button className="btn light small" onClick={() => setViewing(i)}>
                        View
                      </button>
                      <button className="btn small" onClick={() => pdf(i)}>
                        PDF
                      </button>
                      <button className="btn danger small" onClick={() => remove(i)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewing && <InvoiceView invoice={viewing} onClose={() => setViewing(null)} onPdf={() => pdf(viewing)} />}
      {creating && (
        <InvoiceForm
          onClose={closeCreate}
          onCreated={() => {
            closeCreate()
            load()
          }}
        />
      )}
    </>
  )
}

/* ---------- invoice details window ---------- */
function InvoiceView({ invoice: i, onClose, onPdf }) {
  return (
    <Modal onClose={onClose} wide>
      <h2>
        {i.invoiceNumber} &nbsp;<Tag status={i.status} />
      </h2>
      <div className="muted">
        Billed to <b>{i.clientName}</b> &middot; Issued {i.issueDate} &middot; Due {i.dueDate}
      </div>
      <div className="scroll" style={{ marginTop: 14 }}>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th className="num">Qty</th>
              <th className="num">Price</th>
              <th className="num">Tax</th>
              <th className="num">Total</th>
            </tr>
          </thead>
          <tbody>
            {(i.items || []).map(t => (
              <tr key={t.id}>
                <td>{t.description}</td>
                <td className="num">{t.quantity}</td>
                <td className="num">{inr(t.unitPrice)}</td>
                <td className="num">{t.taxPercent}%</td>
                <td className="num">{inr(t.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="totals">
        <div>
          <span>Subtotal</span>
          <span>{inr(i.subtotal)}</span>
        </div>
        <div>
          <span>Tax</span>
          <span>{inr(i.taxTotal)}</span>
        </div>
        <div>
          <span>Discount</span>
          <span>- {inr(i.discount)}</span>
        </div>
        <div className="grand">
          <span>Grand total</span>
          <span>{inr(i.grandTotal)}</span>
        </div>
      </div>
      {i.notes && <div className="muted" style={{ marginTop: 12 }}>Notes: {i.notes}</div>}
      <div className="actions">
        <button className="btn light" onClick={onClose}>
          Close
        </button>
        <button className="btn" onClick={onPdf}>
          Download PDF
        </button>
      </div>
    </Modal>
  )
}

/* ---------- new invoice window ---------- */
function InvoiceForm({ onClose, onCreated }) {
  const toast = useToast()
  const [clients, setClients] = useState(null)
  const [products, setProducts] = useState([])
  const [clientId, setClientId] = useState('')
  const [due, setDue] = useState(plusDays(15))
  const [rows, setRows] = useState([])
  const [discount, setDiscount] = useState('0')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    Promise.all([api('/api/clients'), api('/api/products')])
      .then(([c, p]) => {
        setClients(c)
        setProducts(p)
        if (c[0]) setClientId(String(c[0].id))
        if (p[0]) setRows([{ productId: String(p[0].id), quantity: '1' }])
      })
      .catch(e => toast(e.message))
  }, [toast])

  // live totals, calculated the same way as the backend
  const totals = useMemo(() => {
    let subtotal = 0
    let tax = 0
    rows.forEach(r => {
      const p = products.find(x => String(x.id) === r.productId)
      const qty = parseInt(r.quantity) || 0
      if (p) {
        const base = Number(p.unitPrice) * qty
        subtotal += base
        tax += (base * Number(p.taxPercent || 0)) / 100
      }
    })
    const disc = parseFloat(discount) || 0
    return { subtotal, tax, disc, total: subtotal + tax - disc }
  }, [rows, products, discount])

  const updateRow = (index, patch) => setRows(rows.map((r, n) => (n === index ? { ...r, ...patch } : r)))

  async function submit() {
    if (rows.length === 0) return toast('Add at least one item')
    if (rows.some(r => (parseInt(r.quantity) || 0) < 1)) return toast('Quantity must be at least 1')
    if (totals.disc < 0) return toast('Discount cannot be negative')
    setBusy(true)
    try {
      await api('/api/invoices', {
        method: 'POST',
        body: {
          clientId: parseInt(clientId),
          dueDate: due || null,
          discount: totals.disc,
          notes,
          items: rows.map(r => ({ productId: parseInt(r.productId), quantity: parseInt(r.quantity) }))
        }
      })
      toast('Invoice created', true)
      onCreated()
    } catch (e) {
      toast(e.message)
      setBusy(false)
    }
  }

  if (clients && (clients.length === 0 || products.length === 0)) {
    return (
      <Modal onClose={onClose}>
        <h2>New invoice</h2>
        <p className="muted">
          You need at least one client and one product first. <a href="#/clients" onClick={onClose}>Add a client</a> or{' '}
          <a href="#/products" onClick={onClose}>add a product</a>.
        </p>
        <div className="actions">
          <button className="btn light" onClick={onClose}>
            Close
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal onClose={onClose} wide>
      <h2>New invoice</h2>
      {!clients ? (
        <Empty>Loading...</Empty>
      ) : (
        <>
          <div className="grid2">
            <Field label="Client">
              <select value={clientId} onChange={e => setClientId(e.target.value)}>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Due date">
              <input type="date" value={due} onChange={e => setDue(e.target.value)} />
            </Field>
          </div>

          <label>Items</label>
          {rows.map((r, n) => (
            <div className="item-row" key={n}>
              <select value={r.productId} onChange={e => updateRow(n, { productId: e.target.value })}>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({inr(p.unitPrice)}, {p.taxPercent}% tax)
                  </option>
                ))}
              </select>
              <input type="number" min="1" value={r.quantity} onChange={e => updateRow(n, { quantity: e.target.value })} />
              <button className="btn danger small" onClick={() => setRows(rows.filter((_, k) => k !== n))}>
                X
              </button>
            </div>
          ))}
          <button
            className="btn light small"
            onClick={() => setRows([...rows, { productId: String(products[0].id), quantity: '1' }])}
          >
            + Add item
          </button>

          <div className="grid2">
            <Field label={'Discount (₹)'}>
              <input type="number" min="0" step="0.01" value={discount} onChange={e => setDiscount(e.target.value)} />
            </Field>
            <Field label="Notes">
              <input placeholder="Optional" value={notes} onChange={e => setNotes(e.target.value)} />
            </Field>
          </div>

          <div className="totals">
            <div>
              <span>Subtotal</span>
              <span>{inr(totals.subtotal)}</span>
            </div>
            <div>
              <span>Tax</span>
              <span>{inr(totals.tax)}</span>
            </div>
            <div>
              <span>Discount</span>
              <span>- {inr(totals.disc)}</span>
            </div>
            <div className="grand">
              <span>Total</span>
              <span>{inr(totals.total)}</span>
            </div>
          </div>

          <div className="actions">
            <button className="btn light" onClick={onClose}>
              Cancel
            </button>
            <button className="btn" onClick={submit} disabled={busy}>
              {busy ? 'Saving...' : 'Create invoice'}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}
