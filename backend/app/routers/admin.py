from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import admin_user
from app.models import ApplicationStatus, Loan, LoanApplication, User
from app.services.ml_service import MLService, get_ml_service


router = APIRouter(prefix="/admin", tags=["Administration"])


@router.get("/dashboard")
def dashboard(_: User = Depends(admin_user), db: Session = Depends(get_db),
              ml: MLService = Depends(get_ml_service)):
    applications = db.scalars(
        select(LoanApplication).options(joinedload(LoanApplication.customer)).order_by(LoanApplication.created_at.desc())
    ).all()
    loans = db.scalars(select(Loan)).all()
    customers = db.scalar(select(func.count(User.id)).where(User.role == "customer")) or 0
    outstanding = sum(float(loan.outstanding_balance) for loan in loans)
    statuses = Counter(item.status.value for item in applications)
    risk = Counter(item.risk_band or "Unscored" for item in applications)
    return {
        "summary": {
            "customers": customers,
            "applications": len(applications),
            "pending_review": statuses.get("review", 0),
            "approval_rate": round(statuses.get("approved", 0) / max(len(applications), 1), 4),
            "portfolio_outstanding": outstanding,
        },
        "status_distribution": statuses,
        "risk_distribution": risk,
        "model_status": ml.status(),
        "applications": [
            {
                "id": item.id,
                "customer": item.customer.full_name,
                "email": item.customer.email,
                "purpose": item.purpose,
                "requested_amount": float(item.requested_amount),
                "affordable_amount": float(item.affordable_amount or 0),
                "status": item.status.value,
                "decision": item.decision,
                "risk_band": item.risk_band,
                "confidence": item.decision_confidence,
                "created_at": item.created_at,
            }
            for item in applications[:30]
        ],
    }


@router.patch("/applications/{application_id}")
def review_application(application_id: int, status: ApplicationStatus, reviewer_note: str = "",
                       _: User = Depends(admin_user), db: Session = Depends(get_db)):
    application = db.get(LoanApplication, application_id)
    if not application:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Application not found")
    application.status = status
    application.reviewer_note = reviewer_note
    db.commit()
    return {"id": application.id, "status": application.status.value}

