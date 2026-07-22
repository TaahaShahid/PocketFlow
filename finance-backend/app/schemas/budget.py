from typing import Optional

from pydantic import BaseModel


class CreateBudgetRequest(BaseModel):
    category: str
    monthly_limit: float


class UpdateBudgetRequest(BaseModel):
    category: Optional[str] = None
    monthly_limit: Optional[float] = None