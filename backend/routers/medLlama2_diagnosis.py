from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from services.Ollama_medLlama2_service import MedLlama2Service
import logging

from auth import verify_token

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter()
ollama_service = MedLlama2Service()

class DiagnosisRequest(BaseModel):
    symptoms: str

@router.post("/diagnose")
async def diagnose(request: DiagnosisRequest, user = Depends(verify_token)):
    try:
        logger.debug(f"Received symptoms: {request.symptoms}")
        logger.debug("Calling MedLlama2Service.get_diagnosis")
        diagnosis = await ollama_service.get_diagnosis(request.symptoms)
        logger.debug(f"Received diagnosis: {diagnosis}")
        print("User:", user["uid"])
        return {"diagnosis": diagnosis}
    except RuntimeError as e:
        logger.error(f"Ollama runtime error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ollama error: {str(e)}")
    except ValueError as e:
        logger.error(f"JSON parsing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"JSON parsing error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")