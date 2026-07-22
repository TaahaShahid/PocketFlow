
from app.api import wallets
from app.api import wallets
from firebase_admin import firestore

from app.repositories.wallet_repository import WalletRepository


class WalletService:

    @staticmethod
    def get_wallets(user_id: str):
        docs = WalletRepository.get_all(user_id)

        wallets = []

        for doc in docs:
            wallet = doc.to_dict()

            wallet["id"] = doc.id

            if "createdAt" in wallet and wallet["createdAt"]:

                # Firestore Timestamp
                if hasattr(wallet["createdAt"], "timestamp"):
                    wallet["createdAt"] = int(
                    wallet["createdAt"].timestamp() * 1000
                )

                # Already stored as integer
                elif isinstance(wallet["createdAt"], int):
                    pass

            wallets.append(wallet)

        return wallets

    @staticmethod
    def create_wallet(user_id: str, wallet):
        wallet_data = wallet.model_dump()

        wallet_data["createdAt"] = firestore.SERVER_TIMESTAMP

        _, doc_ref = WalletRepository.create(
            user_id,
            wallet_data,
        )

        return {
            "message": "Wallet created successfully",
            "id": doc_ref.id,
        }

    @staticmethod
    def update_wallet(
        user_id: str,
        wallet_id: str,
        wallet,
    ):
        wallet_ref = WalletRepository.get_ref(
            user_id,
            wallet_id,
        )

        wallet_ref.update(
            wallet.model_dump(exclude_unset=True)
        )

        return {
            "message": "Wallet updated successfully"
        }

    @staticmethod
    def delete_wallet(
        user_id: str,
        wallet_id: str,
    ):
        wallet_ref = WalletRepository.get_ref(
            user_id,
            wallet_id,
        )

        wallet_ref.delete()

        return {
            "message": "Wallet deleted successfully"
        }