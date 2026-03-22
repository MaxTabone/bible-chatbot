# Bible Chatbot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a locally-run Catholic Bible reader web app with AI chat, notes, highlights, bookmarks, voice reading, streaks, and a learn section.

**Architecture:** Python FastAPI backend serves a REST + SSE API backed by SQLite; React frontend renders the Bible reader, chat panel, and floating notepad. The Claude Agent SDK powers the chat endpoint. Bible text is imported from public-domain sources into SQLite at setup time.

**Tech Stack:** Python 3.11+, FastAPI, SQLite (aiosqlite), Claude Agent SDK (anthropic), React 18, Vite, React Router, pytest, Vitest

---

## File Map

```
backend/
  main.py                          # FastAPI app, CORS, router mounting
  .env.example                     # ANTHROPIC_API_KEY placeholder
  requirements.txt
  db/
    database.py                    # SQLite connection, get_db dependency
    schema.sql                     # CREATE TABLE statements
    init_db.py                     # Runs schema.sql on startup
  routers/
    bible.py                       # /bible/* endpoints
    notes.py                       # /notes endpoints
    highlights.py                  # /highlights endpoints
    bookmarks.py                   # /bookmarks endpoints
    streaks.py                     # /streaks endpoints
    chat.py                        # /chat SSE endpoint
    summaries.py                   # /summaries endpoint
  services/
    ai_service.py                  # Claude Agent SDK streaming logic
  data/
    learn/                         # 8 markdown articles
  scripts/
    import_bible.py                # Downloads + imports Bible text into SQLite
    generate_summaries.py          # Batch generates chapter summaries via Claude
  tests/
    conftest.py                    # pytest fixtures (test DB, test client)
    test_bible.py
    test_notes.py
    test_highlights.py
    test_bookmarks.py
    test_streaks.py
    test_summaries.py

frontend/
  package.json
  vite.config.js
  index.html
  src/
    main.jsx                       # React entry point
    App.jsx                        # Router setup
    api.js                         # All fetch calls to backend
    components/
      Navbar.jsx                   # Top bar: nav, translation, zoom, voice, streak
      BibleReader.jsx              # Verse list with highlight + bookmark controls
      ChatPanel.jsx                # SSE chat UI
      Notepad.jsx                  # Draggable floating notepad
      VoiceReader.jsx              # Web Speech API controls
      StreakBadge.jsx              # Streak counter display
      VerseRow.jsx                 # Single verse with highlight/note/bookmark icons
    pages/
      Home.jsx                     # Main reader page (layout)
      LearnPage.jsx                # Article list + article view
      BookmarksPage.jsx            # All bookmarks
    hooks/
      useHighlights.js
      useNotes.js
      useBookmarks.js
      useStreaks.js
      useVoice.js
    tests/
      api.test.js
      BibleReader.test.jsx
      ChatPanel.test.jsx
      Notepad.test.jsx
```

---

## Task 1: Project Scaffold & Environment

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/.env.example`
- Create: `backend/main.py`
- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.jsx`
- Create: `frontend/src/App.jsx`
- Create: `README.md`

- [ ] **Step 1: Create backend requirements.txt**

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
aiosqlite==0.20.0
anthropic==0.28.0
python-dotenv==1.0.1
httpx==0.27.0
pytest==8.2.0
pytest-asyncio==0.23.6
```

Save to `backend/requirements.txt`.

- [ ] **Step 2: Create .env.example**

```
ANTHROPIC_API_KEY=your_api_key_here
```

Save to `backend/.env.example`. Copy to `backend/.env` and fill in your real key.

- [ ] **Step 3: Install backend dependencies**

```bash
cd backend
python -m venv venv
source venv/Scripts/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

- [ ] **Step 4: Create backend/main.py**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.init_db import init_db
from routers import bible, notes, highlights, bookmarks, streaks, chat, summaries

app = FastAPI(title="Bible Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await init_db()

app.include_router(bible.router)
app.include_router(notes.router)
app.include_router(highlights.router)
app.include_router(bookmarks.router)
app.include_router(streaks.router)
app.include_router(chat.router)
app.include_router(summaries.router)
```

- [ ] **Step 5: Scaffold React app with Vite**

```bash
cd frontend
npm create vite@latest . -- --template react
npm install
npm install react-router-dom
```

- [ ] **Step 6: Create frontend/vite.config.js**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        rewrite: path => path.replace(/^\/api/, '')
      }
    }
  }
})
```

- [ ] **Step 7: Create frontend/src/App.jsx**

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import LearnPage from './pages/LearnPage'
import BookmarksPage from './pages/BookmarksPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/bookmarks" element={<BookmarksPage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 8: Create README.md at project root**

```markdown
# Bible Chatbot

## Setup

### Backend
\`\`\`bash
cd backend
python -m venv venv
source venv/Scripts/activate
pip install -r requirements.txt
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
python scripts/import_bible.py
uvicorn main:app --reload
\`\`\`

### Frontend
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

Open http://localhost:5173
```

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "feat: project scaffold — FastAPI backend + React/Vite frontend"
```

---

## Task 2: Database Setup

**Files:**
- Create: `backend/db/schema.sql`
- Create: `backend/db/database.py`
- Create: `backend/db/init_db.py`
- Create: `backend/tests/conftest.py`

- [ ] **Step 1: Create backend/db/schema.sql**

```sql
CREATE TABLE IF NOT EXISTS bible_verses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  text TEXT NOT NULL,
  translation TEXT NOT NULL,
  language TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bible_lookup
  ON bible_verses(book, chapter, translation, language);

CREATE INDEX IF NOT EXISTS idx_bible_search
  ON bible_verses(text, translation);

CREATE TABLE IF NOT EXISTS chapter_summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  summary TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  UNIQUE(book, chapter, language)
);

CREATE TABLE IF NOT EXISTS user_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  note_text TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_highlights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  color TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(book, chapter, verse)
);

CREATE TABLE IF NOT EXISTS user_bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  label TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(book, chapter, verse)
);

CREATE TABLE IF NOT EXISTS user_streaks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  visited INTEGER NOT NULL DEFAULT 1
);
```

- [ ] **Step 2: Create backend/db/database.py**

```python
import aiosqlite
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "bible_app.db")

async def get_db():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        yield db
```

- [ ] **Step 3: Create backend/db/init_db.py**

```python
import aiosqlite
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "bible_app.db")
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "schema.sql")

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        with open(SCHEMA_PATH) as f:
            await db.executescript(f.read())
        await db.commit()
```

- [ ] **Step 4: Create backend/tests/conftest.py**

```python
import pytest
import pytest_asyncio
import aiosqlite
from httpx import AsyncClient, ASGITransport
from db.init_db import init_db
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

TEST_DB = ":memory:"

@pytest_asyncio.fixture
async def db():
    async with aiosqlite.connect(TEST_DB) as conn:
        conn.row_factory = aiosqlite.Row
        schema = open(os.path.join(os.path.dirname(__file__), "..", "db", "schema.sql")).read()
        await conn.executescript(schema)
        yield conn

@pytest_asyncio.fixture
async def client(db):
    from main import app
    from db.database import get_db

    # Override get_db so tests use the in-memory DB, not the real file
    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
```

- [ ] **Step 5: Verify DB initialises**

```bash
cd backend
python -c "import asyncio; from db.init_db import init_db; asyncio.run(init_db()); print('DB OK')"
```

Expected: `DB OK` and `bible_app.db` file created.

- [ ] **Step 6: Commit**

```bash
git add backend/db/ backend/tests/conftest.py
git commit -m "feat: SQLite schema and database connection setup"
```

---

## Task 3: Bible Import Script

**Files:**
- Create: `backend/scripts/import_bible.py`

- [ ] **Step 1: Install requests for the script**

```bash
pip install requests
```

- [ ] **Step 2: Create backend/scripts/import_bible.py**

This script downloads the KJV, ASV, and WEB translations from openbible.info (CSV format) and imports them into SQLite.

```python
"""
Downloads public domain Bible translations and imports into bible_app.db.
Run once: python scripts/import_bible.py
"""
import sqlite3
import csv
import io
import os
import sys
import requests

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "bible_app.db")

