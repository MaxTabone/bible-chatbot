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
