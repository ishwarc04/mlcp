from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import (ApplicationStatus, Loan, LoanApplication, LoanStatus, User,
                        UserRole)


def seed_database(db: Session) -> None:
    if db.scalar(select(User.id).limit(1)):
        return

    customer = User(
        full_name="Maya Thompson", email="maya@cedarstone.demo",
        password_hash=hash_password("Customer123!"), role=UserRole.customer,
    )
    admin = User(
        full_name="Daniel Reed", email="admin@cedarstone.demo",
        password_hash=hash_password("Admin123!"), role=UserRole.admin,
    )
    db.add_all([customer, admin])
    db.flush()

    application = LoanApplication(
        customer_id=customer.id, purpose="Home improvement", requested_amount=18000,
        term_months=36, status=ApplicationStatus.approved, decision="Approved",
        decision_confidence=0.94, affordable_amount=19500, risk_band="Low",
        model_outputs={"reasons": ["Strong credit history supports the assessment"]},
        input_snapshot={"seed": True},
    )
    loan = Loan(
        customer_id=customer.id, account_number="CS-2847-1930", principal=18000,
        outstanding_balance=12480, monthly_emi=582, interest_rate=10.8,
        remaining_term_months=23, next_payment_date=date.today() + timedelta(days=12),
        status=LoanStatus.active,
    )
    db.add_all([application, loan])
    db.commit()