TRANSLATIONS = {
    "KJV": {
        "url": "https://raw.githubusercontent.com/scrollmapper/bible_databases/master/csv/t_kjv.csv",
        "language": "en",
    },
    "ASV": {
        "url": "https://raw.githubusercontent.com/scrollmapper/bible_databases/master/csv/t_asv.csv",
        "language": "en",
    },
    "WEB": {
        "url": "https://raw.githubusercontent.com/scrollmapper/bible_databases/master/csv/t_web.csv",
        "language": "en",
    },
}

# Maps numeric book IDs (1-66) to canonical book names
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

def import_translation(conn, name, url, language):
    print(f"Downloading {name}...")
    r = requests.get(url, timeout=30)
    r.raise_for_status()
    reader = csv.DictReader(io.StringIO(r.text))
    rows = []
    for row in reader:
        book_id = int(row["b"]) - 1
        book = BOOK_NAMES[book_id]
        chapter = int(row["c"])
        verse = int(row["v"])
        text = row["t"].strip()
        rows.append((book, chapter, verse, text, name, language))
    conn.executemany(
        "INSERT OR IGNORE INTO bible_verses (book,chapter,verse,text,translation,language) VALUES (?,?,?,?,?,?)",
        rows
    )
    conn.commit()
    print(f"  Imported {len(rows)} verses for {name}")

def main():
    conn = sqlite3.connect(DB_PATH)
    for name, info in TRANSLATIONS.items():
        import_translation(conn, name, info["url"], info["language"])
    conn.close()
    print("Import complete.")

if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Run the import script**

```bash
cd backend
python scripts/import_bible.py
```

Expected output:
```
Downloading KJV...
  Imported 31102 verses for KJV
Downloading ASV...
  Imported 31102 verses for ASV
Downloading WEB...
  Imported 31102 verses for WEB
Import complete.
```

- [ ] **Step 4: Verify data**

```bash
python -c "
import sqlite3
conn = sqlite3.connect('bible_app.db')
count = conn.execute('SELECT COUNT(*) FROM bible_verses').fetchone()[0]
sample = conn.execute('SELECT book,chapter,verse,text FROM bible_verses WHERE translation=\"KJV\" AND book=\"John\" AND chapter=3 AND verse=16').fetchone()
print(f'Total verses: {count}')
print(f'John 3:16 KJV: {sample[3][:60]}')
"
```

Expected: `Total verses: 93306` (3 translations × 31102)

- [ ] **Step 5: Commit**

```bash
git add backend/scripts/import_bible.py
git commit -m "feat: Bible import script — KJV, ASV, WEB from public domain CSV"
```

---

## Task 4: Bible API Router

**Files:**
- Create: `backend/routers/bible.py`
- Create: `backend/routers/__init__.py`
- Create: `backend/tests/test_bible.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_bible.py`:

```python
import pytest
import pytest_asyncio

@pytest.mark.asyncio
async def test_get_books(client):
    r = await client.get("/bible/books")
    assert r.status_code == 200
    data = r.json()
    assert "Genesis" in data
    assert "Revelation" in data

@pytest.mark.asyncio
async def test_get_chapter(client, db):
    await db.execute(
        "INSERT INTO bible_verses (book,chapter,verse,text,translation,language) VALUES (?,?,?,?,?,?)",
        ("John", 3, 16, "For God so loved the world", "KJV", "en")
    )
    await db.commit()
    r = await client.get("/bible/John/3?translation=KJV&language=en")
    assert r.status_code == 200
    verses = r.json()
    assert verses[0]["verse"] == 16
    assert "loved" in verses[0]["text"]

@pytest.mark.asyncio
async def test_get_translations(client, db):
    await db.execute(
        "INSERT INTO bible_verses (book,chapter,verse,text,translation,language) VALUES (?,?,?,?,?,?)",
        ("Genesis", 1, 1, "In the beginning", "KJV", "en")
    )
    await db.commit()
    r = await client.get("/bible/translations")
    assert r.status_code == 200

@pytest.mark.asyncio
async def test_search(client, db):
    await db.execute(
        "INSERT INTO bible_verses (book,chapter,verse,text,translation,language) VALUES (?,?,?,?,?,?)",
        ("John", 3, 16, "For God so loved the world", "KJV", "en")
    )
    await db.commit()
    r = await client.get("/bible/search?q=loved&translation=KJV&limit=50&offset=0")
    assert r.status_code == 200
    results = r.json()
    assert len(results["results"]) >= 1

@pytest.mark.asyncio
async def test_search_no_results(client):
    r = await client.get("/bible/search?q=xyzzynotaword&translation=KJV&limit=50&offset=0")
    assert r.status_code == 200
    assert r.json()["results"] == []
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd backend
pytest tests/test_bible.py -v
```

Expected: errors (router not yet created)

- [ ] **Step 3: Create backend/routers/__init__.py** (empty file)

- [ ] **Step 4: Create backend/routers/bible.py**

```python
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

```

- [ ] **Step 5: Run tests**

```bash
pytest tests/test_bible.py -v
```

Expected: all pass

- [ ] **Step 6: Commit**

```bash
git add backend/routers/ backend/tests/test_bible.py
git commit -m "feat: Bible API router — books, chapter, translations, search"
```

---

## Task 5: Notes, Highlights, Bookmarks Routers

**Files:**
- Create: `backend/routers/notes.py`
- Create: `backend/routers/highlights.py`
- Create: `backend/routers/bookmarks.py`
- Create: `backend/tests/test_notes.py`
- Create: `backend/tests/test_highlights.py`
- Create: `backend/tests/test_bookmarks.py`

- [ ] **Step 1: Write failing tests for notes**

Create `backend/tests/test_notes.py`:

```python
import pytest

@pytest.mark.asyncio
async def test_create_and_get_note(client):
    r = await client.post("/notes", json={"book":"John","chapter":3,"verse":16,"note_text":"Key verse"})
    assert r.status_code == 200
    note_id = r.json()["id"]
    r2 = await client.get("/notes/John/3")
    assert any(n["id"] == note_id for n in r2.json())

@pytest.mark.asyncio
async def test_delete_note(client):
    r = await client.post("/notes", json={"book":"John","chapter":3,"verse":1,"note_text":"Test"})
    note_id = r.json()["id"]
    r2 = await client.delete(f"/notes/{note_id}")
    assert r2.status_code == 200
    r3 = await client.get("/notes/John/3")
    assert not any(n["id"] == note_id for n in r3.json())
```

- [ ] **Step 2: Write failing tests for highlights**

Create `backend/tests/test_highlights.py`:

```python
import pytest

@pytest.mark.asyncio
async def test_create_and_get_highlight(client):
    r = await client.post("/highlights", json={"book":"John","chapter":3,"verse":16,"color":"#FFFF00"})
    assert r.status_code == 200
    r2 = await client.get("/highlights/John/3")
    assert any(h["verse"] == 16 for h in r2.json())

@pytest.mark.asyncio
async def test_delete_highlight(client):
    r = await client.post("/highlights", json={"book":"Genesis","chapter":1,"verse":1,"color":"#FF0000"})
    hid = r.json()["id"]
    r2 = await client.delete(f"/highlights/{hid}")
    assert r2.status_code == 200
```

- [ ] **Step 3: Write failing tests for bookmarks**

Create `backend/tests/test_bookmarks.py`:

```python
import pytest

@pytest.mark.asyncio
async def test_create_and_get_bookmark(client):
    r = await client.post("/bookmarks", json={"book":"John","chapter":3,"verse":16,"label":"Favourite"})
    assert r.status_code == 200
    r2 = await client.get("/bookmarks")
    assert any(b["book"] == "John" for b in r2.json())

@pytest.mark.asyncio
async def test_delete_bookmark(client):
    r = await client.post("/bookmarks", json={"book":"Genesis","chapter":1,"verse":1})
    bid = r.json()["id"]
    r2 = await client.delete(f"/bookmarks/{bid}")
    assert r2.status_code == 200
```

- [ ] **Step 4: Run all three test files — confirm failures**

```bash
pytest tests/test_notes.py tests/test_highlights.py tests/test_bookmarks.py -v
```

Expected: errors (routers not created)

- [ ] **Step 5: Create backend/routers/notes.py**

```python
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
```

- [ ] **Step 6: Create backend/routers/highlights.py**

```python
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
```

- [ ] **Step 7: Create backend/routers/bookmarks.py**

```python
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
```

- [ ] **Step 8: Run all tests**

