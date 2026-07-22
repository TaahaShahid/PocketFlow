from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.schemas.wallet import WalletCreate, WalletUpdate
from app.services.wallet_service import WalletService

router = APIRouter()


@router.get("/")
def get_wallets(
    current_user=Depends(get_current_user),
):
    return WalletService.get_wallets(
        current_user["uid"]
    )


@router.post("/")
def create_wallet(
    wallet: WalletCreate,
    current_user=Depends(get_current_user),
):
    return WalletService.create_wallet(
        current_user["uid"],
        wallet,
    )


@router.put("/{wallet_id}")
def update_wallet(
    wallet_id: str,
    wallet: WalletUpdate,
    current_user=Depends(get_current_user),
):
    return WalletService.update_wallet(
        current_user["uid"],
        wallet_id,
        wallet,
    )


@router.delete("/{wallet_id}")
def delete_wallet(
    wallet_id: str,
    current_user=Depends(get_current_user),
):
    return WalletService.delete_wallet(
        current_user["uid"],
        wallet_id,
    )