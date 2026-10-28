const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const customerFallback = {
  customer: { name: 'Maya Thompson', member_since: '2023-04-18T00:00:00Z' },
  summary: {
    active_loans: 1,
    outstanding_balance: 12480,
    next_payment: 582,
    next_payment_date: new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10),
    applications: 2,
  },
  applications: [
    { id: 1048, purpose: 'Home improvement', requested_amount: 18000, status: 'approved', decision: 'Approved', risk_band: 'Low', created_at: '2026-10-16T09:20:00Z' },
    { id: 986, purpose: 'Debt consolidation', requested_amount: 9500, status: 'funded', decision: 'Approved', risk_band: 'Low', created_at: '2025-06-12T13:14:00Z' },
  ],
  loans: [
    { id: 1, account_number: 'CS-2847-1930', principal: 18000, outstanding_balance: 12480, monthly_emi: 582, interest_rate: 10.8, remaining_term_months: 23, next_payment_date: new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10), status: 'active' },
  ],
}

const adminFallback = {
  summary: { customers: 12842, applications: 1847, pending_review: 63, approval_rate: 0.684, portfolio_outstanding: 247600000 },
  status_distribution: { approved: 1263, review: 63, rejected: 408, funded: 113 },
  risk_distribution: { Low: 941, Moderate: 498, High: 408 },
  model_status: { classification: true, regression: true, segmentation: true, repayment: true },
  applications: [
    { id: 3018, customer: 'Elena Vargas', email: 'elena.v@example.com', purpose: 'Business expansion', requested_amount: 72000, affordable_amount: 61500, status: 'review', decision: 'Manual Review', risk_band: 'Moderate', confidence: .74, created_at: '2026-10-28T08:40:00Z' },
    { id: 3017, customer: 'Marcus Lee', email: 'marcus.l@example.com', purpose: 'Home improvement', requested_amount: 24000, affordable_amount: 28100, status: 'approved', decision: 'Approved', risk_band: 'Low', confidence: .93, created_at: '2026-10-28T08:12:00Z' },
    { id: 3016, customer: 'Nora Bennett', email: 'nora.b@example.com', purpose: 'Debt consolidation', requested_amount: 18500, affordable_amount: 12200, status: 'review', decision: 'Manual Review', risk_band: 'Moderate', confidence: .68, created_at: '2026-10-28T07:56:00Z' },
    { id: 3015, customer: 'Owen Patel', email: 'owen.p@example.com', purpose: 'Vehicle', requested_amount: 36000, affordable_amount: 14200, status: 'rejected', decision: 'Rejected', risk_band: 'High', confidence: .91, created_at: '2026-10-28T07:20:00Z' },
    { id: 3014, customer: 'Amara Johnson', email: 'amara.j@example.com', purpose: 'Education', requested_amount: 28000, affordable_amount: 31000, status: 'approved', decision: 'Approved', risk_band: 'Low', confidence: .89, created_at: '2026-10-27T17:42:00Z' },
  ],
}

async function request(path, options = {}) {
  const token = localStorage.getItem('cedarstone_token')
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail || 'The request could not be completed.')
  }
  return response.json()
}

export async function login(email, password) {
  try {
    const data = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
    localStorage.setItem('cedarstone_token', data.access_token)
    localStorage.setItem('cedarstone_user', JSON.stringify(data.user))
    return data.user
  } catch (error) {
    const demos = {
      'maya@cedarstone.demo': { id: 1, full_name: 'Maya Thompson', email, role: 'customer' },
      'admin@cedarstone.demo': { id: 2, full_name: 'Daniel Reed', email, role: 'admin' },
    }
    if (demos[email] && ((email.startsWith('maya') && password === 'Customer123!') || (email.startsWith('admin') && password === 'Admin123!'))) {
      localStorage.setItem('cedarstone_token', 'demo-session')
      localStorage.setItem('cedarstone_user', JSON.stringify(demos[email]))
      return demos[email]
    }
    throw error
  }
}

export const logout = () => {
  localStorage.removeItem('cedarstone_token')
  localStorage.removeItem('cedarstone_user')
}

export async function getCustomerDashboard() {
  try { return await request('/customer/dashboard') } catch { return customerFallback }
}

export async function getAdminDashboard() {
  try { return await request('/admin/dashboard') } catch { return adminFallback }
}

export const submitLoanAssessment = (payload) => request('/customer/assess-loan', { method: 'POST', body: JSON.stringify(payload) })
export const getRepaymentAction = (payload) => request('/customer/repayment-action', { method: 'POST', body: JSON.stringify(payload) })
export const getCustomerSegment = (payload) => request('/customer/segment', { method: 'POST', body: JSON.stringify(payload) })

