# Online Bible Chatbot — Design Spec
**Date:** 2026-03-22
**Status:** Approved

---

## Overview

A locally-run web application that provides a full Bible reader with AI-powered chat assistance, notes, highlights, bookmarks, voice reading, streaks, and a Christianity reference section. The app has a Catholic focus (Sacraments, Rosary, Mortal/Venial Sin, etc.). Built to run locally first, with publishing in mind from the start.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI |
| Frontend | React |
| Database | SQLite (single file: `bible_app.db`) |
| AI | Claude Agent SDK (Anthropic) |
| Voice | Web Speech API (browser built-in) |
| Structure | Monorepo with separate `backend/` and `frontend/` folders |

---

## Project Structure

```
Project1/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── routers/                 # API route handlers (bible, notes, chat, streaks)
│   ├── services/                # Business logic (AI agent, summaries)
│   ├── db/                      # SQLite setup, models, queries
│   ├── data/                    # Pre-loaded Bible text + Christianity content
│   ├── scripts/                 # Import scripts (e.g. import_bible.py)
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/          # BibleReader, ChatPanel, Notepad, Navbar, etc.
    │   ├── pages/               # Home, Learn, Bookmarks
    │   ├── hooks/               # useHighlight, useNotes, useVoice, etc.
    │   └── App.jsx
    ├── public/
    └── package.json
```

---

## Bible Data Sourcing

Bible text is sourced from public domain datasets and imported into SQLite at setup time via `backend/scripts/import_bible.py`.

**Primary sources:**
- **eBible.org** — provides USFX/USX XML and plain-text downloads for hundreds of translations and languages, many in the public domain
- **openbible.info** — structured CSV/JSON datasets for common English translations (KJV, ASV, WEB)
- **Crosswire / SWORD Project** — additional public domain modules

**Format:** Plain-text or JSON is preferred for import simplicity. The import script normalises all sources into the `bible_verses` table schema.

**Translations included at launch:** KJV, ASV, WEB (English public domain); plus as many non-English public domain translations as available from eBible.org. Proprietary translations (NIV, ESV, NLT) are excluded unless a licence is obtained later.

**Environment:** The Anthropic API key is stored in a `.env` file in `backend/`. A `.env.example` is provided. A `README.md` at the project root documents setup steps.

---

## Database Schema

Single SQLite database: `bible_app.db`

```sql
bible_verses (
  id INTEGER PRIMARY KEY,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  text TEXT NOT NULL,
  translation TEXT NOT NULL,   -- e.g. 'KJV', 'WEB'
  language TEXT NOT NULL        -- e.g. 'en', 'es', 'fr'
)

chapter_summaries (
  id INTEGER PRIMARY KEY,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  summary TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en'
  -- Summaries are English-only at launch; language field reserved for future expansion
)

user_notes (
  id INTEGER PRIMARY KEY,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  note_text TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
)

user_highlights (
  id INTEGER PRIMARY KEY,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  color TEXT NOT NULL,          -- hex color string e.g. '#FFFF00'
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
)

user_bookmarks (
  id INTEGER PRIMARY KEY,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,       -- verse-level bookmarks
  label TEXT,                   -- optional user-defined label
  created_at DATETIME NOT NULL
)

user_streaks (
  id INTEGER PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,    -- ISO date string e.g. '2026-03-22'
  visited INTEGER NOT NULL DEFAULT 1  -- boolean (1 = visited); row existence = visited day
)
```

**Notes:**
- `chapter_summaries` are pre-generated using Claude before launch and stored in the database. The 1,189 Bible chapters will have summaries generated in a one-time batch script. If a summary is missing, the UI shows "Summary not available for this chapter."
- `user_streaks`: one row per visited day. The `visited` column is always 1; it exists for future use (e.g. storing session count). Streak length is calculated by the backend from the date sequence.
- `user_notes` and `user_highlights` both have `updated_at` to track edits.

---

## Backend API (FastAPI)

```
GET  /bible/books
     → List all book names

GET  /bible/{book}/{chapter}?translation=KJV&language=en
     → Get all verses for a chapter in the specified translation/language

GET  /bible/translations
     → List all available translations with their language codes

GET  /bible/search?q=...&translation=KJV&limit=50&offset=0
     → Keyword search across verses; max 50 results per page, paginated

GET  /summaries/{book}/{chapter}
     → Get English summary for a chapter (returns 404 with message if not available)

POST /notes                      body: {book, chapter, verse, note_text}
GET  /notes/{book}/{chapter}     → All notes for a chapter
DELETE /notes/{id}

POST /highlights                 body: {book, chapter, verse, color}
GET  /highlights/{book}/{chapter}
DELETE /highlights/{id}

POST /bookmarks                  body: {book, chapter, verse, label?}
GET  /bookmarks                  → All bookmarks
DELETE /bookmarks/{id}

POST /streaks/checkin
     → Records today's date as visited (idempotent — safe to call multiple times)
     → Called automatically by the frontend on page load, once per day
GET  /streaks
     → Returns {current_streak: N, longest_streak: N, history: [...dates]}

POST /chat                       body: {message, book, chapter, translation}
     → Streams Claude's response as Server-Sent Events (text/event-stream)
     → NOT a standard JSON response — SSE exception to the JSON convention
```

