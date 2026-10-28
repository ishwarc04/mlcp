import React, { useEffect, useMemo, useState } from 'react'
import Icon from './components/Icon'
import { getAdminDashboard, getCustomerDashboard, getCustomerSegment, getRepaymentAction, login, logout, submitLoanAssessment } from './api'

const money = (value, compact = false) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0, notation: compact ? 'compact' : 'standard',
}).format(Number(value || 0))

const shortDate = (value) => value ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : 'Not scheduled'
const titleCase = (value = '') => value.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase())

function ThemeToggle({ theme, setTheme }) {
  return (
    <button className="icon-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle color theme">
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
    </button>
  )
}

function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`}>
      <span className="brand-mark"><span /><span /><span /></span>
      {!compact && <span><strong>CedarStone</strong><small>National Bank</small></span>}
    </div>
  )
}

function Login({ theme, setTheme, onLogin }) {
  const [role, setRole] = useState('customer')
  const [email, setEmail] = useState('maya@cedarstone.demo')
  const [password, setPassword] = useState('Customer123!')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const changeRole = next => {
    setRole(next)
    setEmail(next === 'admin' ? 'admin@cedarstone.demo' : 'maya@cedarstone.demo')
    setPassword(next === 'admin' ? 'Admin123!' : 'Customer123!')
    setError('')
  }

  const submit = async event => {
    event.preventDefault()
    setLoading(true); setError('')
    try { onLogin(await login(email, password)) } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <main className="login-shell">
      <section className="login-story">
        <div className="login-story__top"><Brand /><ThemeToggle theme={theme} setTheme={setTheme} /></div>
        <div className="login-story__content">
          <span className="eyebrow">Banking built around clear decisions</span>
          <h1>Move forward with<br />the full picture.</h1>
          <p>Understand what you can afford, follow every application, and keep repayment on track without the fine-print fog.</p>
          <div className="story-metrics">
            <div><strong>24/7</strong><span>account access</span></div>
            <div><strong>4-layer</strong><span>risk assessment</span></div>
            <div><strong>256-bit</strong><span>data encryption</span></div>
          </div>
        </div>
        <div className="login-story__footer"><span>FDIC insured up to applicable limits</span><span>Member FDIC</span></div>
      </section>
      <section className="login-panel">
        <div className="login-box">
          <div className="mobile-brand"><Brand /><ThemeToggle theme={theme} setTheme={setTheme} /></div>
          <span className="eyebrow">Secure access</span>
          <h2>Welcome back</h2>
          <p className="muted">Sign in to your CedarStone workspace.</p>
          <div className="role-switch" role="tablist">
            <button className={role === 'customer' ? 'active' : ''} onClick={() => changeRole('customer')}>Personal banking</button>
            <button className={role === 'admin' ? 'active' : ''} onClick={() => changeRole('admin')}>Bank operations</button>
          </div>
          <form onSubmit={submit}>
            <label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" /></label>
            <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" /></label>
            <div className="form-row"><label className="check-row"><input type="checkbox" />Keep me signed in</label><button className="text-button" type="button">Forgot password?</button></div>
            {error && <div className="form-error"><Icon name="alert" size={16} />{error}</div>}
            <button className="primary-button full" disabled={loading}>{loading ? 'Signing in…' : 'Sign in securely'}<Icon name="arrow" size={17} /></button>
          </form>
          <p className="demo-note">Demo credentials are filled automatically. Start the API to use live database and model responses.</p>
        </div>
      </section>
    </main>
  )
}

const customerNav = [
  ['overview', 'grid', 'Overview'], ['apply', 'document', 'Apply for a loan'], ['loans', 'wallet', 'My loans'],
  ['repayment', 'calendar', 'Repayment planner'], ['profile', 'settings', 'Financial profile'],
]
const adminNav = [
  ['overview', 'grid', 'Operations'], ['applications', 'document', 'Applications'], ['customers', 'users', 'Customers'],
  ['portfolio', 'chart', 'Portfolio'], ['models', 'shield', 'Model health'],
]

function Shell({ user, theme, setTheme, page, setPage, onLogout, children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const nav = user.role === 'admin' ? adminNav : customerNav
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-head"><Brand /><button className="mobile-close" onClick={() => setMobileOpen(false)}><Icon name="close" /></button></div>
        <nav>{nav.map(([id, icon, label]) => <button key={id} className={page === id ? 'active' : ''} onClick={() => { setPage(id); setMobileOpen(false) }}><Icon name={icon} size={19} /><span>{label}</span>{page === id && <i />}</button>)}</nav>
        <div className="sidebar-support">
          <span className="support-mark">CS</span><div><strong>Need support?</strong><small>Talk to a banking specialist</small></div><Icon name="chevron" size={17} />
        </div>
        <div className="sidebar-user">
          <span className="avatar">{user.full_name.split(' ').map(part => part[0]).join('').slice(0, 2)}</span>
          <div><strong>{user.full_name}</strong><small>{user.role === 'admin' ? 'Operations administrator' : 'Personal banking'}</small></div>
          <button onClick={onLogout} aria-label="Sign out"><Icon name="logout" size={18} /></button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)}><Icon name="menu" /></button>
          <div className="topbar-search"><Icon name="search" size={17} /><span>Search {user.role === 'admin' ? 'customers, applications, loans' : 'transactions and documents'}</span><kbd>⌘ K</kbd></div>
          <div className="topbar-actions"><ThemeToggle theme={theme} setTheme={setTheme} /><button className="icon-button notification"><Icon name="bell" size={18} /><i /></button><span className="secure-status"><Icon name="shield" size={15} />Secure session</span></div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  )
}

function PageHeader({ eyebrow, title, description, action }) {
  return <div className="page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>
}

function StatCard({ label, value, detail, icon, tone = '' }) {
  return <article className={`stat-card ${tone}`}><div className="stat-card__head"><span>{label}</span><span className="stat-icon"><Icon name={icon} size={18} /></span></div><strong>{value}</strong><small>{detail}</small></article>
}

function Status({ value }) {
  const normalized = String(value || 'pending').toLowerCase().replace(' ', '-')
  return <span className={`status status--${normalized}`}><i />{titleCase(value)}</span>
}

function CustomerOverview({ data, setPage }) {
  const summary = data.summary || {}
  const loan = data.loans?.[0]
  return <>
    <PageHeader eyebrow="Personal banking" title={`Good morning, ${data.customer?.name?.split(' ')[0] || 'there'}.`} description="Here is what needs your attention and what is moving forward." action={<button className="primary-button" onClick={() => setPage('apply')}>Start an application<Icon name="arrow" size={17} /></button>} />
    <section className="stats-grid customer-stats">
      <StatCard label="Outstanding balance" value={money(summary.outstanding_balance)} detail={`${summary.active_loans || 0} active loan`} icon="wallet" />
      <StatCard label="Next payment" value={money(summary.next_payment)} detail={`Due ${shortDate(summary.next_payment_date)}`} icon="calendar" tone="stat-card--copper" />
      <StatCard label="Applications" value={summary.applications || 0} detail="All applications to date" icon="document" />
      <StatCard label="Account standing" value="Excellent" detail="No action required" icon="shield" tone="stat-card--sage" />
    </section>
    <section className="dashboard-grid">
      <article className="panel loan-focus">
        <div className="panel-head"><div><span className="eyebrow">Active loan</span><h2>Home improvement loan</h2></div><Status value={loan?.status || 'active'} /></div>
        <div className="loan-balance"><span>Remaining balance</span><strong>{money(loan?.outstanding_balance || 12480)}</strong><small>of {money(loan?.principal || 18000)} original principal</small></div>
        <div className="progress-track"><i style={{ width: `${Math.min(100, 100 - ((loan?.outstanding_balance || 12480) / (loan?.principal || 18000) * 100))}%` }} /></div>
        <div className="loan-facts"><div><span>Monthly payment</span><strong>{money(loan?.monthly_emi || 582)}</strong></div><div><span>Interest rate</span><strong>{loan?.interest_rate || 10.8}%</strong></div><div><span>Payments left</span><strong>{loan?.remaining_term_months || 23}</strong></div><div><span>Next due</span><strong>{shortDate(loan?.next_payment_date || summary.next_payment_date)}</strong></div></div>
        <div className="panel-actions"><button className="primary-button">Make a payment<Icon name="arrow" size={16} /></button><button className="secondary-button" onClick={() => setPage('loans')}>Loan details</button></div>
      </article>
      <article className="panel cashflow-panel">
        <div className="panel-head"><div><span className="eyebrow">Monthly position</span><h2>Cash flow</h2></div><button className="text-button">Last 6 months</button></div>
        <div className="cashflow-total"><strong>{money(4860)}</strong><span><Icon name="trend" size={14} />8.4% from last month</span></div>
        <div className="bar-chart" aria-label="Six-month cash flow chart">{[42, 58, 49, 71, 64, 82].map((height, i) => <div key={i}><i style={{ height: `${height}%` }} /><span>{['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'][i]}</span></div>)}</div>
        <div className="chart-legend"><span><i className="legend-income" />Available after commitments</span></div>
      </article>
      <article className="panel application-panel">
        <div className="panel-head"><div><span className="eyebrow">Recent activity</span><h2>Applications</h2></div><button className="text-button" onClick={() => setPage('apply')}>View all</button></div>
        <div className="application-list">{(data.applications || []).map(item => <div className="application-row" key={item.id}><span className="application-icon"><Icon name="document" size={18} /></span><div><strong>{item.purpose}</strong><small>Application #{item.id} · {shortDate(item.created_at)}</small></div><div className="application-amount"><strong>{money(item.requested_amount)}</strong><Status value={item.status} /></div></div>)}</div>
      </article>
      <article className="panel insight-panel">
        <span className="insight-kicker"><Icon name="shield" size={16} />Financial insight</span><h2>You are building borrowing strength.</h2><p>Your on-time payments and declining balance support better terms on a future application.</p><button className="text-link" onClick={() => setPage('profile')}>See your financial profile <Icon name="arrow" size={15} /></button>
      </article>
    </section>
  </>
}

const initialLoanForm = {
  purpose: 'Home improvement', age: 34, monthly_income: 7800, monthly_expenses: 3100, employment_years: 6,
  credit_score: 742, existing_loan_count: 1, existing_emi: 582, debt_to_income_ratio: .31,
  credit_utilization_ratio: .24, savings_balance: 28500, checking_balance: 8400, late_payments_2y: 0,
  defaults_5y: 0, credit_history_years: 11, requested_loan_amount: 25000, loan_term_months: 48,
  interest_rate: 10.5, dependents: 1, residence_years: 4, education_level: 'Graduate',
  employment_type: 'Salaried', property_ownership: 'Mortgaged',
}

const fields = [
  ['purpose', 'Loan purpose', 'select', ['Home improvement', 'Debt consolidation', 'Vehicle', 'Education', 'Business expansion', 'Personal']],
  ['requested_loan_amount', 'Requested amount', 'number'], ['loan_term_months', 'Term in months', 'number'], ['age', 'Age', 'number'],
  ['monthly_income', 'Monthly income', 'number'], ['monthly_expenses', 'Monthly expenses', 'number'], ['employment_type', 'Employment type', 'select', ['Salaried', 'Self-employed', 'Contract', 'Government']],
  ['employment_years', 'Years employed', 'number'], ['education_level', 'Education', 'select', ['High School', 'Diploma', 'Graduate', 'Postgraduate']],
  ['property_ownership', 'Residence type', 'select', ['Owned', 'Mortgaged', 'Rented', 'Family']], ['residence_years', 'Years at residence', 'number'],
  ['credit_score', 'Credit score', 'number'], ['credit_history_years', 'Credit history years', 'number'], ['credit_utilization_ratio', 'Credit utilization', 'number'],
  ['existing_loan_count', 'Existing loans', 'number'], ['existing_emi', 'Existing monthly payments', 'number'], ['debt_to_income_ratio', 'Debt-to-income ratio', 'number'],
  ['late_payments_2y', 'Late payments in 2 years', 'number'], ['defaults_5y', 'Defaults in 5 years', 'number'],
  ['savings_balance', 'Savings balance', 'number'], ['checking_balance', 'Checking balance', 'number'], ['interest_rate', 'Estimated interest rate', 'number'], ['dependents', 'Dependents', 'number'],
]

function LoanApplication() {
  const [form, setForm] = useState(initialLoanForm)
  const [step, setStep] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const groups = [[0, 1, 2], [3, 4, 5, 6, 7, 8, 9, 10], [11, 12, 13, 14, 15, 16, 17, 18, 19], [20, 21, 22]]
  const update = (key, value, type) => setForm(current => ({ ...current, [key]: type === 'number' ? Number(value) : value }))
  const submit = async () => {
    setLoading(true); setError('')
    try { setResult(await submitLoanAssessment(form)) } catch (err) { setError(`${err.message} Start the FastAPI service and verify MODEL_DIR points to the supplied artifacts.`) } finally { setLoading(false) }
  }
  if (result) return <AssessmentResult result={result} onReset={() => { setResult(null); setStep(0) }} />
  return <>
    <PageHeader eyebrow="Loan center" title="Apply with confidence." description="We use your complete financial picture to estimate both eligibility and an affordable amount." />
    <section className="application-layout">
      <aside className="step-rail">{['Loan request', 'About you', 'Credit profile', 'Assets & review'].map((label, index) => <button key={label} className={step === index ? 'active' : step > index ? 'complete' : ''} onClick={() => setStep(index)}><span>{step > index ? <Icon name="check" size={14} /> : index + 1}</span><div><strong>{label}</strong><small>{index === 0 ? 'Purpose and amount' : index === 1 ? 'Income and employment' : index === 2 ? 'History and obligations' : 'Balances and confirmation'}</small></div></button>)}</aside>
      <div className="panel application-form">
        <div className="application-form__head"><span>Step {step + 1} of 4</span><h2>{['Tell us what you need', 'Your financial foundation', 'Your credit profile', 'Final details'][step]}</h2><p>{['Choose an amount that matches your plan.', 'Provide monthly amounts before taxes.', 'These values help the model assess repayment risk.', 'Review the final details before assessment.'][step]}</p></div>
        <div className="field-grid">{groups[step].map(index => { const [key, label, type, options] = fields[index]; return <label key={key}>{label}{type === 'select' ? <select value={form[key]} onChange={e => update(key, e.target.value, type)}>{options.map(option => <option key={option}>{option}</option>)}</select> : <input type="number" step={['debt_to_income_ratio', 'credit_utilization_ratio', 'interest_rate'].includes(key) ? '.01' : '1'} value={form[key]} onChange={e => update(key, e.target.value, type)} />}{['monthly_income', 'monthly_expenses', 'requested_loan_amount', 'existing_emi', 'savings_balance', 'checking_balance'].includes(key) && <span className="input-prefix">$</span>}</label> })}</div>
        {step === 3 && <div className="review-summary"><div><span>Requested</span><strong>{money(form.requested_loan_amount)}</strong></div><div><span>Term</span><strong>{form.loan_term_months} months</strong></div><div><span>Purpose</span><strong>{form.purpose}</strong></div></div>}
        {error && <div className="form-error"><Icon name="alert" size={17} />{error}</div>}
        <div className="form-navigation"><button className="secondary-button" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>{step < 3 ? <button className="primary-button" onClick={() => setStep(step + 1)}>Continue<Icon name="arrow" size={16} /></button> : <button className="primary-button" onClick={submit} disabled={loading}>{loading ? 'Assessing…' : 'Run assessment'}<Icon name="arrow" size={16} /></button>}</div>
      </div>
      <aside className="application-aside"><div className="aside-card"><Icon name="shield" /><h3>Your data stays protected</h3><p>Application data is encrypted in transit and only used for this assessment.</p></div><div className="aside-card"><span className="aside-number">04</span><h3>Connected models</h3><p>Risk, affordability, customer profile, and repayment guidance work as one system.</p></div></aside>
    </section>
  </>
}

function AssessmentResult({ result, onReset }) {
  const positive = result.decision === 'Approved'
  return <>
    <PageHeader eyebrow="Assessment complete" title={positive ? 'Your application looks strong.' : result.decision === 'Rejected' ? 'A different amount may fit better.' : 'Your application needs a closer look.'} description={`Application #${result.application_id}`} />
    <section className="result-layout">
      <article className={`result-hero ${positive ? 'positive' : ''}`}><span className="result-icon"><Icon name={positive ? 'check' : 'document'} size={28} /></span><span className="eyebrow">Recommendation</span><h2>{result.decision}</h2><p>{Math.round(result.confidence * 100)}% model confidence · {result.risk_band} risk band</p></article>
      <article className="panel amount-comparison"><div><span>Requested amount</span><strong>{money(result.requested_amount)}</strong></div><Icon name="arrow" /><div><span>Estimated affordable amount</span><strong>{money(result.affordable_amount)}</strong></div></article>
      <article className="panel reason-panel"><span className="eyebrow">What influenced this result</span><h2>Assessment factors</h2>{result.reasons.map(reason => <div className="reason-row" key={reason}><Icon name="check" size={17} /><span>{reason}</span></div>)}</article>
      <article className="panel next-step-panel"><h2>What happens next</h2><p>A banking specialist will verify the application details before any final credit decision or funding.</p><div><button className="primary-button">Continue application<Icon name="arrow" size={16} /></button><button className="secondary-button" onClick={onReset}>Start over</button></div></article>
    </section>
  </>
}

