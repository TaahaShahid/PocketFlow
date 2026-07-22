from pydantic import BaseModel


class GoalContributionRequest(BaseModel):
   
    amount: float