from __future__ import annotations

import bcrypt
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(
    user_id: str, secret_key: str, algorithm: str, expire_minutes: int
) -> str:
    expire = datetime.now(tz=timezone.utc) + timedelta(minutes=expire_minutes)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, secret_key, algorithm=algorithm)


def decode_access_token(token: str, secret_key: str, algorithm: str) -> str:
    """Returns user_id (sub claim) or raises ValueError on invalid/expired token."""
    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise ValueError("Token missing sub claim.")
        return user_id
    except JWTError as exc:
        raise ValueError("Invalid or expired token.") from exc
