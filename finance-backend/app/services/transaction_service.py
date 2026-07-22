from fastapi import HTTPException
from firebase_admin import firestore

from app.core.firebase import db
from app.repositories.wallet_repository import WalletRepository
from app.repositories.transaction_repository import TransactionRepository


class TransactionService:

    @staticmethod
    def get_transactions(user_id: str):
        docs = TransactionRepository.get_all(user_id)

        transactions = []

        for doc in docs:
            transaction = doc.to_dict()

            transaction["id"] = doc.id

            if (
                "date" in transaction
                and transaction["date"]
                and hasattr(transaction["date"], "timestamp")
            ):
                transaction["date"] = int(
                    transaction["date"].timestamp() * 1000
                )

            transactions.append(transaction)

        transactions.sort(
            key=lambda t: t["date"],
            reverse=True,
        )

        return transactions

    @staticmethod
    def create_transaction(user_id: str, data):

        wallet_ref = WalletRepository.get_ref(
    user_id,
    data.wallet_id,
)

        transaction = db.transaction()

        @firestore.transactional
        def process(transaction):

            wallet = wallet_ref.get(transaction=transaction)

            if not wallet.exists:
                raise HTTPException(
                    status_code=404,
                    detail="Wallet not found",
                )

            wallet_data = wallet.to_dict()
            balance = wallet_data["balance"]

            if (
                data.type == "expense"
                and balance < data.amount
            ):
                raise HTTPException(
                    status_code=400,
                    detail="Insufficient funds",
                )

            if data.type == "income":
                new_balance = balance + data.amount
            else:
                new_balance = balance - data.amount

            transaction.update(
                wallet_ref,
                {
                    "balance": new_balance
                }
            )

            transaction_ref = (
                TransactionRepository.create_transaction_ref(
                    user_id
                )
            )

            transaction_data = {
                "walletId": data.wallet_id,
                "type": data.type,
                "amount": data.amount,
                "category": data.category,
                "recipientName": data.recipient_name,
                "notes": data.notes,
                "status": "completed",
                "date": firestore.SERVER_TIMESTAMP,
            }

            transaction.create(
                transaction_ref,
                transaction_data,
            )

            return {
                "success": True,
                "transactionId": transaction_ref.id,
                "newBalance": new_balance,
            }

        return process(transaction)

    @staticmethod
    def update_transaction(
        user_id: str,
        transaction_id: str,
        data,
    ):
        transaction_ref = TransactionRepository.get_ref(
            user_id,
            transaction_id,
        )

        update_data = {}

        if data.category is not None:
            update_data["category"] = data.category

        if data.recipient_name is not None:
            update_data["recipientName"] = data.recipient_name

        if data.notes is not None:
            update_data["notes"] = data.notes

        transaction_ref.update(update_data)

        return {
            "message": "Transaction updated successfully"
        }

    @staticmethod
    def delete_transaction(
        user_id: str,
        transaction_id: str,
    ):
        transaction_ref = TransactionRepository.get_ref(
            user_id,
            transaction_id,
        )

        if not transaction_ref.get().exists:
            raise HTTPException(
                status_code=404,
                detail="Transaction not found",
            )

        transaction_ref.delete()

        return {
            "message": "Transaction deleted successfully"
        }