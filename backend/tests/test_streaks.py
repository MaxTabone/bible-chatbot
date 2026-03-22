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