function LoansPage({ data }) {
  const loans = data.loans || []
  return <><PageHeader eyebrow="Loan center" title="My loans" description="Track balances, payment dates, and payoff progress in one place." /><div className="loan-list">{loans.map(loan => <article className="panel loan-card" key={loan.id}><div className="loan-card__title"><span className="account-icon"><Icon name="building" /></span><div><span className="eyebrow">Personal installment loan</span><h2>{loan.account_number}</h2></div><Status value={loan.status} /></div><div className="loan-card__balance"><span>Outstanding balance</span><strong>{money(loan.outstanding_balance)}</strong><small>{loan.remaining_term_months} payments remaining</small></div><div className="progress-track"><i style={{ width: `${100 - loan.outstanding_balance / loan.principal * 100}%` }} /></div><div className="loan-facts"><div><span>Original principal</span><strong>{money(loan.principal)}</strong></div><div><span>Monthly payment</span><strong>{money(loan.monthly_emi)}</strong></div><div><span>APR</span><strong>{loan.interest_rate}%</strong></div><div><span>Next payment</span><strong>{shortDate(loan.next_payment_date)}</strong></div></div><div className="panel-actions"><button className="primary-button">Make payment</button><button className="secondary-button">View statements</button><button className="text-button">Payoff quote</button></div></article>)}</div></>
}

