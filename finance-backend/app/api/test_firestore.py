from fastapi import APIRouter

from app.core.firebase import db

router = APIRouter()


@router.get("/")
def firestore_test():

    collections = [c.id for c in db.collections()]

    return {
        "collections": collections
    }