**General conventions:**
- All non-streaming endpoints return JSON
- `/chat` returns `text/event-stream` (Server-Sent Events) for word-by-word streaming
- Errors return `{detail: "..."}` with appropriate HTTP status codes
- If Claude is unavailable, `/chat` returns HTTP 503 with a user-friendly message

---

## Frontend Layout

```
┌─────────────────────────────────────────────────────┐
│                    Top Navbar                        │
│  [Book/Chapter Nav] [Translation] [Zoom] [Voice] 🔥 │
├──────────────────────────────┬──────────────────────┤
│                              │                      │
│       Bible Reader           │    AI Chat Panel     │
│   (center, scrollable)       │   (Claude chatbot)   │
│                              │                      │
│   Verse 1 text...            │  [Chat history]      │
│   Verse 2 text...            │                      │
│   Verse 3 text...            │  [Type a question]   │
│                              │                      │
│   [Floating Notepad — draggable anywhere on screen]  │
└─────────────────────────────────────────────────────┘
```

**Minimum supported resolution:** 1280×768. Responsive/mobile design is out of scope for the local version.

**Pages:**
- `/` — Main Bible reader
- `/learn` — Catholic Christianity reference articles
- `/bookmarks` — All saved bookmarks

**Key Components:**

| Component | Purpose |
|---|---|
| `BibleReader` | Renders verses, handles highlighting (click-to-highlight), zoom, verse-level bookmarking |
| `ChatPanel` | Streaming AI chat (SSE), context-aware of current book/chapter/translation |
| `Notepad` | Draggable floating widget; notes attached at verse level; auto-saves on blur |
| `Navbar` | Book/chapter selector, translation/language switcher, zoom controls, voice toggle, streak badge |
| `VoiceReader` | Web Speech API — play/pause/stop, accent/voice selector, highlights currently-read verse |
| `StreakBadge` | Displays current streak count in navbar (e.g. "🔥 7 days") |
| `LearnPage` | Static Catholic Christianity reference articles |

---

## AI Chat (Claude Agent SDK)

- Powered by the Claude Agent SDK
- **Catholic Christian focus** — the system prompt establishes the assistant as a Catholic Bible and Christianity guide
- Context passed with every message: current book, chapter, translation, user message

**Example context payload to Claude:**
```json
{
  "current_book": "John",
  "current_chapter": 3,
  "current_translation": "KJV",
  "user_message": "What does verse 16 mean?"
}
```

- Streamed responses via SSE so answers appear word-by-word
- Explains verses in plain, simple language
- Can compare translations, give historical/theological context, answer Catholic Christianity questions
- Does not fabricate Bible references
- If Claude is unavailable (API error), the UI shows: "The AI assistant is currently unavailable. Please check your API key and internet connection."

---

## Features

### Bible Reader
- All books, chapters, verses from local SQLite
- Translation and language switchable from navbar (`?translation=` passed to API)
- Zoom in/out on text size
- Click a verse to highlight it (color picker with a few preset colors)
- Verse-level bookmarks (bookmark any verse, with optional label)
- Auto-saves last read position to localStorage under the key `lastRead` as `{ book, chapter, verse }`; restores on next visit
- If search returns zero results, UI shows "No verses found for your search."

### Notepad
- Draggable floating widget — place anywhere on screen
- Notes attached at the verse level
- Note icon appears next to annotated verses
- Auto-saves on blur (when user clicks away)
- Persists across sessions via backend API

### Voice Reader
- Reads current chapter aloud using Web Speech API
- Play/pause/stop controls in navbar
- Accent/voice selector (OS-dependent options, typically 10-20+)
- Highlights the verse currently being read
- If Web Speech API is unavailable in the browser, voice controls are hidden and replaced with the message: "Voice reading is not supported in your browser."

### Streaks
- Frontend fires `POST /streaks/checkin` on page load (once per day, checked via localStorage date)
- Streak counter displayed in navbar
- Streak history dashboard on a dedicated view

### Learn Section (Catholic Focus)
- At least 8 pre-written articles covering: The 7 Sacraments, Mortal vs Venial Sin, The 10 Commandments, The Beatitudes, The Rosary, The Apostles' Creed, Works of Mercy, The Last Four Things
- Clean readable article layout
- AI chat panel available alongside for follow-up questions
- Content is static — authored once, stored as markdown files in `backend/data/learn/`

### Chapter Summaries
- Simplified plain-language summary shown above each chapter
- Pre-generated by Claude in a one-time batch before launch, stored in SQLite
- If a summary is missing, UI shows: "Summary not available for this chapter."
- English only at launch; `language` field in schema reserved for future expansion

---

## Setup & Environment

- A `README.md` at the project root documents all setup steps
- Backend requires a `.env` file with `ANTHROPIC_API_KEY=...`
- A `.env.example` is committed to the repo (without the real key)
- `backend/scripts/import_bible.py` populates the database from downloaded source files
- `backend/scripts/generate_summaries.py` batch-generates chapter summaries using Claude

---

## Future (Publishing)
- Swap SQLite for PostgreSQL
- Add user authentication and multi-user support
- Swap Web Speech API for a higher-quality TTS (e.g. ElevenLabs)
- Add responsive/mobile design
- Deploy backend to cloud (e.g. Railway, Render)
- Deploy frontend to Vercel or Netlify
- Expand Bible translations via external API (e.g. scripture.api.bible)
- Add multi-language chapter summaries
