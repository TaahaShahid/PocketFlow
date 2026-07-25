import base64
import json

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

from app.core.config import settings


cred_dict = json.loads(
    base64.b64decode(
        settings.FIREBASE_SERVICE_ACCOUNT_B64
    ).decode("utf-8")
)

cred = credentials.Certificate(cred_dict)

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()