import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import { Empty, Field, Modal, useToast } from '../ui.jsx'

export default function Clients() {
  const toast = useToast()
  const [list, setList] = useState(null)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null) // null = closed, {} = new client, {id...} = edit

  const load = useCallback(async () => {
    try {
      setList(await api('/api/clients'))
    } catch (e) {
      toast(e.message)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  async function remove(client) {
    if (!window.confirm('Delete client ' + client.name + '?')) return
    try {
      await api('/api/clients/' + client.id, { method: 'DELETE' })
      toast('Client deleted', true)
      load()
    } catch (e) {
      toast(e.message)
    }
  }

  const shown = (list || []).filter(c =>
    (c.name + ' ' + (c.email || '') + ' ' + (c.phone || '')).toLowerCase().includes(query.toLowerCase())
  )

  return (
    <>
      <div className="toolbar">
        <input placeholder="Search clients..." value={query} onChange={e => setQuery(e.target.value)} />
        <button className="btn" onClick={() => setEditing({})}>
          + Add client
        </button>
      </div>

      <div className="card scroll">
        {!list ? (
          <Empty>Loading...</Empty>
        ) : shown.length === 0 ? (
          <Empty>No clients found. Click "+ Add client".</Empty>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>GST</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shown.map(c => (
                <tr key={c.id}>
                  <td>
                    <b>{c.name}</b>
                  </td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                  <td>{c.address}</td>
                  <td>{c.gstNumber}</td>
                  <td>
                    <div className="acts">
                      <button className="btn light small" onClick={() => setEditing(c)}>
                        Edit
                      </button>
                      <button className="btn danger small" onClick={() => remove(c)}>
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
        <ClientForm
          client={editing}
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

function ClientForm({ client, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({
    name: client.name || '',
    email: client.email || '',
    phone: client.phone || '',
    address: client.address || '',
    gstNumber: client.gstNumber || ''
  })
  const change = key => e => setForm({ ...form, [key]: e.target.value })

  async function save() {
    if (!form.name.trim()) return toast('Name is required')
    try {
      await api(client.id ? '/api/clients/' + client.id : '/api/clients', {
        method: client.id ? 'PUT' : 'POST',
        body: form
      })
      toast('Client saved', true)
      onSaved()
    } catch (e) {
      toast(e.message)
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2>{client.id ? 'Edit client' : 'Add client'}</h2>
      <Field label="Name *">
        <input value={form.name} onChange={change('name')} />
      </Field>
      <div className="grid2">
        <Field label="Email">
          <input value={form.email} onChange={change('email')} />
        </Field>
        <Field label="Phone">
          <input value={form.phone} onChange={change('phone')} />
        </Field>
      </div>
      <Field label="Address">
        <input value={form.address} onChange={change('address')} />
      </Field>
      <Field label="GST number">
        <input value={form.gstNumber} onChange={change('gstNumber')} />
      </Field>
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
