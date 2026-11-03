export const STATUSES = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']

export const STATUS_COLORS = {
  DRAFT: '#94a3b8',
  SENT: '#3b82f6',
  PAID: '#22c55e',
  OVERDUE: '#ef4444',
  CANCELLED: '#f59e0b'
}

// Indian rupee formatting, for example 11700 -> ₹11,700.00
export const inr = n =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const pad = n => String(n).padStart(2, '0')
export const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const plusDays = n => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return isoDate(d)
}

export const monthLabel = key => {
  const [y, m] = key.split('-')
  return new Date(+y, +m - 1, 1).toLocaleString('en', { month: 'short', year: '2-digit' })
}

// A SENT invoice whose due date has passed.
export const isLate = invoice =>
  invoice.status === 'SENT' && invoice.dueDate && invoice.dueDate < isoDate(new Date())
