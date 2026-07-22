from pydantic import BaseModel
from typing import Optional


class CreateTransactionRequest(BaseModel):
    wallet_id: str
    type: str
    amount: float
    category: str
    recipient_name: str
    notes: Optional[str] = None


class UpdateTransactionRequest(BaseModel):
    category: Optional[str] = None
    recipient_name: Optional[str] = None
    notes: Optional[str] = None