from app.core.firebase import db


class TransactionRepository:

    @staticmethod
    def collection(user_id: str):
        return (
            db.collection("users")
            .document(user_id)
            .collection("transactions")
        )

    @staticmethod
    def get_all(user_id: str):
        return TransactionRepository.collection(user_id).stream()

    @staticmethod
    def get_ref(user_id: str, transaction_id: str):
        return (
            TransactionRepository.collection(user_id)
            .document(transaction_id)
        )

    @staticmethod
    def create_transaction_ref(user_id: str):
        return (
            TransactionRepository.collection(user_id)
            .document()
        )