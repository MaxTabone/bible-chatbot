import aiosqlite
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "bible_app.db")
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "schema.sql")

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        with open(SCHEMA_PATH) as f:
            await db.executescript(f.read())
        await db.commit()
