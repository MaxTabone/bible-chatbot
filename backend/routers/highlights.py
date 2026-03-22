from fastapi import APIRouter, Depends
from pydantic import BaseModel
from datetime import datetime
from db.database import get_db

router = APIRouter(prefix="/highlights", tags=["highlights"])

class HighlightIn(BaseModel):
    book: str
    chapter: int
    verse: int
    color: str

@router.post("")
async def create_highlight(h: HighlightIn, db=Depends(get_db)):
    now = datetime.utcnow().isoformat()
    async with db.execute(
        "INSERT OR REPLACE INTO user_highlights (book,chapter,verse,color,created_at,updated_at) VALUES (?,?,?,?,?,?)",
        (h.book, h.chapter, h.verse, h.color, now, now),
    ) as cur:
        hid = cur.lastrowid
    await db.commit()
    return {"id": hid}

@router.get("/{book}/{chapter}")
async def get_highlights(book: str, chapter: int, db=Depends(get_db)):
    async with db.execute(
        "SELECT id,verse,color FROM user_highlights WHERE book=? AND chapter=? ORDER BY verse",
        (book, chapter),
    ) as cur:
        rows = await cur.fetchall()
    return [dict(r) for r in rows]

@router.delete("/{highlight_id}")
async def delete_highlight(highlight_id: int, db=Depends(get_db)):
    await db.execute("DELETE FROM user_highlights WHERE id=?", (highlight_id,))
    await db.commit()
    return {"deleted": highlight_id}
