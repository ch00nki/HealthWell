Frontend (Next.js) – Run Locally and Deploy

## Environment variables

Create a `.env.local` in the project root with:

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000 OR Backend server

NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_FIREBASE_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_DATABASE_URL=YOUR_FIREBASE_DATABASE_URL
```

- **NEXT_PUBLIC_API_URL** must point to your FastAPI backend (local or hosted).
  - Local backend default: `http://127.0.0.1:8000` (or `http://localhost:8000`) when running `uvicorn` from `backend/`.
  - Hosted backend example: `https://api.your-domain.com`.
- All Firebase values must match the same Firebase project that your backend uses to verify tokens.

## Run locally

```bash
npm install
npm run dev
```

Navigate to `http://localhost:3000`.

Notes:
- The AI features require the backend running at `NEXT_PUBLIC_API_URL` and a logged-in Firebase user (requests include `Authorization: Bearer <idToken>`).

## Deploy to Vercel

1) Push to GitHub or import this repo into Vercel.
2) In the Vercel project settings → Environment Variables, set all of the variables listed above. For production, set:

```
NEXT_PUBLIC_API_URL=https://your-backend-domain.example.com
```

3) Deploy. After deploy, confirm the frontend can reach the backend URL and that CORS on the backend allows the Vercel domain in os.getenv(VERCEL_URL).

## Common issues

- 401 from backend: ensure you are logged in (Firebase Auth) and the frontend sends `Authorization: Bearer <idToken>`. Also verify the backend uses the same Firebase project credentials.
- Mixed envs: Vercel `NEXT_PUBLIC_*` values are public at build-time; double-check they are set in the Vercel dashboard (Project → Settings → Environment Variables).
