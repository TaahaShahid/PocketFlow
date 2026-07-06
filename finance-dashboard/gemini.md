# Project: JM Solutionss Personal Finance Dashboard

## System Overview
- **Objective:** Build a personal finance dashboard for tracking income, expenses, savings, and budgets.
- **Scope:** Monitor financial health, view transaction history, manage cards, and track spending against budget limits.

## Navigation Structure
- **Top Navigation Tabs:**
  - Dashboard (Default)
  - Transactions
  - Wallet
  - Goals
  - Analytics
  - Reports
- **Header Elements:**
  - Dark/Light mode toggle
  - Settings
  - Search
  - Notifications
  - User profile (Name & Avatar)

## Dashboard Page Layout
- **Key Metrics Section (4 Cards):**
  - **Total Balance:** Current total balance, percentage change from last month (indicator for +/-).
  - **Income:** Total monthly income, percentage change from last month.
  - **Expense:** Total monthly expenses, percentage change from last month.
  - **Total Savings:** Income minus expenses, percentage change from last month.

- **Total Income Chart:**
  - **Type:** Bar chart.
  - **Functionality:** Time period selector (This month, Last 3 months, Last 6 months, This year).
  - **Data Split:** Segmented by Fixed Income and Variable Income.

## Transaction Workflow
1. **Input/Capture:** Trigger "Add Transaction" modal.
   - Fields: Amount (Numeric), Category (Dropdown), Date (Picker), Wallet/Account (Dropdown), Notes (Optional).
2. **Processing/Validation:**
   - Check required fields.
   - Trigger error messages if validation fails.
   - Apply automatic categorization.
3. **Persistence:**
   - Update state (LocalStorage/IndexedDB).
   - Refresh Wallet balance.
   - Update Analytics categories.
4. **Output:**
   - Refresh Dashboard metrics.
   - Display success toast notification.
   - Append to transaction history feed.

---

# Development Rules

- Follow every specification in `brandGuidelines.md`.
- Never invent colors, typography, spacing, or component styles.
- Build reusable React components.
- Use strict TypeScript.
- Prefer clean architecture over quick implementations.
- Keep business logic separate from UI.
- Prepare the project for future backend integration.

---

# Technology Stack

- Framework: Next.js (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- UI Components: shadcn/ui
- Icons: Lucide React
- Charts: Recharts
- Animations: Framer Motion
- Forms: React Hook Form + Zod
- State Management: Zustand
- Storage: LocalStorage (future migration to Supabase/Firebase)

---

# Pages

## Dashboard
- Financial overview
- Metric cards
- Income & Expense charts
- Recent transactions
- Goal progress
- Budget summary

## Transactions
- Search
- Filters
- Sort
- Pagination
- Add/Edit/Delete transaction
- Transaction history

## Wallet
- Display cards/accounts
- Total wallet balance
- Add/Edit/Delete cards
- Card balances

## Goals
- Savings goals
- Progress bars
- Deadlines
- Contribution tracking

## Analytics
- Spending by category
- Income vs Expense
- Monthly trends
- Budget utilization

## Reports
- Monthly, yearly and custom reports
- Export (PDF/CSV ready)
- Financial summaries

---

# Shared Components

Use reusable components throughout the application.

- Sidebar
- Header
- Breadcrumb
- Search Bar
- Metric Card
- Dashboard Card
- Wallet Card
- Goal Card
- Transaction Table
- Chart Card
- Progress Bar
- Button
- Input
- Select
- Date Picker
- Modal
- Dialog
- Toast
- Pagination
- Loading Skeleton
- Empty State

---

# Data Model

## User

```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "avatar": "string | null",
  "currency": "string (USD, EUR, PKR, etc.)",
  "monthlySpendingLimit": "number",
  "createdAt": "timestamp"
}
```

## Transaction

```json
{
  "id": "string",
  "type": "income | expense",
  "amount": "number",
  "category": "string",
  "walletId": "string",
  "recipientName": "string",
  "status": "completed | pending | failed",
  "date": "timestamp",
  "notes": "string | null",
  "createdAt": "timestamp"
}
```

## Category

```json
{
  "id": "string",
  "name": "string",
  "type": "income | expense | budget",
  "icon": "string"
}
```

## Card

```json
{
  "id": "string",
  "cardNumber": "string (masked, last 4 only)",
  "cardHolderName": "string",
  "expiryDate": "MM/YY",
  "cardType": "visa | mastercard | amex | other",
  "nickname": "string | null",
  "balance": "number",
  "createdAt": "timestamp"
}
```

## Goal

```json
{
  "id": "string",
  "name": "string",
  "targetAmount": "number",
  "currentAmount": "number",
  "deadline": "timestamp",
  "status": "active | completed",
  "createdAt": "timestamp"
}
```

## Budget

```json
{
  "id": "string",
  "category": "string",
  "monthlyLimit": "number",
  "spent": "number",
  "remaining": "number"
}
```

---

# Features for MVP

- Dashboard overview
- Wallet management
- Transaction management
- Savings goals
- Budget tracking
- Transaction history with filters
- Basic analytics charts
- Reports
- Local data storage
- Dark/Light mode

---

# Features to Exclude from MVP

- Bank account sync (Plaid)
- Payment processing
- Multi-user accounts
- Notifications
- OCR / Receipt scanning
- Cloud backup
- Currency conversion
- Investment tracking
- AI financial assistant

---

# Technical Requirements

## Data Storage

- Persist all data locally (LocalStorage or IndexedDB)
- Data survives browser refresh
- Structure data for future cloud migration

## Charts

- Interactive charts with tooltips
- Responsive sizing
- Time period filters

## Forms

- Validation on every form
- Friendly error messages
- Confirmation dialog before delete
- Success toast notifications

## Performance

- Fast loading
- Smooth animations
- Handle 1000+ transactions efficiently

---

# Validation Rules

Transactions
- Amount must be greater than zero
- Category is required
- Wallet is required
- Date is required

Goals
- Target amount must be positive
- Deadline cannot be in the past

Wallet
- Store only masked card numbers
- Never store CVV or sensitive payment information

---

# Responsive Design

Desktop (1280px+)
- Full sidebar
- Multi-column layout

Tablet
- Collapsible sidebar
- Responsive charts

Mobile
- Drawer navigation
- Single-column layout
- Touch-friendly controls

---

# Empty States

Display helpful placeholders when data is unavailable.

Examples:
- "No transactions yet."
- "Create your first savings goal."
- "Add your first wallet."
- "No reports available."

---

# Accessibility

- Keyboard navigation
- Semantic HTML
- Visible focus states
- Proper ARIA labels
- WCAG AA contrast

---

# Folder Structure

```
app/
components/
components/dashboard/
components/transactions/
components/wallet/
components/goals/
components/analytics/
components/reports/
components/shared/
hooks/
lib/
types/
utils/
constants/
```

---

# AI Development Rules

- Follow `brandGuidelines.md` exactly.
- Never hardcode colors or spacing.
- Build reusable components.
- Keep components focused on a single responsibility.
- Separate UI, business logic, and utilities.
- Use realistic sample financial data.
- Prefer composition over duplicated code.
- Generate production-quality TypeScript.
- Design the project for future backend integration without changing the UI layer.

---

# Summary

Build a modern personal finance dashboard for **JM Solutionss** with Dashboard, Transactions, Wallet, Goals, Analytics, and Reports. Focus on a clean UI, reusable components, responsive layouts, strict TypeScript, local-first storage, and an architecture that can later integrate with Firebase, Supabase, or any REST API without major refactoring.