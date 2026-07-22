from app.core.firebase import db


class GoalRepository:

    @staticmethod
    def collection(user_id: str):
        return (
            db.collection("users")
            .document(user_id)
            .collection("goals")
        )

    @staticmethod
    def get_all(user_id: str):
        return GoalRepository.collection(user_id).stream()

    @staticmethod
    def get_ref(user_id: str, goal_id: str):
        return (
            GoalRepository.collection(user_id)
            .document(goal_id)
        )

    @staticmethod
    def create(user_id: str, goal_data: dict):
        return GoalRepository.collection(user_id).add(goal_data)