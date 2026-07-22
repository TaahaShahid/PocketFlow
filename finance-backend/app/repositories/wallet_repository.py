from app.core.firebase import db


class WalletRepository:

    @staticmethod
    def collection(user_id: str):
        return (
            db.collection("users")
            .document(user_id)
            .collection("wallets")
        )

    @staticmethod
    def get_all(user_id: str):
        return WalletRepository.collection(user_id).stream()

    @staticmethod
    def get_ref(user_id: str, wallet_id: str):
        return WalletRepository.collection(user_id).document(wallet_id)

    @staticmethod
    def create(user_id: str, wallet_data: dict):
        return WalletRepository.collection(user_id).add(wallet_data)