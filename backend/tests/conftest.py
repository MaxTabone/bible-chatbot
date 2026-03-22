import pytest
import pytest_asyncio
import aiosqlite
from httpx import AsyncClient, ASGITransport
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

    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
