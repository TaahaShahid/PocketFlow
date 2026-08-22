import pytest
from unittest.mock import patch
from datetime import datetime, timezone, timedelta
from app.services.insight_service import InsightService


class MockDoc:
    def __init__(self, doc_id, data):
        self.id = doc_id
        self._data = data

    def to_dict(self):
        return self._data


# Helper to get current UTC datetime
def get_utc_now():
    return datetime.now(timezone.utc)


def test_no_transactions():
    with patch("app.repositories.transaction_repository.TransactionRepository.get_all", return_value=[]), \
         patch("app.repositories.budget_repository.BudgetRepository.get_all", return_value=[]):
        res = InsightService.get_spending_insights("test-user", "month")
        
        assert res["summary"]["totalIncome"] == 0.0
        assert res["summary"]["totalExpenses"] == 0.0
        assert res["summary"]["netCashFlow"] == 0.0
        assert len(res["categories"]) == 0
        assert len(res["topExpenses"]) == 0
        assert len(res["monthlySpending"]) == 0
        assert len(res["monthlyIncome"]) == 0
        assert len(res["budgets"]) == 0
        assert len(res["comparisons"]) == 0


def test_income_only():
    now = get_utc_now()
    txs = [
        MockDoc("t1", {"type": "income", "amount": 500.0, "category": "Salary", "date": now})
    ]
    with patch("app.repositories.transaction_repository.TransactionRepository.get_all", return_value=txs), \
         patch("app.repositories.budget_repository.BudgetRepository.get_all", return_value=[]):
        res = InsightService.get_spending_insights("test-user", "month")
        
        assert res["summary"]["totalIncome"] == 500.0
        assert res["summary"]["totalExpenses"] == 0.0
        assert res["summary"]["netCashFlow"] == 500.0
        assert len(res["categories"]) == 0


def test_expenses_only():
    now = get_utc_now()
    txs = [
        MockDoc("t1", {"type": "expense", "amount": 150.0, "category": "Food", "recipientName": "Whole Foods", "date": now})
    ]
    with patch("app.repositories.transaction_repository.TransactionRepository.get_all", return_value=txs), \
         patch("app.repositories.budget_repository.BudgetRepository.get_all", return_value=[]):
        res = InsightService.get_spending_insights("test-user", "month")
        
        assert res["summary"]["totalIncome"] == 0.0
        assert res["summary"]["totalExpenses"] == 150.0
        assert res["summary"]["netCashFlow"] == -150.0
        assert len(res["categories"]) == 1
        assert res["categories"][0]["category"] == "Food"
        assert res["categories"][0]["amount"] == 150.0
        assert res["categories"][0]["percentage"] == 100.0


def test_income_and_expenses():
    now = get_utc_now()
    txs = [
        MockDoc("t1", {"type": "income", "amount": 1000.0, "category": "Salary", "date": now}),
        MockDoc("t2", {"type": "expense", "amount": 250.0, "category": "Bills", "date": now})
    ]
    with patch("app.repositories.transaction_repository.TransactionRepository.get_all", return_value=txs), \
         patch("app.repositories.budget_repository.BudgetRepository.get_all", return_value=[]):
        res = InsightService.get_spending_insights("test-user", "month")
        
        assert res["summary"]["totalIncome"] == 1000.0
        assert res["summary"]["totalExpenses"] == 250.0
        assert res["summary"]["netCashFlow"] == 750.0


def test_multiple_categories():
    now = get_utc_now()
    txs = [
        MockDoc("t1", {"type": "expense", "amount": 150.0, "category": "Food", "date": now}),
        MockDoc("t2", {"type": "expense", "amount": 50.0, "category": "Entertainment", "date": now})
    ]
    with patch("app.repositories.transaction_repository.TransactionRepository.get_all", return_value=txs), \
         patch("app.repositories.budget_repository.BudgetRepository.get_all", return_value=[]):
        res = InsightService.get_spending_insights("test-user", "month")
        
        assert res["summary"]["totalExpenses"] == 200.0
        assert len(res["categories"]) == 2
        # Food should be first (larger amount)
        assert res["categories"][0]["category"] == "Food"
        assert res["categories"][0]["amount"] == 150.0
        assert res["categories"][0]["percentage"] == 75.0
        assert res["categories"][1]["category"] == "Entertainment"
        assert res["categories"][1]["amount"] == 50.0
        assert res["categories"][1]["percentage"] == 25.0


