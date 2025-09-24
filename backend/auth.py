import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Request, HTTPException, Depends

# Init Firebase Admin SDK once
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

# Dependency for verifying ID token
async def verify_token(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid auth header")

    id_token = auth_header.split(" ")[1]

    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token  # contains uid, email, etc.
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