```bash
pytest tests/test_notes.py tests/test_highlights.py tests/test_bookmarks.py -v
```

Expected: all pass

- [ ] **Step 9: Commit**

```bash
git add backend/routers/notes.py backend/routers/highlights.py backend/routers/bookmarks.py backend/tests/
git commit -m "feat: notes, highlights, bookmarks API endpoints"
```

---

## Task 6: Streaks & Summaries Routers

**Files:**
- Create: `backend/routers/streaks.py`
- Create: `backend/routers/summaries.py`
- Create: `backend/tests/test_streaks.py`
- Create: `backend/tests/test_summaries.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_streaks.py`:

```python
import pytest

@pytest.mark.asyncio
async def test_checkin_and_get_streak(client):
    r = await client.post("/streaks/checkin")
    assert r.status_code == 200
    r2 = await client.get("/streaks")
    data = r2.json()
    assert data["current_streak"] >= 1
    assert "longest_streak" in data
    assert "history" in data

@pytest.mark.asyncio
async def test_checkin_is_idempotent(client):
    await client.post("/streaks/checkin")
    await client.post("/streaks/checkin")
    r = await client.get("/streaks")
    assert r.json()["current_streak"] == 1
```

Create `backend/tests/test_summaries.py`:

```python
import pytest

@pytest.mark.asyncio
async def test_get_summary(client, db):
    await db.execute(
        "INSERT INTO chapter_summaries (book,chapter,summary,language) VALUES (?,?,?,?)",
        ("John", 3, "Jesus talks to Nicodemus about being born again.", "en")
    )
    await db.commit()
    r = await client.get("/summaries/John/3")
    assert r.status_code == 200
    assert "Nicodemus" in r.json()["summary"]

@pytest.mark.asyncio
async def test_missing_summary_returns_404(client):
    r = await client.get("/summaries/Obadiah/1")
    assert r.status_code == 404
```

- [ ] **Step 2: Run to confirm failures**

```bash
pytest tests/test_streaks.py tests/test_summaries.py -v
```

- [ ] **Step 3: Create backend/routers/streaks.py**

```python
from fastapi import APIRouter, Depends
from datetime import date, timedelta
from db.database import get_db

router = APIRouter(prefix="/streaks", tags=["streaks"])

@router.post("/checkin")
async def checkin(db=Depends(get_db)):
    today = date.today().isoformat()
    await db.execute(
        "INSERT OR IGNORE INTO user_streaks (date, visited) VALUES (?, 1)", (today,)
    )
    await db.commit()
    return {"date": today, "checked_in": True}

@router.get("")
async def get_streaks(db=Depends(get_db)):
    async with db.execute(
        "SELECT date FROM user_streaks ORDER BY date DESC"
    ) as cur:
        rows = await cur.fetchall()
    dates = [r["date"] for r in rows]
    current_streak = _calc_streak(dates)
    longest_streak = _calc_longest(dates)
    return {"current_streak": current_streak, "longest_streak": longest_streak, "history": dates}

def _calc_streak(dates: list[str]) -> int:
    if not dates:
        return 0
    today = date.today()
    streak = 0
    check = today
    date_set = set(dates)
    while check.isoformat() in date_set:
        streak += 1
        check -= timedelta(days=1)
    return streak

def _calc_longest(dates: list[str]) -> int:
    if not dates:
        return 0
    sorted_dates = sorted(set(dates))
    longest = current = 1
    for i in range(1, len(sorted_dates)):
        a = date.fromisoformat(sorted_dates[i - 1])
        b = date.fromisoformat(sorted_dates[i])
        if (b - a).days == 1:
            current += 1
            longest = max(longest, current)
        else:
            current = 1
    return longest
```

- [ ] **Step 4: Create backend/routers/summaries.py**

```python
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
```

- [ ] **Step 5: Run tests**

```bash
pytest tests/test_streaks.py tests/test_summaries.py -v
```

Expected: all pass

- [ ] **Step 6: Commit**

```bash
git add backend/routers/streaks.py backend/routers/summaries.py backend/tests/test_streaks.py backend/tests/test_summaries.py
git commit -m "feat: streaks and chapter summaries endpoints"
```

---

## Task 7: AI Chat Endpoint (Claude Agent SDK + SSE)

**Files:**
- Create: `backend/services/ai_service.py`
- Create: `backend/routers/chat.py`

- [ ] **Step 1: Create backend/services/ai_service.py**

```python
import os
from anthropic import AsyncAnthropic
from dotenv import load_dotenv

load_dotenv()

client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """You are a knowledgeable and friendly Catholic Christian Bible guide.
You help users understand Scripture from a Catholic perspective.
You explain verses in plain, simple language that anyone can understand.
You can give historical context, theological explanation, and comparisons between translations.
You do not fabricate Bible references. You answer questions about Catholic teachings, sacraments, and traditions.
Keep responses clear, warm, and accessible."""

async def stream_chat(message: str, book: str, chapter: int, translation: str):
    user_content = f"[Context: currently reading {book} chapter {chapter} ({translation} translation)]\n\n{message}"
    async with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    ) as stream:
        async for text in stream.text_stream:
            yield text
```

- [ ] **Step 2: Create backend/routers/chat.py**

```python
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
```

- [ ] **Step 3: Manual smoke test**

Start the backend:
```bash
cd backend
uvicorn main:app --reload
```

In a second terminal:
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What does John 3:16 mean?","book":"John","chapter":3,"translation":"KJV"}' \
  --no-buffer
```

Expected: streaming text output, ending with `data: [DONE]`

- [ ] **Step 4: Commit**

```bash
git add backend/services/ backend/routers/chat.py
git commit -m "feat: streaming AI chat endpoint via Claude Agent SDK + SSE"
```

---

## Task 8: Chapter Summary Generator Script

**Files:**
- Create: `backend/scripts/generate_summaries.py`

- [ ] **Step 1: Create backend/scripts/generate_summaries.py**

```python
"""
Generates plain-language summaries for all 1,189 Bible chapters using Claude.
Run once after importing Bible data: python scripts/generate_summaries.py
This will take some time and consume API tokens.
"""
import sqlite3
import os
import asyncio
from anthropic import AsyncAnthropic
from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "bible_app.db")
client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

async def summarise_chapter(book: str, chapter: int, verses: list[str]) -> str:
    text = "\n".join(f"v{i+1}: {v}" for i, v in enumerate(verses))
    message = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        messages=[{
            "role": "user",
            "content": f"Write a 2-3 sentence plain-language summary of {book} chapter {chapter} suitable for a general Catholic reader. Be simple and clear.\n\n{text[:3000]}"
        }]
    )
    return message.content[0].text.strip()

async def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    chapters = conn.execute(
        "SELECT DISTINCT book, chapter FROM bible_verses WHERE translation='KJV' ORDER BY rowid"
    ).fetchall()

    existing = set(
        (r["book"], r["chapter"])
        for r in conn.execute("SELECT book, chapter FROM chapter_summaries").fetchall()
    )

    todo = [(r["book"], r["chapter"]) for r in chapters if (r["book"], r["chapter"]) not in existing]
    print(f"Generating {len(todo)} summaries (skipping {len(existing)} already done)...")

    for book, chapter in todo:
        verses = [
            r["text"] for r in conn.execute(
                "SELECT text FROM bible_verses WHERE book=? AND chapter=? AND translation='KJV' ORDER BY verse",
                (book, chapter)
            ).fetchall()
        ]
        try:
            summary = await summarise_chapter(book, chapter, verses)
            conn.execute(
                "INSERT OR REPLACE INTO chapter_summaries (book,chapter,summary,language) VALUES (?,?,?,'en')",
                (book, chapter, summary)
            )
            conn.commit()
            print(f"  {book} {chapter}: done")
        except Exception as e:
            print(f"  {book} {chapter}: ERROR — {e}")
        await asyncio.sleep(0.3)  # avoid rate limits

    conn.close()
    print("Summary generation complete.")

if __name__ == "__main__":
    asyncio.run(main())