function RepaymentPlanner({ data }) {
  const loan = data.loans?.[0] || {}
  const [extra, setExtra] = useState(150)
  const monthsSaved = Math.max(1, Math.round(extra / 65))
  const interestSaved = extra * monthsSaved * .44
  const [guidance, setGuidance] = useState(null)
  const askGuidance = async () => {
    const payload = { risk_level: 0, missed_payments: 0, days_past_due: 0, outstanding_balance: Number(loan.outstanding_balance || 12480), monthly_emi: Number(loan.monthly_emi || 582), monthly_income: 7800, monthly_expenses: 3100, available_balance: 1900, payment_history_score: 94, contact_response_score: .9, hardship_score: .1, employment_stability_score: .92, recent_income_change_pct: 2, debt_to_income_ratio: .31, credit_utilization_ratio: .24, remaining_term_months: Number(loan.remaining_term_months || 23), prior_restructures: 0, reminder_response_rate: .95, partial_payment_capacity: 1, days_to_next_salary: 10 }
    try { setGuidance(await getRepaymentAction(payload)) } catch { setGuidance({ action: 'No Action', confidence: .96 }) }
  }
  return <><PageHeader eyebrow="Planning tools" title="Repayment planner" description="See how small changes affect your payoff date and total interest." /><section className="planner-grid"><article className="panel planner-control"><span className="eyebrow">Monthly payment</span><h2>Build a faster payoff</h2><div className="payment-display"><span>Current payment</span><strong>{money(loan.monthly_emi || 582)}</strong></div><label className="range-label"><span>Extra each month</span><strong>{money(extra)}</strong><input type="range" min="0" max="750" step="25" value={extra} onChange={e => setExtra(Number(e.target.value))} /></label><div className="range-scale"><span>$0</span><span>$750</span></div><button className="primary-button full" onClick={askGuidance}>Check repayment guidance<Icon name="arrow" size={16} /></button>{guidance && <div className="guidance-result"><Icon name="shield" /><div><span>Recommended action</span><strong>{guidance.action}</strong><small>{Math.round(guidance.confidence * 100)}% policy confidence</small></div></div>}</article><article className="planner-results"><div className="planner-result dark"><span>New monthly payment</span><strong>{money(Number(loan.monthly_emi || 582) + extra)}</strong><small>Starting next billing cycle</small></div><div className="planner-result"><span>Time saved</span><strong>{monthsSaved} months</strong><small>Estimated payoff acceleration</small></div><div className="planner-result"><span>Interest saved</span><strong>{money(interestSaved)}</strong><small>Estimated over remaining term</small></div><div className="panel payoff-timeline"><div className="panel-head"><h2>Payoff path</h2><span>{loan.remaining_term_months || 23} → {(loan.remaining_term_months || 23) - monthsSaved} months</span></div><div className="timeline"><span className="timeline-start">Now</span><i><b style={{ width: `${Math.max(20, 100 - monthsSaved * 6)}%` }} /></i><span>Payoff</span></div></div></article></section></>
}

