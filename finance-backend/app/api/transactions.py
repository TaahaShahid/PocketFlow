from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.schemas.transaction import (
    CreateTransactionRequest,
    UpdateTransactionRequest,
)
from app.services.transaction_service import TransactionService

router = APIRouter()


@router.get("/")
def get_transactions(
    current_user=Depends(get_current_user),
):
    return TransactionService.get_transactions(
        current_user["uid"]
    )


@router.post("/")
def create_transaction(
    request: CreateTransactionRequest,
    current_user=Depends(get_current_user),
):
    return TransactionService.create_transaction(
        current_user["uid"],
        request,
    )


@router.put("/{transaction_id}")
def update_transaction(
    transaction_id: str,
    request: UpdateTransactionRequest,
    current_user=Depends(get_current_user),
):
    return TransactionService.update_transaction(
        current_user["uid"],
        transaction_id,
        request,
    )


@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: str,
    current_user=Depends(get_current_user),
):
    return TransactionService.delete_transaction(
        current_user["uid"],
        transaction_id,
    )