```

- [ ] **Step 2: Run the script (this takes time — can be run in background)**

```bash
cd backend
python scripts/generate_summaries.py
```

Note: Uses `claude-haiku` to minimise cost. ~1,189 API calls. Can be interrupted and resumed — it skips already-generated summaries.

- [ ] **Step 3: Commit**

```bash
git add backend/scripts/generate_summaries.py
git commit -m "feat: batch chapter summary generator script using Claude Haiku"
```

---

## Task 9: Learn Section Content

**Files:**
- Create: `backend/data/learn/sacraments.md`
- Create: `backend/data/learn/mortal-venial-sin.md`
- Create: `backend/data/learn/commandments.md`
- Create: `backend/data/learn/beatitudes.md`
- Create: `backend/data/learn/rosary.md`
- Create: `backend/data/learn/apostles-creed.md`
- Create: `backend/data/learn/works-of-mercy.md`
- Create: `backend/data/learn/last-four-things.md`
- Modify: `backend/routers/summaries.py` → add learn article endpoints

- [ ] **Step 1: Create the 8 markdown articles**

Create `backend/data/learn/sacraments.md`:

```markdown
# The 7 Sacraments

The Catholic Church has seven sacraments — sacred rituals that convey God's grace.

1. **Baptism** — Cleanses original sin and welcomes you into the Church.
2. **Confirmation** — Strengthens your faith through the Holy Spirit.
3. **Eucharist** — Receiving the Body and Blood of Christ at Mass.
4. **Reconciliation (Confession)** — Forgiveness of sins through a priest.
5. **Anointing of the Sick** — Spiritual and sometimes physical healing for the seriously ill.
6. **Holy Orders** — Ordination of deacons, priests, and bishops.
7. **Matrimony** — The sacred covenant of marriage between a man and a woman.
```

Create `backend/data/learn/mortal-venial-sin.md`:

```markdown
# Mortal vs Venial Sin

**Mortal sin** is a serious offense against God. For a sin to be mortal, three conditions must be met: it must involve grave matter, you must know it is seriously wrong, and you must freely choose to do it. Mortal sin breaks your relationship with God and requires Confession to restore it.

**Venial sin** is a less serious offense. It weakens your relationship with God but does not break it completely. You can be forgiven of venial sins through prayer, Mass, and acts of charity — though Confession is always encouraged.
```

Create `backend/data/learn/commandments.md`:

```markdown
# The 10 Commandments

Given to Moses by God on Mount Sinai (Exodus 20):

1. I am the Lord your God — you shall have no other gods before me.
2. You shall not take the name of the Lord your God in vain.
3. Remember the Sabbath day and keep it holy.
4. Honour your father and your mother.
5. You shall not kill.
6. You shall not commit adultery.
7. You shall not steal.
8. You shall not bear false witness against your neighbour.
9. You shall not covet your neighbour's wife.
10. You shall not covet your neighbour's goods.
```

Create `backend/data/learn/beatitudes.md`:

```markdown
# The Beatitudes

The Beatitudes are teachings of Jesus from the Sermon on the Mount (Matthew 5:3-12). They describe the attitudes and actions that bring true happiness and God's blessing.

- **Blessed are the poor in spirit** — theirs is the kingdom of heaven.
- **Blessed are those who mourn** — they will be comforted.
- **Blessed are the meek** — they will inherit the earth.
- **Blessed are those who hunger and thirst for righteousness** — they will be filled.
- **Blessed are the merciful** — they will receive mercy.
- **Blessed are the pure in heart** — they will see God.
- **Blessed are the peacemakers** — they will be called children of God.
- **Blessed are those persecuted for righteousness** — theirs is the kingdom of heaven.
```

Create `backend/data/learn/rosary.md`:

```markdown
# The Rosary

The Rosary is a Catholic prayer that meditates on the life of Jesus and Mary through a set of beads. It is divided into four sets of Mysteries:

**Joyful Mysteries** (Mon/Sat): The Annunciation, Visitation, Nativity, Presentation, Finding in the Temple.

**Sorrowful Mysteries** (Tue/Fri): Agony in the Garden, Scourging, Crowning with Thorns, Carrying the Cross, Crucifixion.

**Glorious Mysteries** (Wed/Sun): Resurrection, Ascension, Descent of the Holy Spirit, Assumption of Mary, Coronation of Mary.

**Luminous Mysteries** (Thu): Baptism of Jesus, Wedding at Cana, Proclamation of the Kingdom, Transfiguration, Institution of the Eucharist.

Each decade consists of one Our Father, ten Hail Marys, and one Glory Be.
```

Create `backend/data/learn/apostles-creed.md`:

```markdown
# The Apostles' Creed

The Apostles' Creed is one of the oldest statements of Christian faith, summarising what Catholics believe:

*I believe in God, the Father Almighty, Creator of heaven and earth; and in Jesus Christ, His only Son, our Lord; who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died, and was buried. He descended into hell; the third day He rose again from the dead; He ascended into heaven, and sits at the right hand of God the Father Almighty; from thence He shall come to judge the living and the dead. I believe in the Holy Spirit, the holy Catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body, and life everlasting. Amen.*
```

Create `backend/data/learn/works-of-mercy.md`:

```markdown
# The Works of Mercy

The Works of Mercy are charitable actions rooted in the teachings of Jesus, particularly Matthew 25.

**Corporal Works of Mercy** (caring for the body):
- Feed the hungry
- Give drink to the thirsty
- Clothe the naked
- Shelter the homeless
- Visit the sick
- Visit the imprisoned
- Bury the dead

**Spiritual Works of Mercy** (caring for the soul):
- Instruct the ignorant
- Counsel the doubtful
- Admonish sinners
- Bear wrongs patiently
- Forgive offences willingly
- Comfort the afflicted
- Pray for the living and the dead
```

Create `backend/data/learn/last-four-things.md`:

```markdown
# The Last Four Things

Catholic teaching encourages meditation on the "Four Last Things" — the final realities that await every person:

**1. Death** — The end of earthly life and the moment of final accounting. We do not know when it will come.

**2. Judgement** — Particular Judgement happens immediately after death; God judges the soul based on its life. The Final Judgement at the end of time will be revealed to all.

**3. Heaven** — Eternal life in the presence of God. The ultimate goal of the Christian life.

**4. Hell** — Eternal separation from God, chosen by those who die in unrepentant mortal sin.

Reflecting on these realities helps us live with purpose and turn towards God each day.
```

- [ ] **Step 2: Add a learn articles endpoint to the backend**

Add a new router `backend/routers/learn.py`:

```python
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
import os

router = APIRouter(prefix="/learn", tags=["learn"])

LEARN_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "learn")

ARTICLES = [
    {"slug": "sacraments",         "title": "The 7 Sacraments"},
    {"slug": "mortal-venial-sin",  "title": "Mortal vs Venial Sin"},
    {"slug": "commandments",       "title": "The 10 Commandments"},
    {"slug": "beatitudes",         "title": "The Beatitudes"},
    {"slug": "rosary",             "title": "The Rosary"},
    {"slug": "apostles-creed",     "title": "The Apostles' Creed"},
    {"slug": "works-of-mercy",     "title": "Works of Mercy"},
    {"slug": "last-four-things",   "title": "The Last Four Things"},
]

@router.get("")
async def list_articles():
    return ARTICLES

@router.get("/{slug}")
async def get_article(slug: str):
    path = os.path.join(LEARN_DIR, f"{slug}.md")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Article not found.")
    with open(path, encoding="utf-8") as f:
        content = f.read()
    return {"slug": slug, "content": content}
```

Register it in `backend/main.py` — add `from routers import learn` and `app.include_router(learn.router)`.

- [ ] **Step 3: Commit**

```bash
git add backend/data/learn/ backend/routers/learn.py backend/main.py
git commit -m "feat: learn section — 8 Catholic articles + /learn API endpoints"
```

---

## Task 10: Frontend — API Client & Base Layout

**Files:**
- Create: `frontend/src/api.js`
- Create: `frontend/src/pages/Home.jsx`
- Create: `frontend/src/pages/LearnPage.jsx`
- Create: `frontend/src/pages/BookmarksPage.jsx`
- Create: `frontend/src/index.css`

- [ ] **Step 1: Create frontend/src/api.js**

```js
const BASE = '/api'

export async function getBooks() {
  const r = await fetch(`${BASE}/bible/books`)
  return r.json()
}

export async function getChapter(book, chapter, translation = 'KJV', language = 'en') {
  const r = await fetch(`${BASE}/bible/${encodeURIComponent(book)}/${chapter}?translation=${translation}&language=${language}`)
  return r.json()
}

