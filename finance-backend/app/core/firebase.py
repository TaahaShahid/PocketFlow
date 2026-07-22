import firebase_admin

from firebase_admin import credentials
from firebase_admin import firestore

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

cred = credentials.Certificate(
    BASE_DIR / "credentials" / "firebase-admin.json"
)

firebase_admin.initialize_app(cred)

db = firestore.client()