def test_multiple_months():
    now = get_utc_now()
    prev_month_date = now - timedelta(days=45)
    txs = [
        MockDoc("t1", {"type": "expense", "amount": 100.0, "category": "Food", "date": now}),
        MockDoc("t2", {"type": "expense", "amount": 200.0, "category": "Food", "date": prev_month_date})
    ]
    with patch("app.repositories.transaction_repository.TransactionRepository.get_all", return_value=txs), \
         patch("app.repositories.budget_repository.BudgetRepository.get_all", return_value=[]):
        res = InsightService.get_spending_insights("test-user", "month")
        
        # MonthlySpending should show 2 months sorted chronologically
        assert len(res["monthlySpending"]) == 2
        assert res["monthlySpending"][0]["amount"] == 200.0  # 45 days ago is previous month
        assert res["monthlySpending"][1]["amount"] == 100.0  # now is current month


def test_budget_utilization_and_status():
    budgets = [
        MockDoc("b1", {"category": "Food", "monthlyLimit": 500.0, "spent": 200.0, "remaining": 300.0}),
        MockDoc("b2", {"category": "Entertainment", "monthlyLimit": 200.0, "spent": 180.0, "remaining": 20.0}),
        MockDoc("b3", {"category": "Travel", "monthlyLimit": 100.0, "spent": 120.0, "remaining": -20.0}),
        MockDoc("b4", {"category": "Empty", "monthlyLimit": 0.0, "spent": 0.0, "remaining": 0.0}),
        MockDoc("b5", {"category": "ZeroLimitSpent", "monthlyLimit": 0.0, "spent": 10.0, "remaining": -10.0})
    ]
    with patch("app.repositories.transaction_repository.TransactionRepository.get_all", return_value=[]), \
         patch("app.repositories.budget_repository.BudgetRepository.get_all", return_value=budgets):
        res = InsightService.get_spending_insights("test-user", "month")
        
        budgets_res = res["budgets"]
        assert len(budgets_res) == 5
        
        # Food: 40% used -> healthy
        food_b = next(b for b in budgets_res if b["category"] == "Food")
        assert food_b["percentageUsed"] == 40.0
        assert food_b["status"] == "healthy"
        
        # Entertainment: 90% used -> warning
        ent_b = next(b for b in budgets_res if b["category"] == "Entertainment")
        assert ent_b["percentageUsed"] == 90.0
        assert ent_b["status"] == "warning"
        
        # Travel: 120% used -> exceeded
        trv_b = next(b for b in budgets_res if b["category"] == "Travel")
        assert trv_b["percentageUsed"] == 120.0
        assert trv_b["status"] == "exceeded"

        # Empty: limit=0 spent=0 -> 0% used, healthy
        empty_b = next(b for b in budgets_res if b["category"] == "Empty")
        assert empty_b["percentageUsed"] == 0.0
        assert empty_b["status"] == "healthy"

        # ZeroLimitSpent: limit=0 spent=10 -> exceeded
        zls_b = next(b for b in budgets_res if b["category"] == "ZeroLimitSpent")
        assert zls_b["status"] == "exceeded"


def test_period_comparison():
    now = get_utc_now()
    prev_period_date = now - timedelta(days=45)
    txs = [
        # Current Period
        MockDoc("t1", {"type": "expense", "amount": 200.0, "category": "Food", "date": now}),
        # Previous Period
        MockDoc("t2", {"type": "expense", "amount": 100.0, "category": "Food", "date": prev_period_date})
    ]
    with patch("app.repositories.transaction_repository.TransactionRepository.get_all", return_value=txs), \
         patch("app.repositories.budget_repository.BudgetRepository.get_all", return_value=[]):
        res = InsightService.get_spending_insights("test-user", "month")
        
        comparisons = res["comparisons"]
        assert len(comparisons) == 1
        comp = comparisons[0]
        assert comp["category"] == "Food"
        assert comp["currentPeriodSpent"] == 200.0
        assert comp["previousPeriodSpent"] == 100.0
        assert comp["changePercentage"] == 100.0  # +100% change


