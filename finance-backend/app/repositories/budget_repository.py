from app.core.firebase import db


class BudgetRepository:

    @staticmethod
    def collection(user_id: str):
        return (
            db.collection("users")
            .document(user_id)
            .collection("budgets")
        )

    @staticmethod
    def get_all(user_id: str):
        return BudgetRepository.collection(user_id).stream()

    @staticmethod
    def get_ref(user_id: str, budget_id: str):
        return BudgetRepository.collection(user_id).document(budget_id)

    @staticmethod
    def create(user_id: str, budget_data: dict):
        return BudgetRepository.collection(user_id).add(
            budget_data
        )