export async function getTranslations() {
  const r = await fetch(`${BASE}/bible/translations`)
  return r.json()
}

export async function searchVerses(q, translation = 'KJV', limit = 50, offset = 0) {
  const r = await fetch(`${BASE}/bible/search?q=${encodeURIComponent(q)}&translation=${translation}&limit=${limit}&offset=${offset}`)
  return r.json()
}

export async function getSummary(book, chapter) {
  const r = await fetch(`${BASE}/summaries/${encodeURIComponent(book)}/${chapter}`)
  if (r.status === 404) return null
  return r.json()
}

export async function getNotes(book, chapter) {
  const r = await fetch(`${BASE}/notes/${encodeURIComponent(book)}/${chapter}`)
  return r.json()
}

export async function createNote(book, chapter, verse, note_text) {
  const r = await fetch(`${BASE}/notes`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({book,chapter,verse,note_text}) })
  return r.json()
}

export async function deleteNote(id) {
  return fetch(`${BASE}/notes/${id}`, { method: 'DELETE' })
}

export async function getHighlights(book, chapter) {
  const r = await fetch(`${BASE}/highlights/${encodeURIComponent(book)}/${chapter}`)
  return r.json()
}

export async function createHighlight(book, chapter, verse, color) {
  const r = await fetch(`${BASE}/highlights`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({book,chapter,verse,color}) })
  return r.json()
}

export async function deleteHighlight(id) {
  return fetch(`${BASE}/highlights/${id}`, { method: 'DELETE' })
}

export async function getBookmarks() {
  const r = await fetch(`${BASE}/bookmarks`)
  return r.json()
}

export async function createBookmark(book, chapter, verse, label) {
  const r = await fetch(`${BASE}/bookmarks`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({book,chapter,verse,label}) })
  return r.json()
}

export async function deleteBookmark(id) {
  return fetch(`${BASE}/bookmarks/${id}`, { method: 'DELETE' })
}

export async function checkin() {
  return fetch(`${BASE}/streaks/checkin`, { method: 'POST' })
}

export async function getStreaks() {
  const r = await fetch(`${BASE}/streaks`)
  return r.json()
}

export async function getLearnArticles() {
  const r = await fetch(`${BASE}/learn`)
  return r.json()
}

export async function getLearnArticle(slug) {
  const r = await fetch(`${BASE}/learn/${slug}`)
  return r.json()
}
```

- [ ] **Step 2: Create global CSS in frontend/src/index.css**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: Georgia, 'Times New Roman', serif;
  background: #1a1a2e;
  color: #e0d7c6;
  min-height: 100vh;
}

.app-layout {
  display: grid;
  grid-template-rows: 56px 1fr;
  grid-template-columns: 1fr 340px;
  height: 100vh;
  overflow: hidden;
}

.navbar { grid-column: 1 / -1; }
.reader-area { overflow-y: auto; padding: 24px 32px; }
.chat-area { border-left: 1px solid #2e2e4e; overflow: hidden; display: flex; flex-direction: column; }

a { color: #a89de0; text-decoration: none; }
a:hover { text-decoration: underline; }

button {
  cursor: pointer;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 14px;
  background: #2e2e4e;
  color: #e0d7c6;
}
button:hover { background: #3e3e6e; }
button.primary { background: #5b4fcf; color: white; }
button.primary:hover { background: #7066d8; }
```

- [ ] **Step 3: Create placeholder page files**

Create `frontend/src/pages/Home.jsx`:

```jsx
import Navbar from '../components/Navbar'
import BibleReader from '../components/BibleReader'
import ChatPanel from '../components/ChatPanel'
import Notepad from '../components/Notepad'

export default function Home() {
  return (
    <div className="app-layout">
      <div className="navbar"><Navbar /></div>
      <div className="reader-area"><BibleReader /></div>
      <div className="chat-area"><ChatPanel /></div>
      <Notepad />
    </div>
  )
}
```

Create `frontend/src/pages/LearnPage.jsx` and `frontend/src/pages/BookmarksPage.jsx` as stubs:

```jsx
// LearnPage.jsx
export default function LearnPage() { return <div style={{padding:32}}><h1>Learn</h1></div> }

// BookmarksPage.jsx
export default function BookmarksPage() { return <div style={{padding:32}}><h1>Bookmarks</h1></div> }
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/api.js frontend/src/index.css frontend/src/pages/
git commit -m "feat: frontend API client, global styles, page layout shells"
```

---

## Task 11: Navbar & StreakBadge Components

**Files:**
- Create: `frontend/src/components/Navbar.jsx`
- Create: `frontend/src/components/StreakBadge.jsx`
- Create: `frontend/src/hooks/useStreaks.js`

- [ ] **Step 1: Create frontend/src/hooks/useStreaks.js**

```js
import { useState, useEffect } from 'react'
import { checkin, getStreaks } from '../api'

export function useStreaks() {
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const lastCheckin = localStorage.getItem('lastCheckin')
    if (lastCheckin !== today) {
      checkin().then(() => {
        localStorage.setItem('lastCheckin', today)
      })
    }
    getStreaks().then(data => setStreak(data.current_streak))
  }, [])

  return streak
}
```

- [ ] **Step 2: Create frontend/src/components/StreakBadge.jsx**

```jsx
export default function StreakBadge({ streak }) {
  if (!streak) return null
  return (
    <span style={{ fontSize: 14, color: '#f4a261', fontFamily: 'sans-serif' }}>
      🔥 {streak} day{streak !== 1 ? 's' : ''}
    </span>
  )
}
```

- [ ] **Step 3: Create frontend/src/components/Navbar.jsx**

```jsx
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getBooks, getTranslations } from '../api'
import StreakBadge from './StreakBadge'
import { useStreaks } from '../hooks/useStreaks'

export default function Navbar({ book, chapter, translation, language, onNav, onTranslationChange, fontSize, onFontSize }) {
  const [books, setBooks] = useState([])
  const [translations, setTranslations] = useState([])
  const streak = useStreaks()

  useEffect(() => {
    getBooks().then(setBooks)
    getTranslations().then(setTranslations)
  }, [])

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px',
      height: 56, background: '#12122a', borderBottom: '1px solid #2e2e4e',
      fontFamily: 'sans-serif', fontSize: 14
    }}>
      <Link to="/" style={{ fontWeight: 'bold', color: '#a89de0', fontSize: 18 }}>Bible</Link>

      <select value={book} onChange={e => onNav(e.target.value, 1)}
        style={{ background: '#2e2e4e', color: '#e0d7c6', border: 'none', borderRadius: 4, padding: '4px 8px' }}>
        {books.map(b => <option key={b} value={b}>{b}</option>)}
      </select>

      <input type="number" min={1} value={chapter}
        onChange={e => onNav(book, parseInt(e.target.value) || 1)}
        style={{ width: 56, background: '#2e2e4e', color: '#e0d7c6', border: 'none', borderRadius: 4, padding: '4px 8px' }} />

      <select value={translation} onChange={e => onTranslationChange(e.target.value, language)}
        style={{ background: '#2e2e4e', color: '#e0d7c6', border: 'none', borderRadius: 4, padding: '4px 8px' }}>
        {translations.map(t => (
          <option key={t.translation} value={t.translation}>{t.translation} ({t.language})</option>
        ))}
      </select>

      <button onClick={() => onFontSize(Math.max(12, fontSize - 2))}>A-</button>
      <button onClick={() => onFontSize(Math.min(32, fontSize + 2))}>A+</button>

      <div style={{ marginLeft: 'auto' }}>
        <StreakBadge streak={streak} />
      </div>

      <Link to="/learn" style={{ color: '#a89de0' }}>Learn</Link>
      <Link to="/bookmarks" style={{ color: '#a89de0' }}>Bookmarks</Link>
    </nav>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Navbar.jsx frontend/src/components/StreakBadge.jsx frontend/src/hooks/useStreaks.js
git commit -m "feat: Navbar with book/chapter/translation selectors and streak badge"
```

---

## Task 12: BibleReader Component

**Files:**
- Create: `frontend/src/components/BibleReader.jsx`
- Create: `frontend/src/components/VerseRow.jsx`
- Create: `frontend/src/hooks/useHighlights.js`
- Create: `frontend/src/hooks/useNotes.js`
- Create: `frontend/src/hooks/useBookmarks.js`

