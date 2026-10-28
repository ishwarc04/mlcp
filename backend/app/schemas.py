from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    email: EmailStr
    role: str


class LoanAssessmentRequest(BaseModel):
    purpose: str = "Personal"
    age: int = Field(ge=18, le=85)
    monthly_income: float = Field(gt=0)
    monthly_expenses: float = Field(ge=0)
    employment_years: float = Field(ge=0, le=60)
    credit_score: float = Field(ge=300, le=850)
    existing_loan_count: int = Field(ge=0, le=20)
    existing_emi: float = Field(ge=0)
    debt_to_income_ratio: float = Field(ge=0, le=1.5)
    credit_utilization_ratio: float = Field(ge=0, le=1)
    savings_balance: float = Field(ge=0)
    checking_balance: float = Field(ge=0)
    late_payments_2y: int = Field(ge=0, le=50)
    defaults_5y: int = Field(ge=0, le=20)
    credit_history_years: float = Field(ge=0, le=70)
    requested_loan_amount: float = Field(gt=0)
    loan_term_months: int = Field(ge=6, le=120)
    interest_rate: float = Field(ge=0, le=60)
    dependents: int = Field(ge=0, le=20)
    residence_years: float = Field(ge=0, le=70)
    education_level: Literal["High School", "Diploma", "Graduate", "Postgraduate"]
    employment_type: Literal["Salaried", "Self-employed", "Contract", "Government"]
    property_ownership: Literal["Owned", "Mortgaged", "Rented", "Family"]


class LoanAssessmentResponse(BaseModel):
    application_id: int
    decision: str
    confidence: float
    affordable_amount: float
    requested_amount: float
    risk_band: str
    reasons: list[str]
    model_status: dict[str, bool]


class SegmentRequest(BaseModel):
    monthly_income: float
    monthly_expenses: float
    savings_balance: float
    credit_score: float
    debt_to_income_ratio: float
    credit_utilization_ratio: float
    existing_loan_count: int
    existing_emi: float
    late_payments_2y: int
    defaults_5y: int
    credit_history_years: float
    average_monthly_balance: float
    transaction_count_monthly: int
    digital_payment_ratio: float
    investment_balance: float
    emergency_fund_months: float
    loan_frequency_5y: int
    repayment_consistency: float
    income_stability_score: float
    financial_literacy_score: float


class RepaymentActionRequest(BaseModel):
    risk_level: int = Field(ge=0, le=2)
    missed_payments: int = Field(ge=0)
    days_past_due: int = Field(ge=0)
    outstanding_balance: float = Field(ge=0)
    monthly_emi: float = Field(gt=0)
    monthly_income: float = Field(gt=0)
    monthly_expenses: float = Field(ge=0)
    available_balance: float = Field(ge=0)
    payment_history_score: float = Field(ge=0, le=100)
    contact_response_score: float = Field(ge=0, le=1)
    hardship_score: float = Field(ge=0, le=1)
    employment_stability_score: float = Field(ge=0, le=1)
    recent_income_change_pct: float
    debt_to_income_ratio: float = Field(ge=0)
    credit_utilization_ratio: float = Field(ge=0, le=1)
    remaining_term_months: int = Field(ge=0)
    prior_restructures: int = Field(ge=0)
    reminder_response_rate: float = Field(ge=0, le=1)
    partial_payment_capacity: float = Field(ge=0, le=1)
    days_to_next_salary: int = Field(ge=0, le=45)


class ApplicationSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    purpose: str
    requested_amount: Decimal
    term_months: int
    status: str
    decision: str | None
    affordable_amount: Decimal | None
    risk_band: str | None
    created_at: datetime


class LoanSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    account_number: str
    principal: Decimal
    outstanding_balance: Decimal
    monthly_emi: Decimal
    interest_rate: float
    remaining_term_months: int
    next_payment_date: date
    status: str

