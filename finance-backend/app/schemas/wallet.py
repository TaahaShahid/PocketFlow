from pydantic import BaseModel
from typing import Optional


class WalletCreate(BaseModel):
    cardNumber: str
    cardHolderName: str
    expiryDate: str
    cardType: str
    nickname: Optional[str] = None
    balance: float


class WalletUpdate(BaseModel):
    cardNumber: Optional[str] = None
    cardHolderName: Optional[str] = None
    expiryDate: Optional[str] = None
    cardType: Optional[str] = None
    nickname: Optional[str] = None
    balance: Optional[float] = None