function FinancialProfile() {
  const [segment, setSegment] = useState('Stable')
  useEffect(() => {
    const profile = { monthly_income: 7800, monthly_expenses: 3100, savings_balance: 28500, credit_score: 742, debt_to_income_ratio: .31, credit_utilization_ratio: .24, existing_loan_count: 1, existing_emi: 582, late_payments_2y: 0, defaults_5y: 0, credit_history_years: 11, average_monthly_balance: 8400, transaction_count_monthly: 67, digital_payment_ratio: .82, investment_balance: 24000, emergency_fund_months: 6, loan_frequency_5y: 1, repayment_consistency: .96, income_stability_score: .91, financial_literacy_score: .82 }
    getCustomerSegment(profile).then(result => setSegment(result.segment)).catch(() => setSegment('Stable'))
  }, [])
  return <><PageHeader eyebrow="Financial profile" title="Your borrowing profile" description="A transparent view of the information that shapes affordability and risk assessments." /><section className="profile-grid"><article className="profile-score"><div className="score-ring"><strong>782</strong><span>Credit score</span></div><div><span className="eyebrow">Profile standing</span><h2>Strong and improving</h2><p>Consistent payments and moderate utilization are your strongest factors.</p><Status value={segment} /></div></article><article className="panel factor-panel"><div className="panel-head"><h2>Key factors</h2><span>Updated today</span></div>{[['Payment consistency', 94, 'Excellent'], ['Credit utilization', 76, 'Good'], ['Income stability', 88, 'Strong'], ['Debt-to-income', 69, 'Good']].map(([label, value, text]) => <div className="factor-row" key={label}><div><span>{label}</span><strong>{text}</strong></div><i><b style={{ width: `${value}%` }} /></i><em>{value}</em></div>)}</article><article className="panel data-panel"><span className="eyebrow">Data controls</span><h2>You decide what stays current.</h2><p>Review connected income, employment, and balance information before your next application.</p><button className="secondary-button">Review personal information</button></article></section></>
}

