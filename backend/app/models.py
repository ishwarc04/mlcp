import enum
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import JSON, Boolean, Date, DateTime, Enum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, enum.Enum):
    customer = "customer"
    admin = "admin"


class ApplicationStatus(str, enum.Enum):
    draft = "draft"
    review = "review"
    approved = "approved"
    rejected = "rejected"
    funded = "funded"


class LoanStatus(str, enum.Enum):
    active = "active"
    late = "late"
    completed = "completed"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.customer)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    applications: Mapped[list["LoanApplication"]] = relationship(back_populates="customer")
    loans: Mapped[list["Loan"]] = relationship(back_populates="customer")


class LoanApplication(Base):
    __tablename__ = "loan_applications"

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    purpose: Mapped[str] = mapped_column(String(80))
    requested_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    term_months: Mapped[int]
    status: Mapped[ApplicationStatus] = mapped_column(Enum(ApplicationStatus), default=ApplicationStatus.review)
    decision: Mapped[str | None] = mapped_column(String(40), nullable=True)
    decision_confidence: Mapped[float | None] = mapped_column(nullable=True)
    affordable_amount: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    risk_band: Mapped[str | None] = mapped_column(String(30), nullable=True)
    model_outputs: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    input_snapshot: Mapped[dict] = mapped_column(JSON)
    reviewer_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    customer: Mapped[User] = relationship(back_populates="applications")


class Loan(Base):
    __tablename__ = "loans"

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    account_number: Mapped[str] = mapped_column(String(32), unique=True)
    principal: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    outstanding_balance: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    monthly_emi: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    interest_rate: Mapped[float]
    remaining_term_months: Mapped[int]
    next_payment_date: Mapped[date] = mapped_column(Date)
    status: Mapped[LoanStatus] = mapped_column(Enum(LoanStatus), default=LoanStatus.active)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    customer: Mapped[User] = relationship(back_populates="loans")

