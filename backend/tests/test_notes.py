import pytest

@pytest.mark.asyncio
async def test_create_and_get_note(client):
    r = await client.post("/notes", json={"book":"John","chapter":3,"verse":16,"note_text":"Key verse"})
    assert r.status_code == 200
    note_id = r.json()["id"]
    r2 = await client.get("/notes/John/3")
    assert any(n["id"] == note_id for n in r2.json())

@pytest.mark.asyncio
async def test_delete_note(client):
    r = await client.post("/notes", json={"book":"John","chapter":3,"verse":1,"note_text":"Test"})
    note_id = r.json()["id"]
    r2 = await client.delete(f"/notes/{note_id}")
    assert r2.status_code == 200
    r3 = await client.get("/notes/John/3")
    assert not any(n["id"] == note_id for n in r3.json())
