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

        # 4. Generate structured content
        # Note: We use gemini-3.6-flash since new keys are guided to use the 3.6-flash models by Google.
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AISpendingInsightsResponse,
                temperature=0.2
            ),
        )

        # 5. Load the JSON response
        try:
            return json.loads(response.text)
        except Exception as e:
            # Fallback if parsing fails
            return {
                "summary": "We encountered an issue analyzing your financial data at this moment.",
                "insights": [
                    {
                        "title": "Analysis Error",
                        "description": "The AI response could not be parsed correctly.",
                        "severity": "info",
                        "recommendation": "Please try again later."
                    }
                ]
            }
