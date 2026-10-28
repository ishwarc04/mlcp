from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import current_user
from app.models import ApplicationStatus, Loan, LoanApplication, User
from app.schemas import (ApplicationSummary, LoanAssessmentRequest, LoanAssessmentResponse,
                         LoanSummary, RepaymentActionRequest, SegmentRequest)
from app.services.ml_service import MLService, get_ml_service


router = APIRouter(prefix="/customer", tags=["Customer"])


@router.get("/dashboard")
def dashboard(user: User = Depends(current_user), db: Session = Depends(get_db)):
    applications = db.scalars(
        select(LoanApplication).where(LoanApplication.customer_id == user.id).order_by(LoanApplication.created_at.desc())
    ).all()
    loans = db.scalars(select(Loan).where(Loan.customer_id == user.id)).all()
    total_outstanding = sum(float(loan.outstanding_balance) for loan in loans)
    next_loan = min(loans, key=lambda loan: loan.next_payment_date) if loans else None
    return {
        "customer": {"name": user.full_name, "member_since": user.created_at},
        "summary": {
            "active_loans": len([loan for loan in loans if loan.status.value in ("active", "late")]),
            "outstanding_balance": total_outstanding,
            "next_payment": float(next_loan.monthly_emi) if next_loan else 0,
            "next_payment_date": next_loan.next_payment_date if next_loan else None,
            "applications": len(applications),
        },
        "applications": [ApplicationSummary.model_validate(item) for item in applications[:5]],
        "loans": [LoanSummary.model_validate(item) for item in loans],
    }


@router.post("/assess-loan", response_model=LoanAssessmentResponse)
def assess_loan(payload: LoanAssessmentRequest, user: User = Depends(current_user),
                db: Session = Depends(get_db), ml: MLService = Depends(get_ml_service)):
    try:
        result = ml.assess_loan(payload.model_dump())
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    status_map = {
        "Approved": ApplicationStatus.approved,
        "Rejected": ApplicationStatus.rejected,
        "Manual Review": ApplicationStatus.review,
    }
    application = LoanApplication(
        customer_id=user.id,
        purpose=payload.purpose,
        requested_amount=payload.requested_loan_amount,
        term_months=payload.loan_term_months,
        status=status_map.get(result["decision"], ApplicationStatus.review),
        decision=result["decision"],
        decision_confidence=result["confidence"],
        affordable_amount=result["affordable_amount"],
        risk_band=result["risk_band"],
        model_outputs={"probabilities": result["probabilities"], "reasons": result["reasons"]},
        input_snapshot=payload.model_dump(),
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return LoanAssessmentResponse(
        application_id=application.id,
        decision=result["decision"], confidence=result["confidence"],
        affordable_amount=result["affordable_amount"], requested_amount=payload.requested_loan_amount,
        risk_band=result["risk_band"], reasons=result["reasons"], model_status=ml.status(),
    )


@router.get("/applications", response_model=list[ApplicationSummary])
def applications(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return db.scalars(
        select(LoanApplication).where(LoanApplication.customer_id == user.id).order_by(LoanApplication.created_at.desc())
    ).all()


@router.get("/loans", response_model=list[LoanSummary])
def loans(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return db.scalars(select(Loan).where(Loan.customer_id == user.id)).all()


@router.post("/segment")
def segment(payload: SegmentRequest, _: User = Depends(current_user), ml: MLService = Depends(get_ml_service)):
    try:
        return ml.segment(payload.model_dump())
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/repayment-action")
def repayment_action(payload: RepaymentActionRequest, _: User = Depends(current_user),
                     ml: MLService = Depends(get_ml_service)):
    try:
        return ml.repayment_action(payload.model_dump())
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

