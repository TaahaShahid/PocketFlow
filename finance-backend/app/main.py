from fastapi import FastAPI

from app.api.health import router as health_router
from app.core.config import settings
from app.api.test_firestore import router as firestore_router
from app.api.wallets import router as wallet_router
from app.api.transactions import router as transaction_router
from fastapi.middleware.cors import CORSMiddleware
from app.api.goals import router as goal_router
from app.api import budgets

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.API_VERSION,
    description="Backend API for PocketFlow",
)

@app.get("/")
def root():
    return {
        "message": "PocketFlow Backend Running 🚀"
    }

app.include_router(
    health_router,
    prefix="/health",
    tags=["Health"],
)

app.include_router(
    firestore_router,
    prefix="/firestore",
    tags=["Firestore"],
)

app.include_router(
    wallet_router,
    prefix="/wallets",
    tags=["Wallets"],
)

app.include_router(
    transaction_router,
    prefix="/transactions",
    tags=["Transactions"],
)

app.include_router(
    goal_router,
    prefix="/goals",
    tags=["Goals"],
)

app.include_router(
    budgets.router,
    prefix="/budgets",
    tags=["Budgets"],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)