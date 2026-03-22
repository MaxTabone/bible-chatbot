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
