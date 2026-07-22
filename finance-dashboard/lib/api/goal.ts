import { api } from "./client";
import { Goal } from "@/types";

export async function getGoalsApi(): Promise<Goal[]> {
    const response = await api.get("/goals");
    return response.data;
}

export async function createGoalApi(
    goal: Omit<Goal, "id" | "createdAt" | "status">
) {
    const response = await api.post("/goals", {
        name: goal.name,
        target_amount: goal.targetAmount,
        current_amount: goal.currentAmount,
        deadline: goal.deadline,
    });

    return response.data;
}

export async function updateGoalApi(
    id: string,
    goal: Partial<Goal>
) {
    const response = await api.put(`/goals/${id}`, {
        name: goal.name,
        target_amount: goal.targetAmount,
        current_amount: goal.currentAmount,
        deadline: goal.deadline,
    });

    return response.data;
}

export async function deleteGoalApi(id: string) {
    await api.delete(`/goals/${id}`);
}

export async function contributeToGoalApi(
    goalId: string,
    amount: number
) {
    const response = await api.post(
        `/goals/${goalId}/contribute`,
        {
            amount,
        }
    );

    return response.data;
}