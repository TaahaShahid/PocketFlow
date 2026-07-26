from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()


@router.get("/")
def health():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.API_VERSION,
    }