from fastapi import APIRouter
from fastapi import Depends

from app.core.auth import get_current_user

from app.schemas.budget import (
    CreateBudgetRequest,
    UpdateBudgetRequest,
)

from app.services.budget_service import BudgetService

router = APIRouter()


@router.get("/")
def get_budgets(
    current_user=Depends(get_current_user),
):
    return BudgetService.get_budgets(
        current_user["uid"]
    )


@router.post("/")
def create_budget(
    request: CreateBudgetRequest,
    current_user=Depends(get_current_user),
):
    return BudgetService.create_budget(
        current_user["uid"],
        request,
    )


@router.put("/{budget_id}")
def update_budget(
    budget_id: str,
    request: UpdateBudgetRequest,
    current_user=Depends(get_current_user),
):
    return BudgetService.update_budget(
        current_user["uid"],
        budget_id,
        request,
    )


@router.delete("/{budget_id}")
def delete_budget(
    budget_id: str,
    current_user=Depends(get_current_user),
):
    return BudgetService.delete_budget(
        current_user["uid"],
        budget_id,
    )