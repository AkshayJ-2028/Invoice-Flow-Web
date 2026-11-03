import { useEffect, useState } from 'react'
import { api } from '../api'
import { inr, isLate, monthLabel, STATUSES, STATUS_COLORS } from '../utils'
import { Empty, Tag, useToast } from '../ui.jsx'

export default function Dashboard() {
  const toast = useToast()
  const [data, setData] = useState(null)

  useEffect(() => {
    Promise.all([api('/api/dashboard/summary'), api('/api/invoices')])
      .then(([summary, list]) => setData({ summary, list }))
      .catch(e => toast(e.message))
  }, [toast])

  if (!data) {
    return (
      <div className="stats">
        {[1, 2, 3, 4, 5, 6].map(n => (
          <div key={n} className="card skeleton" />
        ))}
      </div>
    )
  }

  const { summary: s, list } = data

  const cards = [
    ['Total billed', inr(s.totalAmount), '#4f46e5', '💰'],
    ['Paid', inr(s.paidAmount), '#16a34a', '✅'],
    ['Pending (sent)', inr(s.pendingAmount), '#d97706', '⏳'],
    ['Overdue', inr(s.overdueAmount), '#dc2626', '⚠️'],
    ['Invoices', s.totalInvoices, '#0ea5e9', '🧾'],
    ['Drafts', s.draftCount, '#64748b', '📝']
  ]

  // billed amount per month (last 6 months, cancelled invoices ignored)
  const byMonth = {}
  list.forEach(i => {
    if (i.status === 'CANCELLED') return
    const key = (i.issueDate || '').slice(0, 7)
    if (key) byMonth[key] = (byMonth[key] || 0) + Number(i.grandTotal || 0)
  })
  const months = Object.keys(byMonth).sort().slice(-6)
  const max = Math.max(1, ...months.map(m => byMonth[m]))

  // invoice count per status, for the donut chart
  const counts = {}
  list.forEach(i => {
    counts[i.status] = (counts[i.status] || 0) + 1
  })
  let acc = 0
  const stops = STATUSES.filter(st => counts[st]).map(st => {
    const from = (acc / list.length) * 100
    acc += counts[st]
    return `${STATUS_COLORS[st]} ${from}% ${(acc / list.length) * 100}%`
  })

  return (
    <>
      <div className="stats">
        {cards.map(([label, value, color, icon]) => (
          <div key={label} className="card stat" style={{ '--c': color }}>
            <div className="ico">{icon}</div>
            <div>
              <div className="v">{value}</div>
              <div className="l">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="row2">
        <div className="card">
          <h3>Billed per month</h3>
          {months.length ? (
            <div className="chart">
              {months.map(m => (
                <div key={m} className="bar">
                  <div className="bv">{inr(byMonth[m]).replace(/\.00$/, '')}</div>
                  <div className="track">
                    <div className="fill" style={{ height: Math.max(3, (byMonth[m] / max) * 100) + '%' }} />
                  </div>
                  <div className="bl">{monthLabel(m)}</div>
                </div>
              ))}
            </div>
          ) : (
            <Empty>No invoices yet. Create your first one!</Empty>
          )}
        </div>

        <div className="card">
          <h3>Invoices by status</h3>
          {list.length ? (
            <div className="donut-wrap">
              <div className="donut" data-total={list.length} style={{ background: `conic-gradient(${stops.join(',')})` }} />
              <div className="legend">
                {STATUSES.filter(st => counts[st]).map(st => (
                  <span key={st}>
                    <i style={{ background: STATUS_COLORS[st] }} />
                    {st} ({counts[st]})
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <Empty>Nothing to show yet</Empty>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Recent invoices</h3>
        <div className="scroll">
          {list.length ? (
            <table>
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Client</th>
                  <th>Due</th>
                  <th className="num">Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {list.slice(0, 5).map(i => (
                  <tr key={i.id}>
                    <td>
                      <b>{i.invoiceNumber}</b>
                    </td>
                    <td>{i.clientName}</td>
                    <td className={isLate(i) ? 'late' : ''}>{i.dueDate}</td>
                    <td className="num">{inr(i.grandTotal)}</td>
                    <td>
                      <Tag status={i.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty>No invoices yet</Empty>
          )}
        </div>
      </div>
    </>
  )
}
