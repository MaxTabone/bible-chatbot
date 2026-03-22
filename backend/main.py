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
