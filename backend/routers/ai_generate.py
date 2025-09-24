from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from services.OpenAI_content_service import OpenAIContentService
from auth import verify_token


router = APIRouter()


class GenerateRequest(BaseModel):
    prompt: str
    type: str


@router.post("/generate")
async def generate_content(request: GenerateRequest, user = Depends(verify_token)):
    try:
        service = OpenAIContentService()
        result = await service.generate(prompt=request.prompt, content_type=request.type)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


