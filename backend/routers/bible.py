from fastapi import APIRouter, Depends, Query
from db.database import get_db

router = APIRouter(prefix="/bible", tags=["bible"])

BOOK_NAMES = [
    "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth",
    "1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra",
    "Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon",
    "Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos",
    "Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah",
    "Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians",
    "2 Corinthians","Galatians","Ephesians","Philippians","Colossians",
    "1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon",
    "Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"
]

@router.get("/books")
async def get_books():
    return BOOK_NAMES

@router.get("/translations")
async def get_translations(db=Depends(get_db)):
    async with db.execute(
        "SELECT DISTINCT translation, language FROM bible_verses ORDER BY translation"
    ) as cur:
        rows = await cur.fetchall()
    return [{"translation": r["translation"], "language": r["language"]} for r in rows]

# NOTE: /search MUST be registered before /{book}/{chapter} to prevent
# FastAPI matching the literal string "search" as a {book} path parameter.
@router.get("/search")
async def search_verses(
    q: str = Query(..., min_length=1),
    translation: str = Query("KJV"),
    limit: int = Query(50, le=50),
    offset: int = Query(0),
    db=Depends(get_db),
):
    pattern = f"%{q}%"
    async with db.execute(
        "SELECT book, chapter, verse, text FROM bible_verses WHERE text LIKE ? AND translation=? LIMIT ? OFFSET ?",
        (pattern, translation, limit, offset),
    ) as cur:
        rows = await cur.fetchall()
    async with db.execute(
        "SELECT COUNT(*) as total FROM bible_verses WHERE text LIKE ? AND translation=?",
        (pattern, translation),
    ) as cur:
        total = (await cur.fetchone())["total"]
    return {
        "results": [{"book": r["book"], "chapter": r["chapter"], "verse": r["verse"], "text": r["text"]} for r in rows],
        "total": total,
        "limit": limit,
        "offset": offset,
    }

@router.get("/{book}/{chapter}")
async def get_chapter(
    book: str,
    chapter: int,
    translation: str = Query("KJV"),
    language: str = Query("en"),
    db=Depends(get_db),
):
    async with db.execute(
        "SELECT verse, text FROM bible_verses WHERE book=? AND chapter=? AND translation=? AND language=? ORDER BY verse",
        (book, chapter, translation, language),
    ) as cur:
        rows = await cur.fetchall()
    return [{"verse": r["verse"], "text": r["text"]} for r in rows]
