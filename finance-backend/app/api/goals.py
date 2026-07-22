from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.schemas.goal import (
    CreateGoalRequest,
    UpdateGoalRequest,
)
from app.services.goal_service import GoalService
from app.schemas.contribution import GoalContributionRequest

router = APIRouter()


@router.get("/")
def get_goals(
    current_user=Depends(get_current_user),
):
    return GoalService.get_goals(
        current_user["uid"]
    )


@router.post("/")
def create_goal(
    request: CreateGoalRequest,
    current_user=Depends(get_current_user),
):
    return GoalService.create_goal(
        current_user["uid"],
        request,
    )


@router.put("/{goal_id}")
def update_goal(
    goal_id: str,
    request: UpdateGoalRequest,
    current_user=Depends(get_current_user),
):
    return GoalService.update_goal(
        current_user["uid"],
        goal_id,
        request,
    )


@router.delete("/{goal_id}")
def delete_goal(
    goal_id: str,
    current_user=Depends(get_current_user),
):
    return GoalService.delete_goal(
        current_user["uid"],
        goal_id,
    )

@router.post("/{goal_id}/contribute")
def contribute_to_goal(
    goal_id: str,
    request: GoalContributionRequest,
    current_user=Depends(get_current_user),
):
    return GoalService.contribute_to_goal(
        current_user["uid"],
        goal_id,
        request,
    )