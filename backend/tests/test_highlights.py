import pytest

@pytest.mark.asyncio
async def test_create_and_get_highlight(client):
    r = await client.post("/highlights", json={"book":"John","chapter":3,"verse":16,"color":"#FFFF00"})
    assert r.status_code == 200
    r2 = await client.get("/highlights/John/3")
    assert any(h["verse"] == 16 for h in r2.json())

@pytest.mark.asyncio
async def test_delete_highlight(client):
    r = await client.post("/highlights", json={"book":"Genesis","chapter":1,"verse":1,"color":"#FF0000"})
    hid = r.json()["id"]
    r2 = await client.delete(f"/highlights/{hid}")
    assert r2.status_code == 200
