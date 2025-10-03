from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import flan_diagnosis, medLlama2_diagnosis, medGemma_diagnosis, ai_generate
import os
from dotenv import load_dotenv, find_dotenv

# Load .env.local explicitly
load_dotenv(find_dotenv(".env.local"))

app = FastAPI()

vercel_url = os.getenv("VERCEL_URL")
print("VERCEL_URL:", vercel_url)  # for debugging, should print 'health-well.vercel.app'

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        f"https://{vercel_url}"
    ],
    allow_methods=["POST", "OPTIONS"],  # include OPTIONS for preflight
    allow_headers=["Content-Type", "Authorization"],
)

# Include routers
app.include_router(flan_diagnosis.router, prefix="/flan")
app.include_router(medLlama2_diagnosis.router, prefix="/medLlama2")
app.include_router(medGemma_diagnosis.router, prefix="/medgemma")
app.include_router(ai_generate.router, prefix="/ai")