function AdminOverview({ data, setPage }) {
  const summary = data.summary || {}
  const allModelsReady = Object.values(data.model_status || {}).every(Boolean)
  return <><PageHeader eyebrow="Bank operations" title="Lending command center" description="Portfolio activity and decisions requiring attention today." action={<button className="secondary-button"><Icon name="download" size={16} />Export report</button>} /><section className="stats-grid admin-stats"><StatCard label="Portfolio outstanding" value={money(summary.portfolio_outstanding, true)} detail="Across active lending products" icon="wallet" /><StatCard label="Applications" value={(summary.applications || 0).toLocaleString()} detail="All applications" icon="document" /><StatCard label="Pending review" value={summary.pending_review || 0} detail={`${Math.min(summary.pending_review || 0, 12)} nearing service target`} icon="alert" tone="stat-card--copper" /><StatCard label="Approval rate" value={`${Math.round((summary.approval_rate || 0) * 100)}%`} detail="Current portfolio average" icon="trend" tone="stat-card--sage" /></section><section className="admin-grid"><article className="panel volume-panel"><div className="panel-head"><div><span className="eyebrow">Application volume</span><h2>Weekly decisions</h2></div><div className="legend-inline"><span><i className="approved" />Approved</span><span><i className="review" />Review</span></div></div><div className="stacked-chart">{[[62, 18], [71, 21], [58, 25], [82, 19], [76, 24], [88, 28], [69, 17]].map(([a, r], index) => <div key={index}><span><i className="approved-bar" style={{ height: `${a}%` }} /><i className="review-bar" style={{ height: `${r}%` }} /></span><small>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</small></div>)}</div></article><article className="panel risk-panel"><div className="panel-head"><div><span className="eyebrow">Risk distribution</span><h2>Current applications</h2></div></div><div className="risk-visual"><div className="donut"><span><strong>{(summary.applications || 0).toLocaleString()}</strong><small>applications</small></span></div><div className="risk-legend">{Object.entries(data.risk_distribution || {}).map(([label, value]) => <div key={label}><span><i className={`risk-${label.toLowerCase()}`} />{label}</span><strong>{value}</strong></div>)}</div></div></article><article className="panel review-queue"><div className="panel-head"><div><span className="eyebrow">Decision queue</span><h2>Needs review</h2></div><button className="text-button" onClick={() => setPage('applications')}>Open queue</button></div><AdminTable rows={(data.applications || []).slice(0, 5)} compact /></article><article className="panel model-card"><div className="model-card__head"><span className="model-pulse" /><div><span className="eyebrow">Decision systems</span><h2>{allModelsReady ? 'All models available' : 'Model attention required'}</h2></div></div><p>{allModelsReady ? 'Risk, affordability, segmentation, and repayment services are ready.' : 'One or more decision services are not currently available.'}</p><div className="model-mini-list">{Object.entries(data.model_status || {}).map(([name, ready]) => <span key={name}><Icon name={ready ? 'check' : 'alert'} size={14} />{titleCase(name)}</span>)}</div><button className="text-link" onClick={() => setPage('models')}>View model health <Icon name="arrow" size={15} /></button></article></section></>
}

