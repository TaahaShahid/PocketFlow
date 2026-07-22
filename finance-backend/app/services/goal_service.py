from fastapi import HTTPException

from app.repositories.goal_repository import GoalRepository

import time
from firebase_admin import firestore

from app.core.firebase import db
from app.repositories.wallet_repository import WalletRepository
from app.repositories.transaction_repository import TransactionRepository


class GoalService:

    @staticmethod
    def get_goals(user_id: str):
        docs = GoalRepository.get_all(user_id)

        goals = []

        for doc in docs:
            goal = doc.to_dict()

            goal["id"] = doc.id

            goals.append(goal)

        return goals

    @staticmethod
    def create_goal(user_id: str, data):

        status = (
            "completed"
            if data.current_amount >= data.target_amount
            else "active"
        )

        goal_data = {
            "name": data.name,
            "targetAmount": data.target_amount,
            "currentAmount": data.current_amount,
            "deadline": data.deadline,
            "status": status,
            "createdAt": int(time.time() * 1000),
        }

        GoalRepository.create(
            user_id,
            goal_data,
        )

        return {
            "message": "Goal created successfully"
        }

    @staticmethod
    def update_goal(
        user_id: str,
        goal_id: str,
        data,
    ):
        goal_ref = GoalRepository.get_ref(
            user_id,
            goal_id,
        )

        goal_doc = goal_ref.get()

        if not goal_doc.exists:
            raise HTTPException(
                status_code=404,
                detail="Goal not found",
            )

        current_goal = goal_doc.to_dict()

        target_amount = (
            data.target_amount
            if data.target_amount is not None
            else current_goal["targetAmount"]
        )

        current_amount = (
            data.current_amount
            if data.current_amount is not None
            else current_goal["currentAmount"]
        )

        status = (
            "completed"
            if current_amount >= target_amount
            else "active"
        )

        update_data = {
            "status": status,
        }

        if data.name is not None:
            update_data["name"] = data.name

        if data.target_amount is not None:
            update_data["targetAmount"] = data.target_amount

        if data.current_amount is not None:
            update_data["currentAmount"] = data.current_amount

        if data.deadline is not None:
            update_data["deadline"] = data.deadline

        goal_ref.update(update_data)

        return {
            "message": "Goal updated successfully"
        }

    @staticmethod
    def delete_goal(
        user_id: str,
        goal_id: str,
    ):
        goal_ref = GoalRepository.get_ref(
            user_id,
            goal_id,
        )

        if not goal_ref.get().exists:
            raise HTTPException(
                status_code=404,
                detail="Goal not found",
            )

        goal_ref.delete()

        return {
            "message": "Goal deleted successfully"
        }

    @staticmethod
    def contribute_to_goal(
        user_id: str,
        goal_id: str,
        data,
    ):
        wallet_docs = list(
            WalletRepository.get_all(user_id)
        )

        if not wallet_docs:
            raise HTTPException(
                status_code=404,
                detail="No wallet found",
            )

        wallet_ref = wallet_docs[0].reference

        goal_ref = GoalRepository.get_ref(
            user_id,
            goal_id,
        )

        transaction = db.transaction()

        @firestore.transactional
        def process(transaction):

            wallet = wallet_ref.get(
                transaction=transaction
            )

            goal = goal_ref.get(
                transaction=transaction
            )

            if not goal.exists:
                raise HTTPException(
                    status_code=404,
                    detail="Goal not found",
                )

            wallet_data = wallet.to_dict()
            goal_data = goal.to_dict()

            balance = wallet_data["balance"]

            if balance < data.amount:
                raise HTTPException(
                    status_code=400,
                    detail="Insufficient funds",
                )

            new_balance = balance - data.amount

            new_amount = (
                goal_data["currentAmount"]
                + data.amount
            )

            status = (
                "completed"
                if new_amount >= goal_data["targetAmount"]
                else "active"
            )

            transaction.update(
                wallet_ref,
                {
                    "balance": new_balance,
                },
            )

            transaction.update(
                goal_ref,
                {
                    "currentAmount": new_amount,
                    "status": status,
                },
            )

            transaction_ref = (
                TransactionRepository.create_transaction_ref(
                    user_id
                )
            )

            transaction.create(
                transaction_ref,
                {
                    "walletId": wallet_ref.id,
                    "type": "expense",
                    "amount": data.amount,
                    "category": "Savings",
                    "recipientName": f"Goal: {goal_data['name']}",
                    "notes": "Goal contribution",
                    "status": "completed",
                    "date": firestore.SERVER_TIMESTAMP,
                },
            )

            return {
                "message": "Contribution successful",
                "newBalance": new_balance,
            }

        return process(transaction)