from fastapi import APIRouter, Depends, Query

from app.core.auth import get_current_user
from app.schemas.insight import SpendingInsightsResponse, AISpendingInsightsResponse
from app.services.insight_service import InsightService
from app.services.ai_service import AIService

router = APIRouter()


@router.get("/spending", response_model=SpendingInsightsResponse)
def get_spending_insights(
    period: str = Query("month", enum=["week", "month", "year"]),
    current_user=Depends(get_current_user),
):
    user_id = current_user["uid"]
    return InsightService.get_spending_insights(user_id, period)


@router.get("/ai-narrative", response_model=AISpendingInsightsResponse)
def get_ai_narrative(
    period: str = Query("month", enum=["week", "month", "year"]),
    current_user=Depends(get_current_user),
):
    user_id = current_user["uid"]
    return AIService.get_ai_narrative(user_id, period)
