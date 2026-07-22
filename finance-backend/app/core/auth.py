from fastapi import Header, HTTPException

from firebase_admin import auth


async def get_current_user(
    authorization: str = Header(...)
):
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header",
        )

    token = authorization.replace("Bearer ", "")

    try:
        decoded = auth.verify_id_token(token)
        return decoded

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid Firebase token",
        )