from fastapi import HTTPException
from firebase_admin import firestore

from app.core.firebase import db
from app.repositories.wallet_repository import WalletRepository
from app.repositories.transaction_repository import TransactionRepository
from app.repositories.budget_repository import BudgetRepository


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

        budget_ref = None
        if data.type == "expense":
            budget_doc = BudgetRepository.get_by_category(user_id, data.category)
            if budget_doc:
                budget_ref = budget_doc.reference

        transaction = db.transaction()

        @firestore.transactional
        def process(transaction):
            # 1. READS
            wallet = wallet_ref.get(transaction=transaction)
            if not wallet.exists:
                raise HTTPException(
                    status_code=404,
                    detail="Wallet not found",
                )

            budget_snap = None
            if data.type == "expense" and budget_ref is not None:
                budget_snap = budget_ref.get(transaction=transaction)

            # 2. COMPUTATIONS & WRITES
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

            # Update budget if expense
            if budget_snap and budget_snap.exists:
                budget_data = budget_snap.to_dict()
                new_spent = budget_data.get("spent", 0.0) + data.amount
                new_remaining = budget_data.get("monthlyLimit", 0.0) - new_spent
                transaction.update(
                    budget_ref,
                    {
                        "spent": new_spent,
                        "remaining": new_remaining
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

        tx_snap = transaction_ref.get()
        if not tx_snap.exists:
            raise HTTPException(
                status_code=404,
                detail="Transaction not found",
            )

        tx_data = tx_snap.to_dict()
        old_category = tx_data.get("category")
        old_amount = tx_data.get("amount", 0.0)
        tx_type = tx_data.get("type")
        wallet_id = tx_data.get("walletId")

        new_category = data.category if data.category is not None else old_category
        new_amount = data.amount if data.amount is not None else old_amount

        wallet_ref = WalletRepository.get_ref(user_id, wallet_id) if wallet_id else None
        
        old_budget_ref = None
        new_budget_ref = None

        if tx_type == "expense":
            if old_category:
                old_budget_doc = BudgetRepository.get_by_category(user_id, old_category)
                if old_budget_doc:
                    old_budget_ref = old_budget_doc.reference
            if new_category and new_category != old_category:
                new_budget_doc = BudgetRepository.get_by_category(user_id, new_category)
                if new_budget_doc:
                    new_budget_ref = new_budget_doc.reference

        transaction = db.transaction()

        @firestore.transactional
        def process(transaction):
            # 1. READS
            wallet_snap = None
            if new_amount != old_amount and wallet_ref:
                wallet_snap = wallet_ref.get(transaction=transaction)
                
            old_budget_snap = None
            if old_budget_ref:
                old_budget_snap = old_budget_ref.get(transaction=transaction)
                
            new_budget_snap = None
            if new_budget_ref:
                new_budget_snap = new_budget_ref.get(transaction=transaction)

            # 2. COMPUTATIONS & WRITES
            if wallet_snap and wallet_snap.exists:
                wallet_data = wallet_snap.to_dict()
                current_balance = wallet_data.get("balance", 0.0)
                
                if tx_type == "expense":
                    wallet_diff = new_amount - old_amount
                    new_balance = current_balance - wallet_diff
                else:
                    wallet_diff = new_amount - old_amount
                    new_balance = current_balance + wallet_diff
                    
                if new_balance < 0:
                    raise HTTPException(
                        status_code=400,
                        detail="Insufficient funds",
                    )
                    
                transaction.update(
                    wallet_ref,
                    {"balance": new_balance}
                )

            # Update budgets if expense
            if tx_type == "expense":
                if old_category == new_category:
                    if old_budget_snap and old_budget_snap.exists and old_amount != new_amount:
                        b_data = old_budget_snap.to_dict()
                        new_spent = b_data.get("spent", 0.0) + (new_amount - old_amount)
                        new_remaining = b_data.get("monthlyLimit", 0.0) - new_spent
                        transaction.update(
                            old_budget_ref,
                            {
                                "spent": new_spent,
                                "remaining": new_remaining
                            }
                        )
                else:
                    if old_budget_snap and old_budget_snap.exists:
                        b_data = old_budget_snap.to_dict()
                        new_spent = b_data.get("spent", 0.0) - old_amount
                        new_remaining = b_data.get("monthlyLimit", 0.0) - new_spent
                        transaction.update(
                            old_budget_ref,
                            {
                                "spent": new_spent,
                                "remaining": new_remaining
                            }
                        )
                    if new_budget_snap and new_budget_snap.exists:
                        b_data = new_budget_snap.to_dict()
                        new_spent = b_data.get("spent", 0.0) + new_amount
                        new_remaining = b_data.get("monthlyLimit", 0.0) - new_spent
                        transaction.update(
                            new_budget_ref,
                            {
                                "spent": new_spent,
                                "remaining": new_remaining
                            }
                        )

            # Update the transaction document
            update_data = {}
            if data.category is not None:
                update_data["category"] = data.category
            if data.recipient_name is not None:
                update_data["recipientName"] = data.recipient_name
            if data.notes is not None:
                update_data["notes"] = data.notes
            if data.amount is not None:
                update_data["amount"] = data.amount
                
            if update_data:
                transaction.update(transaction_ref, update_data)

        process(transaction)

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

        tx_snap = transaction_ref.get()
        if not tx_snap.exists:
            raise HTTPException(
                status_code=404,
                detail="Transaction not found",
            )

        tx_data = tx_snap.to_dict()
        wallet_id = tx_data.get("walletId")
        tx_type = tx_data.get("type")
        tx_amount = tx_data.get("amount", 0.0)
        tx_category = tx_data.get("category")

        wallet_ref = WalletRepository.get_ref(user_id, wallet_id) if wallet_id else None
        budget_ref = None
        if tx_type == "expense" and tx_category:
            budget_doc = BudgetRepository.get_by_category(user_id, tx_category)
            if budget_doc:
                budget_ref = budget_doc.reference

        transaction = db.transaction()

        @firestore.transactional
        def process(transaction):
            # 1. READS
            wallet_snap = None
            if wallet_ref:
                wallet_snap = wallet_ref.get(transaction=transaction)
                
            budget_snap = None
            if budget_ref:
                budget_snap = budget_ref.get(transaction=transaction)

            # 2. COMPUTATIONS & WRITES
            if wallet_snap and wallet_snap.exists:
                wallet_data = wallet_snap.to_dict()
                current_balance = wallet_data.get("balance", 0.0)
                if tx_type == "income":
                    new_balance = current_balance - tx_amount
                else:
                    new_balance = current_balance + tx_amount
                transaction.update(
                    wallet_ref,
                    {"balance": new_balance}
                )

            if budget_snap and budget_snap.exists:
                b_data = budget_snap.to_dict()
                new_spent = b_data.get("spent", 0.0) - tx_amount
                new_remaining = b_data.get("monthlyLimit", 0.0) - new_spent
                transaction.update(
                    budget_ref,
                    {
                        "spent": new_spent,
                        "remaining": new_remaining
                    }
                )

            transaction.delete(transaction_ref)

        process(transaction)

        return {
            "message": "Transaction deleted successfully"
        }