from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.ai_service import stream_chat

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    book: str = "Genesis"
    chapter: int = 1
    translation: str = "KJV"

@router.post("")
async def chat(req: ChatRequest):
    async def event_generator():
        try:
            async for chunk in stream_chat(req.message, req.book, req.chapter, req.translation):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: [ERROR] {str(e)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
