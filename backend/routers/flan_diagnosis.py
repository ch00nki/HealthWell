from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from services.HF_flan_service import FlanService

from auth import verify_token

router = APIRouter()
flan_service = FlanService()

class DiagnosisRequest(BaseModel):
    symptoms: str

@router.post("/diagnose")
async def diagnose(request: DiagnosisRequest, user = Depends(verify_token)):
    try:
        diagnosis = await flan_service.get_diagnosis(request.symptoms)
        print("User:", user["uid"])
        return {"diagnosis": diagnosis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