function AdminTable({ rows, compact = false }) {
  return <div className={`data-table-wrap ${compact ? 'compact' : ''}`}><table className="data-table"><thead><tr><th>Applicant</th><th>Request</th><th>Risk</th>{!compact && <th>Confidence</th>}<th>Status</th><th /></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><strong>{row.customer}</strong><small>{row.email || `Application #${row.id}`}</small></td><td><strong>{money(row.requested_amount)}</strong><small>{row.purpose}</small></td><td><Status value={row.risk_band} /></td>{!compact && <td><strong>{Math.round((row.confidence || 0) * 100)}%</strong><small>model confidence</small></td>}<td><Status value={row.status} /></td><td><button className="table-action"><Icon name="chevron" size={17} /></button></td></tr>)}</tbody></table></div>
}

function ApplicationsPage({ data }) {
  const [query, setQuery] = useState('')
  const [risk, setRisk] = useState('All risk')
  const rows = (data.applications || []).filter(row => `${row.customer} ${row.email} ${row.purpose}`.toLowerCase().includes(query.toLowerCase()) && (risk === 'All risk' || row.risk_band === risk))
  return <><PageHeader eyebrow="Lending operations" title="Application review" description="Review model recommendations alongside applicant details before a final decision." /><section className="panel table-panel"><div className="table-toolbar"><label className="search-input"><Icon name="search" size={17} /><input placeholder="Search applications" value={query} onChange={e => setQuery(e.target.value)} /></label><div><select value={risk} onChange={e => setRisk(e.target.value)}><option>All risk</option><option>Low</option><option>Moderate</option><option>High</option></select><button className="secondary-button"><Icon name="filter" size={16} />More filters</button><button className="secondary-button"><Icon name="download" size={16} />Export</button></div></div><AdminTable rows={rows} /><div className="table-footer"><span>Showing {rows.length} of {(data.applications || []).length} applications</span><div><button disabled>Previous</button><button className="active">1</button><button>2</button><button>Next</button></div></div></section></>
}

