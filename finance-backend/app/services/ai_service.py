import os
import json
from google import genai
from google.genai import types

from app.core.config import settings
from app.services.insight_service import InsightService
from app.schemas.insight import AISpendingInsightsResponse


class AIService:

    @staticmethod
    def get_client():
        # Get GEMINI_API_KEY from config or environment
        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not configured in settings or environment.")
        return genai.Client(api_key=api_key)

    @staticmethod
    def get_ai_narrative(user_id: str, period: str = "month") -> dict:
        # 1. Fetch pre-calculated ground-truth analytics
        insights_data = InsightService.get_spending_insights(user_id, period)

        # 2. Get Gemini client
        client = AIService.get_client()

        # 3. Construct prompt
        prompt = f"""
You are PocketFlow's AI financial analyst. Analyze the user's spending analytics data and budget utilization metrics for the selected period.
Provide a professional, actionable summary and structural insights.

Financial Ground-Truth Data (JSON):
{json.dumps(insights_data, indent=2)}

Instructions:
1. Provide a concise, professional summary (1-2 sentences) summarizing their overall financial health, cash flow, or primary spending driver in this period.
2. Generate 1 to 4 actionable, data-backed insights. Each insight must contain:
   - title: a concise, clear title
   - description: 1-2 sentences describing the specific insight (e.g., specific budget warnings, category spikes, or cash flow trends)
   - severity: must be one of: "info", "warning", "positive"
   - recommendation: a concrete, actionable suggestion to improve their financial habit (e.g., "Consider reducing dining out to stay under your $600 Food budget")
3. Base your analysis strictly on the provided ground-truth metrics. Do not fabricate categories, amounts, or budgets.
"""

        # 4. Generate structured content and parse it
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=AISpendingInsightsResponse,
                    temperature=0.2
                ),
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"Gemini API narrative generation error: {e}")
            # Fallback if generation or parsing fails
            return {
                "summary": "We encountered an issue analyzing your financial data at this moment.",
                "insights": [
                    {
                        "title": "Analysis Error",
                        "description": "The AI response could not be compiled or parsed correctly.",
                        "severity": "info",
                        "recommendation": "Please try again later."
                    }
                ]
            }

    @staticmethod
    def get_chat_context(user_id: str) -> dict:
        # 1. Fetch Wallets & Balances
        from app.services.wallet_service import WalletService
        wallets_raw = WalletService.get_wallets(user_id)
        wallets = []
        for w in wallets_raw:
            wallets.append({
                "name": w.get("name", "Unnamed Wallet"),
                "balance": w.get("balance", 0.0),
                "type": w.get("type", "checking")
            })

        # 2. Fetch Spending Insights (month rolling period)
        insights = InsightService.get_spending_insights(user_id, "month")
        
        # Extract category spending
        category_spending = []
        for c in insights.get("categories", []):
            category_spending.append({
                "category": c.get("category"),
                "amount": c.get("amount", 0.0),
                "percentage": c.get("percentage", 0.0)
            })

        # Extract budgets
        budgets = []
        for b in insights.get("budgets", []):
            budgets.append({
                "category": b.get("category"),
                "limit": b.get("monthlyLimit", 0.0),
                "spent": b.get("spent", 0.0),
                "remaining": b.get("remaining", 0.0),
                "percentage_used": b.get("percentageUsed", 0.0),
                "status": b.get("status", "healthy")
            })

        # Extract category spending comparisons
        comparisons = []
        for cmp in insights.get("comparisons", []):
            comparisons.append({
                "category": cmp.get("category"),
                "current_spent": cmp.get("currentPeriodSpent", 0.0),
                "previous_spent": cmp.get("previousPeriodSpent", 0.0),
                "change_percentage": cmp.get("changePercentage", 0.0)
            })

        # 3. Fetch Recent Transactions (last 15)
        from app.repositories.transaction_repository import TransactionRepository
        tx_docs = TransactionRepository.get_all(user_id)
        all_txs = []
        for doc in tx_docs:
            t_data = doc.to_dict()
            tx_time = InsightService.to_datetime(t_data.get("date"))
            if tx_time:
                t_data["parsed_date"] = tx_time
                all_txs.append(t_data)

        # Sort chronologically, newest last
        all_txs.sort(key=lambda x: x["parsed_date"])
        
        # Take the 15 most recent ones
        recent_txs_raw = all_txs[-15:]
        recent_transactions = []
        for t in recent_txs_raw:
            recipient = t.get("recipientName") or t.get("recipient") or ""
            date_str = t["parsed_date"].isoformat().replace("+00:00", "Z")
            recent_transactions.append({
                "date": date_str,
                "amount": t.get("amount", 0.0),
                "type": t.get("type", "expense"),
                "category": t.get("category", "Other"),
                "recipient": recipient,
                "notes": t.get("notes") or ""
            })

        # Return full context object
        return {
            "wallets": wallets,
            "monthly_summary": {
                "total_income": insights.get("summary", {}).get("totalIncome", 0.0),
                "total_expenses": insights.get("summary", {}).get("totalExpenses", 0.0),
                "net_cash_flow": insights.get("summary", {}).get("netCashFlow", 0.0)
            },
            "category_spending": category_spending,
            "budgets": budgets,
            "spending_vs_last_month": comparisons,
            "recent_transactions": recent_transactions
        }

    @staticmethod
    def get_ai_chat_response(user_id: str, message: str) -> dict:
        # 1. Compile context
        context = AIService.get_chat_context(user_id)

        # 2. Formulate system grounding prompt
        system_instruction = f"""You are PocketFlow's AI Financial Assistant, a premium, intelligent personal finance advisor.
Analyze the user's financial context and answer their question in a natural, friendly, helpful, and concise tone.

Grounding Rules:
1. Base all your answers and explanations STRICTLY on the provided Ground-Truth Financial Context.
2. If the user asks a question that cannot be answered using the provided context, state politely that the information is currently unavailable.
3. NEVER fabricate, invent, or assume any transactions, balances, budgets, categories, or financial figures.
4. Keep numerical calculations deterministic; rely on the calculated values in the context.
5. Clearly distinguish actual facts (from the context) from your recommendations or advice.
6. Do not claim to connect to external banks or live systems outside of PocketFlow.
7. Do not expose internal technical implementations (such as database details, file paths, or system variables).

Ground-Truth Financial Context (JSON):
{json.dumps(context, indent=2)}
"""

        # 3. Call Gemini API
        client = AIService.get_client()
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=message,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.2
                ),
            )
            return {"answer": response.text}
        except Exception as e:
            print(f"Gemini API Error: {e}")
            return {
                "answer": "I'm sorry, I encountered an issue accessing my AI brain right now. Please try again in a few moments."
            }