- [ ] **Step 1: Create frontend/src/hooks/useHighlights.js**

```js
import { useState, useEffect } from 'react'
import { getHighlights, createHighlight, deleteHighlight } from '../api'

export function useHighlights(book, chapter) {
  const [highlights, setHighlights] = useState({}) // verse -> {id, color}

  useEffect(() => {
    if (!book || !chapter) return
    getHighlights(book, chapter).then(data => {
      const map = {}
      data.forEach(h => { map[h.verse] = { id: h.id, color: h.color } })
      setHighlights(map)
    })
  }, [book, chapter])

  const toggle = async (verse, color) => {
    if (highlights[verse]) {
      await deleteHighlight(highlights[verse].id)
      setHighlights(prev => { const n = {...prev}; delete n[verse]; return n })
    } else {
      const result = await createHighlight(book, chapter, verse, color)
      setHighlights(prev => ({ ...prev, [verse]: { id: result.id, color } }))
    }
  }

  return { highlights, toggle }
}
```

- [ ] **Step 2: Create frontend/src/hooks/useNotes.js**

```js
import { useState, useEffect } from 'react'
import { getNotes, createNote, deleteNote } from '../api'

export function useNotes(book, chapter) {
  const [notes, setNotes] = useState({}) // verse -> [{id, note_text}]

  useEffect(() => {
    if (!book || !chapter) return
    getNotes(book, chapter).then(data => {
      const map = {}
      data.forEach(n => {
        if (!map[n.verse]) map[n.verse] = []
        map[n.verse].push(n)
      })
      setNotes(map)
    })
  }, [book, chapter])

  const addNote = async (verse, text) => {
    const result = await createNote(book, chapter, verse, text)
    setNotes(prev => ({
      ...prev,
      [verse]: [...(prev[verse] || []), { id: result.id, note_text: text }]
    }))
  }

  const removeNote = async (verse, id) => {
    await deleteNote(id)
    setNotes(prev => ({
      ...prev,
      [verse]: (prev[verse] || []).filter(n => n.id !== id)
    }))
  }

  return { notes, addNote, removeNote }
}
```

- [ ] **Step 3: Create frontend/src/hooks/useBookmarks.js**

```js
import { useState, useEffect } from 'react'
import { getBookmarks, createBookmark, deleteBookmark } from '../api'

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState([])

  useEffect(() => {
    getBookmarks().then(setBookmarks)
  }, [])

  const add = async (book, chapter, verse, label) => {
    const result = await createBookmark(book, chapter, verse, label)
    setBookmarks(prev => [...prev, { id: result.id, book, chapter, verse, label }])
  }

  const remove = async (id) => {
    await deleteBookmark(id)
    setBookmarks(prev => prev.filter(b => b.id !== id))
  }

  const isBookmarked = (book, chapter, verse) =>
    bookmarks.some(b => b.book === book && b.chapter === chapter && b.verse === verse)

  return { bookmarks, add, remove, isBookmarked }
}
```

- [ ] **Step 4: Create frontend/src/components/VerseRow.jsx**

```jsx
import { useState } from 'react'

const COLORS = ['#FFFF99', '#99FF99', '#99CCFF', '#FFB3BA', '#E0BAFF']

export default function VerseRow({ verse, text, highlight, hasNote, onHighlight, onNoteClick, onBookmark, isBookmarked, isReading }) {
  const [showColors, setShowColors] = useState(false)

  const bg = isReading ? '#3a3a6e' : highlight ? highlight.color + '33' : 'transparent'

  return (
    <div style={{ display: 'flex', gap: 8, padding: '6px 0', background: bg, borderRadius: 4, position: 'relative' }}>
      <span style={{ color: '#6b7280', minWidth: 28, fontSize: 12, paddingTop: 3, fontFamily: 'sans-serif' }}>{verse}</span>
      <span style={{ flex: 1, lineHeight: 1.8 }}>{text}</span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start', paddingTop: 2 }}>
        <button title="Highlight" onClick={() => setShowColors(v => !v)}
          style={{ padding: '2px 6px', fontSize: 12, background: highlight ? highlight.color : '#2e2e4e' }}>
          ✏
        </button>
        {showColors && (
          <div style={{ position: 'absolute', right: 40, top: 0, background: '#12122a', border: '1px solid #2e2e4e', borderRadius: 6, padding: 4, display: 'flex', gap: 4, zIndex: 10 }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => { onHighlight(verse, c); setShowColors(false) }}
                style={{ background: c, width: 20, height: 20, padding: 0, borderRadius: 3 }} />
            ))}
            {highlight && <button onClick={() => { onHighlight(verse, null); setShowColors(false) }} style={{ fontSize: 10 }}>✕</button>}
          </div>
        )}
        <button title="Note" onClick={() => onNoteClick(verse)}
          style={{ padding: '2px 6px', fontSize: 12, background: hasNote ? '#5b4fcf' : '#2e2e4e' }}>
          📝
        </button>
        <button title="Bookmark" onClick={() => onBookmark(verse)}
          style={{ padding: '2px 6px', fontSize: 12, background: isBookmarked ? '#f4a261' : '#2e2e4e' }}>
          🔖
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create frontend/src/components/BibleReader.jsx**

```jsx
import { useState, useEffect, useRef } from 'react'
import { getChapter, getSummary } from '../api'
import { useHighlights } from '../hooks/useHighlights'
import { useNotes } from '../hooks/useNotes'
import { useBookmarks } from '../hooks/useBookmarks'
import VerseRow from './VerseRow'
import Navbar from './Navbar'
import VoiceReader from './VoiceReader'

