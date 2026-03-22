import aiosqlite
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "bible_app.db")

async def get_db():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        yield db
