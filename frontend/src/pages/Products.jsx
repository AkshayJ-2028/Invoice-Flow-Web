import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import { inr } from '../utils'
import { Empty, Field, Modal, useToast } from '../ui.jsx'

export default function Products() {
  const toast = useToast()
  const [list, setList] = useState(null)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    try {
      setList(await api('/api/products'))
    } catch (e) {
      toast(e.message)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  async function remove(product) {
    if (!window.confirm('Delete product ' + product.name + '?')) return
    try {
      await api('/api/products/' + product.id, { method: 'DELETE' })
      toast('Product deleted', true)
      load()
    } catch (e) {
      toast(e.message)
    }
  }

  const shown = (list || []).filter(p => (p.name + ' ' + (p.description || '')).toLowerCase().includes(query.toLowerCase()))

  return (
    <>
      <div className="toolbar">
        <input placeholder="Search products..." value={query} onChange={e => setQuery(e.target.value)} />
        <button className="btn" onClick={() => setEditing({})}>
          + Add product
        </button>
      </div>

      <div className="card scroll">
        {!list ? (
          <Empty>Loading...</Empty>
        ) : shown.length === 0 ? (
          <Empty>No products found. Click "+ Add product".</Empty>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th className="num">Unit price</th>
                <th className="num">Tax</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shown.map(p => (
                <tr key={p.id}>
                  <td>
                    <b>{p.name}</b>
                  </td>
                  <td>{p.description}</td>
                  <td className="num">{inr(p.unitPrice)}</td>
                  <td className="num">{p.taxPercent}%</td>
                  <td>
                    <div className="acts">
                      <button className="btn light small" onClick={() => setEditing(p)}>
                        Edit
                      </button>
                      <button className="btn danger small" onClick={() => remove(p)}>
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

      {editing && (
        <ProductForm
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
          }}
        />
      )}
    </>
  )
}

function ProductForm({ product, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({
    name: product.name || '',
    description: product.description || '',
    unitPrice: product.unitPrice ?? '',
    taxPercent: product.taxPercent ?? 18
  })
  const change = key => e => setForm({ ...form, [key]: e.target.value })

  async function save() {
    const price = parseFloat(form.unitPrice)
    if (!form.name.trim() || isNaN(price)) return toast('Name and unit price are required')
    try {
      await api(product.id ? '/api/products/' + product.id : '/api/products', {
        method: product.id ? 'PUT' : 'POST',
        body: {
          name: form.name.trim(),
          description: form.description.trim(),
          unitPrice: price,
          taxPercent: parseFloat(form.taxPercent) || 0
        }
      })
      toast('Product saved', true)
      onSaved()
    } catch (e) {
      toast(e.message)
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2>{product.id ? 'Edit product' : 'Add product / service'}</h2>
      <Field label="Name *">
        <input value={form.name} onChange={change('name')} />
      </Field>
      <Field label="Description">
        <input value={form.description} onChange={change('description')} />
      </Field>
      <div className="grid2">
        <Field label={'Unit price (₹) *'}>
          <input type="number" min="0" step="0.01" value={form.unitPrice} onChange={change('unitPrice')} />
        </Field>
        <Field label="Tax %">
          <input type="number" min="0" step="0.01" value={form.taxPercent} onChange={change('taxPercent')} />
        </Field>
      </div>
      <div className="actions">
        <button className="btn light" onClick={onClose}>
          Cancel
        </button>
        <button className="btn" onClick={save}>
          Save
        </button>
      </div>
    </Modal>
  )
}