export default function BibleReader({ onContextChange }) {
  const saved = JSON.parse(localStorage.getItem('lastRead') || '{"book":"Genesis","chapter":1,"verse":1}')
  const [book, setBook] = useState(saved.book)
  const [chapter, setChapter] = useState(saved.chapter)
  const [translation, setTranslation] = useState('KJV')
  const [language, setLanguage] = useState('en')
  const [verses, setVerses] = useState([])
  const [summary, setSummary] = useState(null)
  const [fontSize, setFontSize] = useState(18)
  const [activeNote, setActiveNote] = useState(null) // verse number
  const [noteInput, setNoteInput] = useState('')
  const [readingVerse, setReadingVerse] = useState(null)

  const { highlights, toggle: toggleHighlight } = useHighlights(book, chapter)
  const { notes, addNote } = useNotes(book, chapter)
  const { bookmarks, add: addBookmark, remove, isBookmarked } = useBookmarks()

  useEffect(() => {
    getChapter(book, chapter, translation, language).then(setVerses)
    getSummary(book, chapter).then(setSummary)
    localStorage.setItem('lastRead', JSON.stringify({ book, chapter, verse: 1 }))
    if (onContextChange) onContextChange({ book, chapter, translation })
  }, [book, chapter, translation, language])

  const nav = (b, c) => { setBook(b); setChapter(c) }

  return (
    <div>
      <Navbar
        book={book} chapter={chapter} translation={translation} language={language}
        onNav={nav} onTranslationChange={(t, l) => { setTranslation(t); setLanguage(l) }}
        fontSize={fontSize} onFontSize={setFontSize}
      />
      <VoiceReader verses={verses} onVerseChange={setReadingVerse} />

      {summary && (
        <div style={{ background: '#1e1e3e', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontFamily: 'sans-serif', fontSize: 14, color: '#b0a8c8', fontStyle: 'italic' }}>
          {summary.summary}
        </div>
      )}

      <h2 style={{ fontFamily: 'sans-serif', marginBottom: 12, color: '#a89de0' }}>{book} {chapter}</h2>

      <div style={{ fontSize }}>
        {verses.map(v => (
          <VerseRow
            key={v.verse}
            verse={v.verse}
            text={v.text}
            highlight={highlights[v.verse]}
            hasNote={!!(notes[v.verse]?.length)}
            isBookmarked={isBookmarked(book, chapter, v.verse)}
            isReading={readingVerse === v.verse}
            onHighlight={(verse, color) => color ? toggleHighlight(verse, color) : toggleHighlight(verse, null)}
            onNoteClick={verse => { setActiveNote(verse); setNoteInput('') }}
            onBookmark={verse => {
              if (isBookmarked(book, chapter, verse)) {
                const bm = bookmarks.find(b => b.book === book && b.chapter === chapter && b.verse === verse)
                if (bm) remove(bm.id)
              } else {
                addBookmark(book, chapter, verse, `${book} ${chapter}:${verse}`)
              }
            }}
          />
        ))}
      </div>

      {activeNote && (
        <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: '#1e1e3e', border: '1px solid #2e2e4e', borderRadius: 8, padding: 16, zIndex: 100, width: 340 }}>
          <div style={{ fontFamily: 'sans-serif', marginBottom: 8, color: '#a89de0' }}>Note for verse {activeNote}</div>
          <textarea value={noteInput} onChange={e => setNoteInput(e.target.value)}
            style={{ width: '100%', height: 80, background: '#12122a', color: '#e0d7c6', border: '1px solid #2e2e4e', borderRadius: 4, padding: 8, resize: 'none', fontFamily: 'Georgia' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="primary" onClick={() => { addNote(activeNote, noteInput); setActiveNote(null) }}>Save</button>
            <button onClick={() => setActiveNote(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/ frontend/src/hooks/
git commit -m "feat: BibleReader, VerseRow, highlight/note/bookmark hooks"
```

---

## Task 13: ChatPanel Component

**Files:**
- Create: `frontend/src/components/ChatPanel.jsx`

- [ ] **Step 1: Create frontend/src/components/ChatPanel.jsx**

```jsx
import { useState, useRef, useEffect } from 'react'

export default function ChatPanel({ book = 'Genesis', chapter = 1, translation = 'KJV' }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your Catholic Bible guide. Ask me anything about the passage you are reading or about the Faith.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg, book, chapter, translation }),
    })

    if (!res.ok) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'The AI assistant is currently unavailable. Please check your API key and internet connection.' }])
      setLoading(false)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let aiText = ''
    setMessages(prev => [...prev, { role: 'assistant', text: '' }])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
      for (const line of lines) {
        const data = line.slice(6)
        if (data === '[DONE]') { setLoading(false); break }
        if (data.startsWith('[ERROR]')) {
          setMessages(prev => { const n=[...prev]; n[n.length-1].text = data; return n })
          setLoading(false)
          break
        }
        aiText += data
        setMessages(prev => { const n=[...prev]; n[n.length-1]={role:'assistant',text:aiText}; return n })
      }
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'sans-serif' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #2e2e4e', fontSize: 13, color: '#a89de0', fontWeight: 'bold' }}>
        AI Bible Guide
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            background: m.role === 'user' ? '#5b4fcf' : '#1e1e3e',
            color: '#e0d7c6',
            padding: '8px 12px',
            borderRadius: 10,
            maxWidth: '88%',
            fontSize: 14,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}>
            {m.text}
          </div>
        ))}
        {loading && <div style={{ color: '#6b7280', fontSize: 13 }}>Thinking...</div>}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '10px 14px', borderTop: '1px solid #2e2e4e', display: 'flex', gap: 8 }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Ask about this passage..."
          style={{ flex: 1, height: 60, background: '#12122a', color: '#e0d7c6', border: '1px solid #2e2e4e', borderRadius: 6, padding: '8px 10px', resize: 'none', fontFamily: 'sans-serif', fontSize: 13 }}
        />
        <button className="primary" onClick={send} disabled={loading} style={{ alignSelf: 'flex-end' }}>Send</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/ChatPanel.jsx
git commit -m "feat: ChatPanel with SSE streaming from Claude"
```

---

## Task 14: Notepad & VoiceReader Components

**Files:**
- Create: `frontend/src/components/Notepad.jsx`
- Create: `frontend/src/components/VoiceReader.jsx`
- Create: `frontend/src/hooks/useVoice.js`

- [ ] **Step 1: Create frontend/src/hooks/useVoice.js**

```js
import { useState, useEffect, useRef } from 'react'

export function useVoice(verses, onVerseChange) {
  const [supported] = useState(() => 'speechSynthesis' in window)
  const [playing, setPlaying] = useState(false)
  const [voices, setVoices] = useState([])
  const [voiceIndex, setVoiceIndex] = useState(0)
  const indexRef = useRef(0)
  const versesRef = useRef(verses)

  useEffect(() => { versesRef.current = verses }, [verses])

  useEffect(() => {
    if (!supported) return
    const load = () => setVoices(speechSynthesis.getVoices())
    load()
    speechSynthesis.onvoiceschanged = load
  }, [supported])

  const speak = (startIdx = 0) => {
    if (!supported || !versesRef.current.length) return
    speechSynthesis.cancel()
    indexRef.current = startIdx

    const readNext = () => {
      if (indexRef.current >= versesRef.current.length) { setPlaying(false); onVerseChange?.(null); return }
      const v = versesRef.current[indexRef.current]
      onVerseChange?.(v.verse)
      const utt = new SpeechSynthesisUtterance(`Verse ${v.verse}. ${v.text}`)
      if (voices[voiceIndex]) utt.voice = voices[voiceIndex]
      utt.onend = () => { indexRef.current++; readNext() }
      speechSynthesis.speak(utt)
    }

    setPlaying(true)
    readNext()
  }

  const pause = () => { speechSynthesis.pause(); setPlaying(false) }
  const resume = () => { speechSynthesis.resume(); setPlaying(true) }
  const stop = () => { speechSynthesis.cancel(); setPlaying(false); onVerseChange?.(null) }

  return { supported, playing, voices, voiceIndex, setVoiceIndex, speak, pause, resume, stop }
}
```

- [ ] **Step 2: Create frontend/src/components/VoiceReader.jsx**

```jsx
import { useVoice } from '../hooks/useVoice'

export default function VoiceReader({ verses, onVerseChange }) {
  const { supported, playing, voices, voiceIndex, setVoiceIndex, speak, pause, resume, stop } = useVoice(verses, onVerseChange)

  if (!supported) {
    return <div style={{ fontFamily:'sans-serif', fontSize:13, color:'#6b7280', padding:'8px 0' }}>Voice reading is not supported in your browser.</div>
  }

  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', fontFamily:'sans-serif', fontSize:13 }}>
      <button onClick={() => playing ? pause() : speak(0)}>{playing ? '⏸ Pause' : '▶ Play'}</button>
      {!playing && <button onClick={resume}>⏯ Resume</button>}
      <button onClick={stop}>⏹ Stop</button>
      <select value={voiceIndex} onChange={e => setVoiceIndex(Number(e.target.value))}
        style={{ background:'#2e2e4e', color:'#e0d7c6', border:'none', borderRadius:4, padding:'4px 8px' }}>
        {voices.map((v, i) => <option key={i} value={i}>{v.name} ({v.lang})</option>)}
      </select>
    </div>
  )
}
```

- [ ] **Step 3: Create frontend/src/components/Notepad.jsx**

The Notepad is a draggable floating widget. It shows notes for the current verse (if a verse is selected) and persists them via the `/notes` API using the `useNotes` hook. It accepts `book`, `chapter`, and `activeVerse` props from the parent.

```jsx
import { useState, useRef } from 'react'
import { useNotes } from '../hooks/useNotes'

