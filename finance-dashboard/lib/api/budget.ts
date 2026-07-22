import { api } from "./client";
import { Budget } from "@/types";

export async function getBudgetsApi(): Promise<Budget[]> {
    const response = await api.get("/budgets");
    return response.data;
}

export async function createBudgetApi(
    budget: Omit<Budget, "id" | "spent" | "remaining">
) {
    const response = await api.post("/budgets", {
        category: budget.category,
        monthly_limit: budget.monthlyLimit,
    });

    return response.data;
}

export async function updateBudgetApi(
    id: string,
    budget: Partial<Budget>
) {
    const response = await api.put(`/budgets/${id}`, {
        category: budget.category,
        monthly_limit: budget.monthlyLimit,
    });

    return response.data;
}

export async function deleteBudgetApi(
    id: string
) {
    await api.delete(`/budgets/${id}`);
}