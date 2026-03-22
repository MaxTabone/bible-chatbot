from fastapi import APIRouter, HTTPException
import os

router = APIRouter(prefix="/learn", tags=["learn"])

LEARN_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "learn")

ARTICLES = [
    {"slug": "sacraments",         "title": "The 7 Sacraments"},
    {"slug": "mortal-venial-sin",  "title": "Mortal vs Venial Sin"},
    {"slug": "commandments",       "title": "The 10 Commandments"},
    {"slug": "beatitudes",         "title": "The Beatitudes"},
    {"slug": "rosary",             "title": "The Rosary"},
    {"slug": "apostles-creed",     "title": "The Apostles' Creed"},
    {"slug": "works-of-mercy",     "title": "Works of Mercy"},
    {"slug": "last-four-things",   "title": "The Last Four Things"},
]

@router.get("")
async def list_articles():
    return ARTICLES

@router.get("/{slug}")
async def get_article(slug: str):
    path = os.path.join(LEARN_DIR, f"{slug}.md")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Article not found.")
    with open(path, encoding="utf-8") as f:
        content = f.read()
    return {"slug": slug, "content": content}
