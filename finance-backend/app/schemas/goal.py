from pydantic import BaseModel
from typing import Optional


class CreateGoalRequest(BaseModel):
    name: str
    target_amount: float
    current_amount: float
    deadline: int


class UpdateGoalRequest(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    deadline: Optional[int] = None