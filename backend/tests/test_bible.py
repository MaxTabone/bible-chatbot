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