function CustomersPage() {
  const customers = [['Maya Thompson', 'Stable', '$12,480', 'Excellent'], ['Marcus Lee', 'Premium', '$24,200', 'Strong'], ['Elena Vargas', 'Emerging', '$61,500', 'Review'], ['Nora Bennett', 'Stretched', '$12,200', 'Monitor'], ['Amara Johnson', 'Stable', '$31,000', 'Strong']]
  return <><PageHeader eyebrow="Relationship management" title="Customers" description="Financial profiles, segment context, and active relationships." /><section className="customer-directory">{customers.map(([name, segment, exposure, standing], index) => <article className="customer-card" key={name}><span className="avatar large">{name.split(' ').map(x => x[0]).join('')}</span><div><h3>{name}</h3><p>Customer ID CS-{28410 + index}</p></div><Status value={segment} /><div><span>Exposure</span><strong>{exposure}</strong></div><div><span>Standing</span><strong>{standing}</strong></div><button className="table-action"><Icon name="chevron" size={18} /></button></article>)}</section></>
}

function PortfolioPage({ data }) {
  return <><PageHeader eyebrow="Portfolio intelligence" title="Lending portfolio" description="Exposure, performance, and concentration at a glance." /><section className="portfolio-grid"><article className="portfolio-hero"><span className="eyebrow">Total managed exposure</span><strong>{money(data.summary?.portfolio_outstanding || 247600000)}</strong><p><Icon name="trend" size={15} />6.2% growth over the previous quarter</p></article><article className="panel"><div className="panel-head"><h2>Product mix</h2><span>Outstanding balance</span></div>{[['Personal loans', 42, '$104.0M'], ['Home improvement', 28, '$69.3M'], ['Auto loans', 18, '$44.6M'], ['Education', 12, '$29.7M']].map(([label, value, amount]) => <div className="mix-row" key={label}><div><span>{label}</span><strong>{amount}</strong></div><i><b style={{ width: `${value * 2}%` }} /></i><em>{value}%</em></div>)}</article><article className="panel"><div className="panel-head"><h2>Portfolio quality</h2></div><div className="quality-grid"><div><strong>96.8%</strong><span>Current</span></div><div><strong>2.1%</strong><span>30 days late</span></div><div><strong>0.8%</strong><span>60 days late</span></div><div><strong>0.3%</strong><span>90+ days late</span></div></div></article></section></>
}

