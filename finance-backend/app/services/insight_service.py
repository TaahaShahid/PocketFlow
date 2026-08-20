from datetime import datetime, timedelta, timezone
from fastapi import HTTPException

from app.repositories.transaction_repository import TransactionRepository
from app.repositories.budget_repository import BudgetRepository


class InsightService:

    @staticmethod
    def to_datetime(val):
        if val is None:
            return None
        if hasattr(val, "timestamp"):
            return datetime.fromtimestamp(val.timestamp(), tz=timezone.utc)
        if isinstance(val, (int, float)):
            # Could be milliseconds or seconds
            if val > 1e11:  # Milliseconds
                return datetime.fromtimestamp(val / 1000.0, tz=timezone.utc)
            return datetime.fromtimestamp(val, tz=timezone.utc)
        return None

    @staticmethod
    def get_spending_insights(user_id: str, period: str = "month"):
        now = datetime.now(timezone.utc)

        if period == "week":
            days = 7
        elif period == "year":
            days = 365
        else:  # default to month
            days = 30

        current_end = now
        current_start = now - timedelta(days=days)
        previous_end = current_start
        previous_start = previous_end - timedelta(days=days)

        # 1. Fetch transactions
        tx_docs = TransactionRepository.get_all(user_id)
        all_txs = []
        for doc in tx_docs:
            t_data = doc.to_dict()
            t_data["id"] = doc.id
            tx_time = InsightService.to_datetime(t_data.get("date"))
            if tx_time:
                t_data["parsed_date"] = tx_time
                all_txs.append(t_data)

        # Sort all parsed transactions chronologically
        all_txs.sort(key=lambda x: x["parsed_date"])

        # Filter periods
        current_txs = [t for t in all_txs if current_start <= t["parsed_date"] <= current_end]
        previous_txs = [t for t in all_txs if previous_start <= t["parsed_date"] <= previous_end]

        # 2. Compute Summary
        current_income = sum(t["amount"] for t in current_txs if t.get("type") == "income")
        current_expenses = sum(t["amount"] for t in current_txs if t.get("type") == "expense")
        net_cash_flow = current_income - current_expenses

        # 3. Category Spending Breakdown (Current Period)
        category_spending = {}
        for t in current_txs:
            if t.get("type") == "expense":
                cat = t.get("category", "Other")
                category_spending[cat] = category_spending.get(cat, 0.0) + t["amount"]

        categories_list = []
        for cat, amt in category_spending.items():
            pct = (amt / current_expenses * 100.0) if current_expenses > 0 else 0.0
            categories_list.append({
                "category": cat,
                "amount": amt,
                "percentage": round(pct, 2)
            })
        # Sort descending by amount
        categories_list.sort(key=lambda x: x["amount"], reverse=True)

        # 4. Top Individual Expenses
        top_expenses_raw = [t for t in current_txs if t.get("type") == "expense"]
        top_expenses_raw.sort(key=lambda x: x["amount"], reverse=True)
        top_expenses_list = []
        for t in top_expenses_raw[:10]:
            recipient = t.get("recipientName") or t.get("recipient") or ""
            date_str = t["parsed_date"].isoformat().replace("+00:00", "Z")
            top_expenses_list.append({
                "id": t["id"],
                "amount": t["amount"],
                "category": t.get("category", "Other"),
                "recipient": recipient,
                "date": date_str
            })

        # 5. Monthly History Trends (Group ALL user transactions)
        monthly_exp_groups = {}
        monthly_inc_groups = {}
        month_keys_order = []  # List of (sort_key, display_name) to maintain chronological order

        for t in all_txs:
            tx_time = t["parsed_date"]
            sort_key = tx_time.strftime("%Y-%m")
            display_name = tx_time.strftime("%B %Y")
            
            if (sort_key, display_name) not in month_keys_order:
                month_keys_order.append((sort_key, display_name))

            amt = t["amount"]
            if t.get("type") == "expense":
                monthly_exp_groups[sort_key] = monthly_exp_groups.get(sort_key, 0.0) + amt
            elif t.get("type") == "income":
                monthly_inc_groups[sort_key] = monthly_inc_groups.get(sort_key, 0.0) + amt

        month_keys_order.sort(key=lambda x: x[0])  # Sort chronologically by YYYY-MM

        monthly_spending_list = []
        monthly_income_list = []
        for sort_key, display_name in month_keys_order:
            monthly_spending_list.append({
                "month": display_name,
                "amount": monthly_exp_groups.get(sort_key, 0.0)
            })
            monthly_income_list.append({
                "month": display_name,
                "amount": monthly_inc_groups.get(sort_key, 0.0)
            })

        # 6. Fetch Budgets Utilization
        budget_docs = BudgetRepository.get_all(user_id)
        budgets_list = []
        for doc in budget_docs:
            b_data = doc.to_dict()
            limit = b_data.get("monthlyLimit", 0.0)
            spent = b_data.get("spent", 0.0)
            remaining = b_data.get("remaining", limit)

            if limit > 0:
                pct = (spent / limit) * 100.0
                if pct >= 100.0:
                    status = "exceeded"
                elif pct >= 85.0:
                    status = "warning"
                else:
                    status = "healthy"
            else:
                pct = 100.0 if spent > 0 else 0.0
                status = "exceeded" if spent > 0 else "healthy"

            budgets_list.append({
                "category": b_data.get("category", "Other"),
                "monthlyLimit": limit,
                "spent": spent,
                "remaining": remaining,
                "percentageUsed": round(pct, 2),
                "status": status
            })

        # 7. Period Category Comparison
        prev_category_spending = {}
        for t in previous_txs:
            if t.get("type") == "expense":
                cat = t.get("category", "Other")
                prev_category_spending[cat] = prev_category_spending.get(cat, 0.0) + t["amount"]

        all_categories = set(category_spending.keys()).union(set(prev_category_spending.keys()))
        comparisons_list = []
        for cat in all_categories:
            curr_val = category_spending.get(cat, 0.0)
            prev_val = prev_category_spending.get(cat, 0.0)

            if prev_val > 0:
                pct_change = ((curr_val - prev_val) / prev_val) * 100.0
            else:
                pct_change = 100.0 if curr_val > 0 else 0.0

            comparisons_list.append({
                "category": cat,
                "currentPeriodSpent": curr_val,
                "previousPeriodSpent": prev_val,
                "changePercentage": round(pct_change, 2)
            })

        return {
            "period": {
                "type": period,
                "start": current_start.isoformat().replace("+00:00", "Z"),
                "end": current_end.isoformat().replace("+00:00", "Z")
            },
            "summary": {
                "totalIncome": current_income,
                "totalExpenses": current_expenses,
                "netCashFlow": net_cash_flow
            },
            "categories": categories_list,
            "topExpenses": top_expenses_list,
            "monthlySpending": monthly_spending_list,
            "monthlyIncome": monthly_income_list,
            "budgets": budgets_list,
            "comparisons": comparisons_list
        }
