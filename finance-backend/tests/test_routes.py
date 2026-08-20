import pytest
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.fixture
def anyio_backend():
    return "asyncio"

# Mock implementation of get_current_user
async def mock_get_current_user():
    return {"uid": "test-user-123", "email": "test@example.com"}

@pytest.mark.anyio
async def test_root():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "PocketFlow Backend Running 🚀"}

@pytest.mark.anyio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data
    assert "version" in data

@pytest.mark.anyio
async def test_get_wallets_authenticated():
    from app.core.auth import get_current_user
    app.dependency_overrides[get_current_user] = mock_get_current_user
    
    dummy_wallets = [
        {"id": "w1", "nickname": "Test Wallet", "balance": 100.0, "createdAt": 1700000000}
    ]
    
    with patch("app.services.wallet_service.WalletService.get_wallets", return_value=dummy_wallets) as mock_get:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as ac:
            response = await ac.get("/wallets")
        
        assert response.status_code == 200
        assert response.json() == dummy_wallets
        mock_get.assert_called_once_with("test-user-123")
    
    app.dependency_overrides.clear()

@pytest.mark.anyio
async def test_get_budgets_authenticated():
    from app.core.auth import get_current_user
    app.dependency_overrides[get_current_user] = mock_get_current_user
    
    dummy_budgets = [
        {"id": "b1", "category": "Food", "monthlyLimit": 500.0, "spent": 200.0, "remaining": 300.0}
    ]
    
    with patch("app.services.budget_service.BudgetService.get_budgets", return_value=dummy_budgets) as mock_get:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as ac:
            response = await ac.get("/budgets")
        
        assert response.status_code == 200
        assert response.json() == dummy_budgets
        
    app.dependency_overrides.clear()


@pytest.mark.anyio
async def test_get_spending_insights_authenticated():
    from app.core.auth import get_current_user
    app.dependency_overrides[get_current_user] = mock_get_current_user
    
    dummy_insights = {
        "period": {
            "type": "month",
            "start": "2026-08-19T00:00:00Z",
            "end": "2026-08-19T14:00:00Z"
        },
        "summary": {
            "totalIncome": 1000.0,
            "totalExpenses": 400.0,
            "netCashFlow": 600.0
        },
        "categories": [
            {"category": "Food", "amount": 400.0, "percentage": 100.0}
        ],
        "topExpenses": [],
        "monthlySpending": [],
        "monthlyIncome": [],
        "budgets": [],
        "comparisons": []
    }
    
    with patch("app.services.insight_service.InsightService.get_spending_insights", return_value=dummy_insights) as mock_get:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as ac:
            response = await ac.get("/insights/spending?period=month")
        
        assert response.status_code == 200
        assert response.json() == dummy_insights
        mock_get.assert_called_once_with("test-user-123", "month")
        
    app.dependency_overrides.clear()


@pytest.mark.anyio
async def test_get_ai_narrative_authenticated():
    from app.core.auth import get_current_user
    app.dependency_overrides[get_current_user] = mock_get_current_user
    
    dummy_narrative = {
        "summary": "AI Generated summary.",
        "insights": [
            {
                "title": "Warning Title",
                "description": "Insight description.",
                "severity": "warning",
                "recommendation": "Try spending less."
            }
        ]
    }
    
    with patch("app.services.ai_service.AIService.get_ai_narrative", return_value=dummy_narrative) as mock_get:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as ac:
            response = await ac.get("/insights/ai-narrative?period=month")
        
        assert response.status_code == 200
        assert response.json() == dummy_narrative
        mock_get.assert_called_once_with("test-user-123", "month")
        
    app.dependency_overrides.clear()
