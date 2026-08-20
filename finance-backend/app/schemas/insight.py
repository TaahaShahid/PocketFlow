from pydantic import BaseModel
from typing import List, Literal


class PeriodDetails(BaseModel):
    type: str
    start: str
    end: str


class SummaryDetails(BaseModel):
    totalIncome: float
    totalExpenses: float
    netCashFlow: float


class CategoryDetail(BaseModel):
    category: str
    amount: float
    percentage: float


class TopExpenseDetail(BaseModel):
    id: str
    amount: float
    category: str
    recipient: str
    date: str


class MonthlyDetail(BaseModel):
    month: str
    amount: float


class BudgetDetail(BaseModel):
    category: str
    monthlyLimit: float
    spent: float
    remaining: float
    percentageUsed: float
    status: str


class ComparisonDetail(BaseModel):
    category: str
    currentPeriodSpent: float
    previousPeriodSpent: float
    changePercentage: float


class SpendingInsightsResponse(BaseModel):
    period: PeriodDetails
    summary: SummaryDetails
    categories: List[CategoryDetail]
    topExpenses: List[TopExpenseDetail]
    monthlySpending: List[MonthlyDetail]
    monthlyIncome: List[MonthlyDetail]
    budgets: List[BudgetDetail]
    comparisons: List[ComparisonDetail]


class AISingleInsight(BaseModel):
    title: str
    description: str
    severity: Literal["info", "warning", "positive"]
    recommendation: str


class AISpendingInsightsResponse(BaseModel):
    summary: str
    insights: List[AISingleInsight]
