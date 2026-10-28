from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database import Base, SessionLocal, engine
from app.routers import admin, auth, customer
from app.seed import seed_database
from app.services.ml_service import get_ml_service


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db)
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Loan assessment and servicing API for CedarStone Bank.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(customer.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")


@app.get("/health")
def health():
    ml = get_ml_service()
    model_status = ml.status()
    return {
        "status": "healthy" if all(model_status.values()) else "degraded",
        "service": settings.app_name,
        "models": model_status,
    }


@app.get("/")
def root():
    return {"service": settings.app_name, "docs": "/docs", "health": "/health"}

