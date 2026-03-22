from fastapi import APIRouter, Depends, HTTPException
from db.database import get_db

router = APIRouter(prefix="/summaries", tags=["summaries"])

@router.get("/{book}/{chapter}")
async def get_summary(book: str, chapter: int, db=Depends(get_db)):
    async with db.execute(
        "SELECT summary FROM chapter_summaries WHERE book=? AND chapter=? AND language='en'",
        (book, chapter),
    ) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Summary not available for this chapter.")
    return {"book": book, "chapter": chapter, "summary": row["summary"]}
