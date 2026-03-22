from fastapi import APIRouter, Depends
from pydantic import BaseModel
from datetime import datetime
from db.database import get_db

router = APIRouter(prefix="/notes", tags=["notes"])

class NoteIn(BaseModel):
    book: str
    chapter: int
    verse: int
    note_text: str

@router.post("")
async def create_note(note: NoteIn, db=Depends(get_db)):
    now = datetime.utcnow().isoformat()
    async with db.execute(
        "INSERT INTO user_notes (book,chapter,verse,note_text,created_at,updated_at) VALUES (?,?,?,?,?,?)",
        (note.book, note.chapter, note.verse, note.note_text, now, now),
    ) as cur:
        note_id = cur.lastrowid
    await db.commit()
    return {"id": note_id}

@router.get("/{book}/{chapter}")
async def get_notes(book: str, chapter: int, db=Depends(get_db)):
    async with db.execute(
        "SELECT id,book,chapter,verse,note_text,created_at,updated_at FROM user_notes WHERE book=? AND chapter=? ORDER BY verse",
        (book, chapter),
    ) as cur:
        rows = await cur.fetchall()
    return [dict(r) for r in rows]

@router.delete("/{note_id}")
async def delete_note(note_id: int, db=Depends(get_db)):
    await db.execute("DELETE FROM user_notes WHERE id=?", (note_id,))
    await db.commit()
    return {"deleted": note_id}
