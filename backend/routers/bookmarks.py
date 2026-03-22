from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from db.database import get_db

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])

class BookmarkIn(BaseModel):
    book: str
    chapter: int
    verse: int
    label: Optional[str] = None

@router.post("")
async def create_bookmark(b: BookmarkIn, db=Depends(get_db)):
    now = datetime.utcnow().isoformat()
    async with db.execute(
        "INSERT OR REPLACE INTO user_bookmarks (book,chapter,verse,label,created_at) VALUES (?,?,?,?,?)",
        (b.book, b.chapter, b.verse, b.label, now),
    ) as cur:
        bid = cur.lastrowid
    await db.commit()
    return {"id": bid}

@router.get("")
async def get_bookmarks(db=Depends(get_db)):
    async with db.execute(
        "SELECT id,book,chapter,verse,label,created_at FROM user_bookmarks ORDER BY created_at DESC"
    ) as cur:
        rows = await cur.fetchall()
    return [dict(r) for r in rows]

@router.delete("/{bookmark_id}")
async def delete_bookmark(bookmark_id: int, db=Depends(get_db)):
    await db.execute("DELETE FROM user_bookmarks WHERE id=?", (bookmark_id,))
    await db.commit()
    return {"deleted": bookmark_id}