function ModelHealth({ data }) {
  const descriptions = { classification: 'Loan decision and credit-risk recommendation', regression: 'Affordable loan amount estimate', segmentation: 'Customer financial profile grouping', repayment: 'Repayment support action policy' }
  return <><PageHeader eyebrow="Model operations" title="Decision system health" description="Availability and intended role of every deployed model artifact." /><section className="model-health-grid">{Object.entries(data.model_status || {}).map(([name, ready]) => <article className="model-health-card" key={name}><div><span className={`health-light ${ready ? 'ready' : ''}`} /><Status value={ready ? 'Available' : 'Unavailable'} /></div><span className="eyebrow">{name === 'repayment' ? 'Reinforcement learning' : name === 'segmentation' ? 'Unsupervised learning' : 'Supervised learning'}</span><h2>{titleCase(name)}</h2><p>{descriptions[name]}</p><dl><div><dt>Artifact</dt><dd>{name === 'classification' ? 'loan_decision_pipeline.joblib' : name === 'regression' ? 'affordable_loan_pipeline.joblib' : name === 'segmentation' ? 'customer_segmentation_pipeline.joblib' : 'repayment_q_learning_policy.joblib'}</dd></div><div><dt>Runtime</dt><dd>scikit-learn / joblib</dd></div></dl></article>)}</section><aside className="governance-note"><Icon name="shield" /><div><strong>Human review remains part of every adverse decision.</strong><p>Model recommendations support bank staff. They do not independently issue credit or change account terms.</p></div></aside></>
}

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('cedarstone_theme') || 'light')
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('cedarstone_user')) } catch { return null } })
  const [page, setPage] = useState('overview')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('cedarstone_theme', theme) }, [theme])
  useEffect(() => {
    if (!user) return
    setLoading(true)
    const loader = user.role === 'admin' ? getAdminDashboard : getCustomerDashboard
    loader().then(setData).finally(() => setLoading(false))
  }, [user])

  const signOut = () => { logout(); setUser(null); setData(null); setPage('overview') }
  if (!user) return <Login theme={theme} setTheme={setTheme} onLogin={setUser} />
  if (loading || !data) return <div className="loading-screen"><Brand /><span /><p>Preparing your workspace</p></div>

  let view
  if (user.role === 'customer') {
    view = page === 'apply' ? <LoanApplication /> : page === 'loans' ? <LoansPage data={data} /> : page === 'repayment' ? <RepaymentPlanner data={data} /> : page === 'profile' ? <FinancialProfile /> : <CustomerOverview data={data} setPage={setPage} />
  } else {
    view = page === 'applications' ? <ApplicationsPage data={data} /> : page === 'customers' ? <CustomersPage /> : page === 'portfolio' ? <PortfolioPage data={data} /> : page === 'models' ? <ModelHealth data={data} /> : <AdminOverview data={data} setPage={setPage} />
  }
  return <Shell user={user} theme={theme} setTheme={setTheme} page={page} setPage={setPage} onLogout={signOut}>{view}</Shell>
}

export default App

