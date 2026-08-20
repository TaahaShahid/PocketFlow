import sys
sys.path.append("/Users/taahasmac/Downloads/PocketFlow/finance-backend")

import os
from dotenv import load_dotenv

# Load .env file to populate environment variables
load_dotenv()

from app.services.transaction_service import TransactionService
from app.services.budget_service import BudgetService
from app.services.wallet_service import WalletService
from app.schemas.transaction import CreateTransactionRequest, UpdateTransactionRequest
from app.schemas.budget import CreateBudgetRequest
from app.schemas.wallet import WalletCreate
from app.repositories.wallet_repository import WalletRepository
from app.repositories.budget_repository import BudgetRepository
from app.repositories.transaction_repository import TransactionRepository

USER_ID = "test-user-sync-123"


def cleanup_db():
    print("Cleaning up database for user:", USER_ID)
    # Clean up transactions
    for doc in TransactionRepository.collection(USER_ID).stream():
        doc.reference.delete()
    # Clean up budgets
    for doc in BudgetRepository.collection(USER_ID).stream():
        doc.reference.delete()
    # Clean up wallets
    for doc in WalletRepository.collection(USER_ID).stream():
        doc.reference.delete()


def run_tests():
    cleanup_db()

    # Setup Wallet
    print("\n[Setup] Creating wallet...")
    wallet_req = WalletCreate(
        cardNumber="1234567812345678",
        cardHolderName="Taaha Shahid",
        expiryDate="12/28",
        cardType="visa",
        nickname="Primary Card",
        balance=1000.0
    )
    res = WalletService.create_wallet(USER_ID, wallet_req)
    wallet_id = res["id"]
    print(f"Wallet created with ID: {wallet_id}")

    # Test A: Create Food budget: $600. Create Food expense: $100.
    # Expected: spent = $100, remaining = $500.
    print("\n[Test A] Creating Food budget of $600 and Food expense of $100...")
    budget_req = CreateBudgetRequest(category="Food", monthly_limit=600.0)
    BudgetService.create_budget(USER_ID, budget_req)

    tx_req1 = CreateTransactionRequest(
        wallet_id=wallet_id,
        type="expense",
        amount=100.0,
        category="Food",
        recipient_name="Whole Foods"
    )
    res1 = TransactionService.create_transaction(USER_ID, tx_req1)
    tx1_id = res1["transactionId"]

    budget_doc = BudgetRepository.get_by_category(USER_ID, "Food")
    budget_data = budget_doc.to_dict()
    print(f"Food budget spent: ${budget_data['spent']}, remaining: ${budget_data['remaining']}")
    assert budget_data["spent"] == 100.0
    assert budget_data["remaining"] == 500.0
    print("Test A PASSED!")

    # Test B: Create another Food expense: $50.
    # Expected: spent = $150, remaining = $450.
    print("\n[Test B] Creating second Food expense of $50...")
    tx_req2 = CreateTransactionRequest(
        wallet_id=wallet_id,
        type="expense",
        amount=50.0,
        category="Food",
        recipient_name="Uber Eats"
    )
    res2 = TransactionService.create_transaction(USER_ID, tx_req2)
    tx2_id = res2["transactionId"]

    budget_doc = BudgetRepository.get_by_category(USER_ID, "Food")
    budget_data = budget_doc.to_dict()
    print(f"Food budget spent: ${budget_data['spent']}, remaining: ${budget_data['remaining']}")
    assert budget_data["spent"] == 150.0
    assert budget_data["remaining"] == 450.0
    print("Test B PASSED!")

    # Test C: Delete the $50 transaction.
    # Expected: spent = $100, remaining = $500.
    print("\n[Test C] Deleting the $50 transaction...")
    TransactionService.delete_transaction(USER_ID, tx2_id)

    budget_doc = BudgetRepository.get_by_category(USER_ID, "Food")
    budget_data = budget_doc.to_dict()
    print(f"Food budget spent: ${budget_data['spent']}, remaining: ${budget_data['remaining']}")
    assert budget_data["spent"] == 100.0
    assert budget_data["remaining"] == 500.0
    print("Test C PASSED!")

    # Test D: Change a $100 Food expense to Entertainment.
    # Expected: Food spent decreases by $100. Entertainment spent increases by $100 if an Entertainment budget exists.
    print("\n[Test D] Changing the $100 Food expense to Entertainment...")
    print("Creating Entertainment budget first...")
    budget_req_ent = CreateBudgetRequest(category="Entertainment", monthly_limit=400.0)
    BudgetService.create_budget(USER_ID, budget_req_ent)

    update_req_ent = UpdateTransactionRequest(category="Entertainment")
    TransactionService.update_transaction(USER_ID, tx1_id, update_req_ent)

    budget_doc_food = BudgetRepository.get_by_category(USER_ID, "Food")
    print(f"Food budget spent: ${budget_doc_food.to_dict()['spent']}, remaining: ${budget_doc_food.to_dict()['remaining']}")
    assert budget_doc_food.to_dict()["spent"] == 0.0
    assert budget_doc_food.to_dict()["remaining"] == 600.0

    budget_doc_ent = BudgetRepository.get_by_category(USER_ID, "Entertainment")
    print(f"Entertainment budget spent: ${budget_doc_ent.to_dict()['spent']}, remaining: ${budget_doc_ent.to_dict()['remaining']}")
    assert budget_doc_ent.to_dict()["spent"] == 100.0
    assert budget_doc_ent.to_dict()["remaining"] == 300.0
    print("Test D PASSED!")

    # Test E: Change Entertainment expense from $100 to $150.
    # Expected: Entertainment spent increases by only $50.
    print("\n[Test E] Changing Entertainment expense from $100 to $150...")
    update_req_amt = UpdateTransactionRequest(amount=150.0)
    TransactionService.update_transaction(USER_ID, tx1_id, update_req_amt)

    budget_doc_ent = BudgetRepository.get_by_category(USER_ID, "Entertainment")
    print(f"Entertainment budget spent: ${budget_doc_ent.to_dict()['spent']}, remaining: ${budget_doc_ent.to_dict()['remaining']}")
    assert budget_doc_ent.to_dict()["spent"] == 150.0
    assert budget_doc_ent.to_dict()["remaining"] == 250.0
    print("Test E PASSED!")

    # Test F: Create an income transaction.
    # Expected: Wallet balance changes. Budget values remain unchanged.
    print("\n[Test F] Creating income transaction of $200...")
    wallet_doc = WalletRepository.collection(USER_ID).document(wallet_id).get()
    initial_balance = wallet_doc.to_dict()["balance"]
    print(f"Initial wallet balance: ${initial_balance}")

    tx_req_income = CreateTransactionRequest(
        wallet_id=wallet_id,
        type="income",
        amount=200.0,
        category="Salary",
        recipient_name="Employer"
    )
    TransactionService.create_transaction(USER_ID, tx_req_income)

    wallet_doc = WalletRepository.collection(USER_ID).document(wallet_id).get()
    new_balance = wallet_doc.to_dict()["balance"]
    print(f"New wallet balance: ${new_balance}")
    assert new_balance == initial_balance + 200.0

    budget_doc_ent = BudgetRepository.get_by_category(USER_ID, "Entertainment")
    print(f"Entertainment budget spent: ${budget_doc_ent.to_dict()['spent']}")
    assert budget_doc_ent.to_dict()["spent"] == 150.0
    print("Test F PASSED!")

    # Test G: Create an expense for a category with no budget.
    # Expected: Transaction succeeds. Wallet updates. No budget is created automatically.
    print("\n[Test G] Creating expense of $30 for a category (Travel) with no budget...")
    initial_balance = new_balance
    print(f"Initial wallet balance: ${initial_balance}")

    tx_req_no_budget = CreateTransactionRequest(
        wallet_id=wallet_id,
        type="expense",
        amount=30.0,
        category="Travel",
        recipient_name="Gas Station"
    )
    res_no_b = TransactionService.create_transaction(USER_ID, tx_req_no_budget)
    assert res_no_b["success"] is True

    wallet_doc = WalletRepository.collection(USER_ID).document(wallet_id).get()
    final_balance = wallet_doc.to_dict()["balance"]
    print(f"Final wallet balance: ${final_balance}")
    assert final_balance == initial_balance - 30.0

    budget_doc_travel = BudgetRepository.get_by_category(USER_ID, "Travel")
    print(f"Travel budget doc exists: {budget_doc_travel is not None}")
    assert budget_doc_travel is None
    print("Test G PASSED!")

    cleanup_db()
    print("\nAll integration synchronization tests A to G passed successfully! 🎉")


if __name__ == "__main__":
    run_tests()
