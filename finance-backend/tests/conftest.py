import os
import base64
import json
import sys
from unittest.mock import MagicMock

# 1. Setup dummy environment variables before any app code imports settings
os.environ["FIREBASE_SERVICE_ACCOUNT_B64"] = base64.b64encode(json.dumps({"dummy": True}).encode()).decode()
os.environ["PROJECT_NAME"] = "PocketFlow Test"
os.environ["API_VERSION"] = "v1"

# 2. Mock firebase_admin modules to prevent connecting to actual Firebase APIs during tests
mock_firebase_admin = MagicMock()
mock_firebase_admin._apps = []
mock_credentials = MagicMock()
mock_firestore = MagicMock()

mock_db = MagicMock()
mock_firestore.client.return_value = mock_db

sys.modules['firebase_admin'] = mock_firebase_admin
sys.modules['firebase_admin.credentials'] = mock_credentials
sys.modules['firebase_admin.firestore'] = mock_firestore
