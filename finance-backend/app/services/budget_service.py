from fastapi import HTTPException

from app.repositories.budget_repository import BudgetRepository


class BudgetService:

    @staticmethod
    def get_budgets(user_id: str):
        docs = BudgetRepository.get_all(user_id)

        budgets = []

        for doc in docs:
            budget = doc.to_dict()
            budget["id"] = doc.id
            budgets.append(budget)

        return budgets

    @staticmethod
    def create_budget(user_id: str, data):

        budget_data = {
            "category": data.category,
            "monthlyLimit": data.monthly_limit,
            "spent": 0,
            "remaining": data.monthly_limit,
        }

        BudgetRepository.create(
            user_id,
            budget_data,
        )

        return {
            "message": "Budget created successfully"
        }

    @staticmethod
    def update_budget(
        user_id: str,
        budget_id: str,
        data,
    ):

        budget_ref = BudgetRepository.get_ref(
            user_id,
            budget_id,
        )

        if not budget_ref.get().exists:
            raise HTTPException(
                status_code=404,
                detail="Budget not found",
            )

        update_data = {}

        if data.category is not None:
            update_data["category"] = data.category

        if data.monthly_limit is not None:
            update_data["monthlyLimit"] = data.monthly_limit

        budget_ref.update(update_data)

        return {
            "message": "Budget updated successfully"
        }

    @staticmethod
    def delete_budget(
        user_id: str,
        budget_id: str,
    ):

        budget_ref = BudgetRepository.get_ref(
            user_id,
            budget_id,
        )

        if not budget_ref.get().exists:
            raise HTTPException(
                status_code=404,
                detail="Budget not found",
            )

        budget_ref.delete()

        return {
            "message": "Budget deleted successfully"
        }