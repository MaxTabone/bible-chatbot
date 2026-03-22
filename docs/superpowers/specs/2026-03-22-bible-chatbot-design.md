# Online Bible Chatbot — Design Spec
**Date:** 2026-03-22
**Status:** Approved

---

## Overview

A locally-run web application that provides a full Bible reader with AI-powered chat assistance, notes, highlights, bookmarks, voice reading, streaks, and a Christianity reference section. Built to run locally first, with publishing in mind from the start.

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

## Database Schema

Single SQLite database: `bible_app.db`

```sql
bible_verses (
  id, book, chapter, verse, text, translation, language
)

chapter_summaries (
  id, book, chapter, summary
)

user_notes (
  id, book, chapter, verse, note_text, created_at
)

user_highlights (
  id, book, chapter, verse, color, created_at
)

user_bookmarks (
  id, book, chapter, verse, label, created_at
)

user_streaks (
  id, date, visited
)
```

- `bible_verses` is populated at setup time via an import script from public domain Bible files
- Notes and highlights are attached at the verse level
- Streaks store one row per calendar day; streak length is calculated from the data
- No user authentication needed locally — single-user app

---

## Backend API (FastAPI)

```
GET  /bible/books                        # List all books
GET  /bible/{book}/{chapter}             # Get verses for a chapter (by translation)
GET  /bible/translations                 # List available translations/languages
GET  /bible/search?q=...                 # Keyword search across verses

GET  /summaries/{book}/{chapter}         # Get simplified chapter summary

POST /notes                              # Save a note
GET  /notes/{book}/{chapter}             # Get notes for a chapter
DELETE /notes/{id}                       # Delete a note

POST /highlights                         # Save a highlight
GET  /highlights/{book}/{chapter}        # Get highlights for a chapter
DELETE /highlights/{id}                  # Remove a highlight

POST /bookmarks                          # Save a bookmark
GET  /bookmarks                          # Get all bookmarks
DELETE /bookmarks/{id}                   # Remove a bookmark

POST /streaks/checkin                    # Record today's visit
GET  /streaks                            # Get current streak + longest streak

POST /chat                               # Send message to Claude, stream response
```

- `/chat` uses streaming so responses appear word-by-word
- All endpoints return JSON

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
│   [Floating Notepad — draggable anywhere]            │
└─────────────────────────────────────────────────────┘
```

**Pages:**
- `/` — Main Bible reader
- `/learn` — Christianity reference articles
- `/bookmarks` — All saved bookmarks

**Key Components:**
| Component | Purpose |
|---|---|
| `BibleReader` | Renders verses, handles highlighting, zoom, bookmarking |
| `ChatPanel` | Streaming AI chat, context-aware of current book/chapter |
| `Notepad` | Draggable floating widget, attaches notes to verses |
| `Navbar` | Book/chapter selector, translation switcher, zoom, voice toggle, streak badge |
| `VoiceReader` | Web Speech API controls — play/pause/stop, accent selector |
| `StreakBadge` | Shows current streak count in navbar |
| `LearnPage` | Static Christianity reference articles |

---

## AI Chat (Claude Agent SDK)

- Powered by the Claude Agent SDK
- Specialised system prompt: Bible and Christianity assistant
- Context passed with every message: current book, chapter, translation, user message
- Streamed responses
- Explains verses in simple, plain language
- Can compare translations, give historical/theological context, answer Christianity questions
- Does not fabricate Bible references or take denominational positions

**Example context payload to Claude:**
```json
{
  "current_book": "John",
  "current_chapter": 3,
  "current_translation": "KJV",
  "user_message": "What does verse 16 mean?"
}
```

---

## Features

### Bible Reader
- All books, chapters, verses from local SQLite
- Multiple translations and languages switchable from navbar
- Zoom in/out on text size
- Click verse to highlight (color picker)
- Bookmark current chapter
- Auto-saves last read position

### Notepad
- Draggable floating widget
- Notes attached at the verse level
- Note icon appears next to annotated verses
- Auto-saves, persists across sessions

### Voice Reader
- Reads current chapter aloud using Web Speech API
- Play/pause/stop controls
- Accent/voice selector (OS-dependent, typically 10-20+ options)
- Highlights currently-read verse

### Streaks
- Auto check-in on first visit each day
- Streak counter in navbar
- Streak history dashboard

### Learn Section
- Pre-written articles: Sacraments, Mortal/Venial Sin, The Commandments, The Beatitudes, The Rosary, and more
- Clean readable layout
- AI chat available alongside for follow-up questions

### Chapter Summaries
- Simplified summary above each chapter
- Pre-written and stored in SQLite
- Plain everyday language

---

## Future (Publishing)
- Swap SQLite for PostgreSQL
- Add user authentication
- Swap Web Speech API for a higher-quality TTS (e.g. ElevenLabs)
- Deploy backend to cloud (e.g. Railway, Render)
- Deploy frontend to Vercel or Netlify
- Expand Bible translations via external API (e.g. scripture.api.bible)