export default function Notepad({ book, chapter, activeVerse, onClose }) {
  const [open, setOpen] = useState(false)
  const [noteInput, setNoteInput] = useState('')
  const [pos, setPos] = useState({ x: 80, y: 120 })
  const dragging = useRef(false)
  const offset = useRef({ x: 0, y: 0 })

  const { notes, addNote, removeNote } = useNotes(book, chapter)
  const verseNotes = activeVerse ? (notes[activeVerse] || []) : []

  const onMouseDown = (e) => {
    dragging.current = true
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }
  const onMouseMove = (e) => {
    if (!dragging.current) return
    setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y })
  }
  const onMouseUp = () => {
    dragging.current = false
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  const save = async () => {
    if (!noteInput.trim() || !activeVerse) return
    await addNote(activeVerse, noteInput.trim())
    setNoteInput('')
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        style={{ position:'fixed', bottom:24, left:24, zIndex:200, background:'#5b4fcf', color:'white', padding:'10px 16px', borderRadius:24, fontSize:16 }}>
        📓 Notepad
      </button>
    )
  }

  return (
    <div style={{ position:'fixed', left:pos.x, top:pos.y, zIndex:200, background:'#1e1e3e', border:'1px solid #3e3e6e', borderRadius:10, width:320, boxShadow:'0 8px 32px rgba(0,0,0,0.5)' }}>
      <div onMouseDown={onMouseDown}
        style={{ padding:'8px 12px', background:'#2e2e4e', borderRadius:'10px 10px 0 0', cursor:'grab', display:'flex', justifyContent:'space-between', alignItems:'center', userSelect:'none' }}>
        <span style={{ fontFamily:'sans-serif', fontSize:13, color:'#a89de0' }}>
          📓 {activeVerse ? `Notes — verse ${activeVerse}` : 'Notepad'}
        </span>
        <button onClick={() => setOpen(false)} style={{ background:'transparent', color:'#6b7280', padding:0, fontSize:16 }}>✕</button>
      </div>

      <div style={{ padding:'8px 12px', maxHeight:160, overflowY:'auto' }}>
        {verseNotes.length === 0 && <p style={{ color:'#6b7280', fontSize:13, fontFamily:'sans-serif' }}>{activeVerse ? 'No notes for this verse yet.' : 'Click 📝 on a verse to attach a note.'}</p>}
        {verseNotes.map(n => (
          <div key={n.id} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid #2e2e4e', fontSize:14 }}>
            <span style={{ flex:1 }}>{n.note_text}</span>
            <button onClick={() => removeNote(activeVerse, n.id)} style={{ background:'transparent', color:'#6b7280', padding:'0 4px', fontSize:14 }}>✕</button>
          </div>
        ))}
      </div>

      {activeVerse && (
        <div style={{ padding:'8px 12px', borderTop:'1px solid #2e2e4e' }}>
          <textarea value={noteInput} onChange={e => setNoteInput(e.target.value)}
            style={{ width:'100%', height:72, background:'#12122a', color:'#e0d7c6', border:'1px solid #2e2e4e', borderRadius:4, padding:8, resize:'none', fontFamily:'Georgia', fontSize:14 }}
            placeholder="Add a note..." />
          <button className="primary" onClick={save} style={{ marginTop:6, width:'100%' }}>Save Note</button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Notepad.jsx frontend/src/components/VoiceReader.jsx frontend/src/hooks/useVoice.js
git commit -m "feat: draggable Notepad widget and VoiceReader with Web Speech API"
```

---

## Task 15: Learn & Bookmarks Pages

**Files:**
- Modify: `frontend/src/pages/LearnPage.jsx`
- Modify: `frontend/src/pages/BookmarksPage.jsx`

- [ ] **Step 1: Rewrite frontend/src/pages/LearnPage.jsx**

```jsx
import { useState, useEffect } from 'react'
import { getLearnArticles, getLearnArticle } from '../api'
import ChatPanel from '../components/ChatPanel'

export default function LearnPage() {
  const [articles, setArticles] = useState([])
  const [current, setCurrent] = useState(null)

  useEffect(() => { getLearnArticles().then(setArticles) }, [])

  const open = (slug) => getLearnArticle(slug).then(setCurrent)

  return (
    <div style={{ display:'grid', gridTemplateColumns:'220px 1fr 340px', height:'calc(100vh - 56px)', fontFamily:'sans-serif' }}>
      <div style={{ padding:16, borderRight:'1px solid #2e2e4e', overflowY:'auto' }}>
        <h3 style={{ color:'#a89de0', marginBottom:12, fontSize:14 }}>Catholic Reference</h3>
        {articles.map(a => (
          <div key={a.slug} onClick={() => open(a.slug)}
            style={{ padding:'8px 10px', borderRadius:6, cursor:'pointer', marginBottom:4,
              background: current?.slug === a.slug ? '#2e2e4e' : 'transparent', fontSize:14 }}>
            {a.title}
          </div>
        ))}
      </div>

      <div style={{ padding:32, overflowY:'auto', maxWidth:720 }}>
        {current
          ? <div style={{ lineHeight:1.8, fontSize:16 }}>
              <pre style={{ whiteSpace:'pre-wrap', fontFamily:'Georgia' }}>{current.content}</pre>
            </div>
          : <div style={{ color:'#6b7280', marginTop:60, textAlign:'center' }}>Select an article to read</div>
        }
      </div>

      <div style={{ borderLeft:'1px solid #2e2e4e' }}>
        <ChatPanel />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Rewrite frontend/src/pages/BookmarksPage.jsx**

```jsx
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useBookmarks } from '../hooks/useBookmarks'

export default function BookmarksPage() {
  const { bookmarks, remove } = useBookmarks()

  return (
    <div style={{ padding:32, fontFamily:'sans-serif', maxWidth:700, margin:'0 auto' }}>
      <h1 style={{ color:'#a89de0', marginBottom:24 }}>Bookmarks</h1>
      {bookmarks.length === 0 && <p style={{ color:'#6b7280' }}>No bookmarks yet. Bookmark verses while reading.</p>}
      {bookmarks.map(b => (
        <div key={b.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #2e2e4e' }}>
          <Link to="/" style={{ color:'#e0d7c6' }}>
            <strong style={{ color:'#a89de0' }}>{b.book} {b.chapter}:{b.verse}</strong>
            {b.label && <span style={{ color:'#6b7280', marginLeft:8, fontSize:13 }}>— {b.label}</span>}
          </Link>
          <button onClick={() => remove(b.id)} style={{ background:'transparent', color:'#6b7280', fontSize:18 }}>✕</button>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/LearnPage.jsx frontend/src/pages/BookmarksPage.jsx
git commit -m "feat: Learn page with Catholic articles and Bookmarks page"
```

---

## Task 16: Wire Home Page & Final Integration

**Files:**
- Modify: `frontend/src/pages/Home.jsx`
- Modify: `frontend/src/main.jsx`

- [ ] **Step 1: Update frontend/src/main.jsx**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 2: Update frontend/src/pages/Home.jsx to wire reader context to chat**

```jsx
import { useState } from 'react'
import BibleReader from '../components/BibleReader'
import ChatPanel from '../components/ChatPanel'
import Notepad from '../components/Notepad'

export default function Home() {
  const [context, setContext] = useState({ book: 'Genesis', chapter: 1, translation: 'KJV' })

  return (
    <div style={{ display:'grid', gridTemplateRows:'1fr', gridTemplateColumns:'1fr 340px', height:'calc(100vh - 56px)', overflow:'hidden' }}>
      <div style={{ overflowY:'auto', padding:'16px 32px' }}>
        <BibleReader onContextChange={setContext} />
      </div>
      <div style={{ borderLeft:'1px solid #2e2e4e', overflow:'hidden', display:'flex', flexDirection:'column' }}>
        <ChatPanel book={context.book} chapter={context.chapter} translation={context.translation} />
      </div>
      <Notepad />
    </div>
  )
}
```

- [ ] **Step 3: Start both servers and do a full manual smoke test**

Terminal 1 (backend):
```bash
cd backend
source venv/Scripts/activate
uvicorn main:app --reload
```

Terminal 2 (frontend):
```bash
cd frontend
npm run dev
```

Open http://localhost:5173 and verify:
- [ ] Books load in navbar dropdown
- [ ] Changing book/chapter loads verses
- [ ] Highlighting a verse saves and reloads correctly
- [ ] Adding a note saves and shows note icon
- [ ] Bookmarking a verse works
- [ ] Chat sends a question and receives streaming response
- [ ] Streak badge shows in navbar
- [ ] Voice reader plays chapter text
- [ ] Learn page shows articles
- [ ] Bookmarks page shows saved bookmarks
- [ ] Last read position restores on page refresh

- [ ] **Step 4: Final commit**

```bash
git add frontend/src/pages/Home.jsx frontend/src/main.jsx
git commit -m "feat: wire Home page — BibleReader context flows to ChatPanel"
```

---

## Task 17: Push to GitHub

- [ ] **Step 1: Create .gitignore**

```
backend/venv/
backend/.env
backend/bible_app.db
frontend/node_modules/
frontend/dist/
__pycache__/
*.pyc
.DS_Store
```

Save to `.gitignore` at project root.

- [ ] **Step 2: Push everything**

```bash
git add .gitignore
git commit -m "chore: add .gitignore"
git push origin master
```

---

## Running the App (Quick Reference)

```bash
# Terminal 1 — backend
cd backend && source venv/Scripts/activate && uvicorn main:app --reload

# Terminal 2 — frontend
cd frontend && npm run dev

# Open: http://localhost:5173
```