def test_ai_narrative_generation():
    from unittest.mock import MagicMock
    import json
    from app.services.ai_service import AIService

    dummy_response = {
        "summary": "AI summary text.",
        "insights": [
            {
                "title": "AI Insight Title",
                "description": "AI description.",
                "severity": "positive",
                "recommendation": "AI recommendation."
            }
        ]
    }

    mock_client = MagicMock()
    mock_gen_response = MagicMock()
    mock_gen_response.text = json.dumps(dummy_response)
    mock_client.models.generate_content.return_value = mock_gen_response

    with patch("app.services.insight_service.InsightService.get_spending_insights", return_value={"mock": "data"}), \
         patch("app.services.ai_service.AIService.get_client", return_value=mock_client):
        
        res = AIService.get_ai_narrative("test-user", "month")
        
        assert res["summary"] == "AI summary text."
        assert len(res["insights"]) == 1
        assert res["insights"][0]["title"] == "AI Insight Title"
        assert res["insights"][0]["severity"] == "positive"
        mock_client.models.generate_content.assert_called_once()


def test_ai_narrative_generation_failure_fallback():
    from unittest.mock import MagicMock
    from app.services.ai_service import AIService

    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = Exception("API Quota Exceeded")

    with patch("app.services.insight_service.InsightService.get_spending_insights", return_value={"mock": "data"}), \
         patch("app.services.ai_service.AIService.get_client", return_value=mock_client):
        
        res = AIService.get_ai_narrative("test-user", "month")
        
        assert "issue analyzing your financial data" in res["summary"]
        assert len(res["insights"]) == 1
        assert res["insights"][0]["title"] == "Analysis Error"
        mock_client.models.generate_content.assert_called_once()


def test_ai_chat_context_assembly():
    from app.services.ai_service import AIService
    now = get_utc_now()
    txs = [
        MockDoc("t1", {"type": "expense", "amount": 100.0, "category": "Food", "recipientName": "McDonalds", "notes": "Lunch", "date": now}),
        MockDoc("t2", {"type": "income", "amount": 2500.0, "category": "Salary", "date": now})
    ]

    with patch("app.services.wallet_service.WalletService.get_wallets", return_value=[{"name": "Checking", "balance": 1500.0, "type": "checking"}]), \
         patch("app.repositories.transaction_repository.TransactionRepository.get_all", return_value=txs):
        
        context = AIService.get_chat_context("test-user")
        
        assert len(context["wallets"]) == 1
        assert context["wallets"][0]["name"] == "Checking"
        assert context["wallets"][0]["balance"] == 1500.0
        
        assert context["monthly_summary"]["total_income"] == 2500.0
        assert context["monthly_summary"]["total_expenses"] == 100.0
        
        assert len(context["category_spending"]) == 1
        assert context["category_spending"][0]["category"] == "Food"
        assert context["category_spending"][0]["amount"] == 100.0
        
        assert len(context["recent_transactions"]) == 2
        # Txs sorted chronologically: t1 then t2
        assert context["recent_transactions"][0]["amount"] == 100.0
        assert context["recent_transactions"][0]["recipient"] == "McDonalds"
        assert context["recent_transactions"][0]["notes"] == "Lunch"


def test_ai_chat_response():
    from unittest.mock import MagicMock
    from app.services.ai_service import AIService

    mock_client = MagicMock()
    mock_gen_response = MagicMock()
    mock_gen_response.text = "Mocked AI assistant response message."
    mock_client.models.generate_content.return_value = mock_gen_response

    with patch("app.services.ai_service.AIService.get_chat_context", return_value={"mock": "context"}), \
         patch("app.services.ai_service.AIService.get_client", return_value=mock_client):
        
        res = AIService.get_ai_chat_response("test-user", "How much did I spend?")
        
        assert res["answer"] == "Mocked AI assistant response message."
        mock_client.models.generate_content.assert_called_once()
