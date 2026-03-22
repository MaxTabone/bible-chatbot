"""
Generates plain-language summaries for all 1,189 Bible chapters using Claude.
Run once after importing Bible data: python scripts/generate_summaries.py
This will take some time and consume API tokens.
"""
import sqlite3
import os
import asyncio
from anthropic import AsyncAnthropic
from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "bible_app.db")
client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

async def summarise_chapter(book: str, chapter: int, verses: list[str]) -> str:
    text = "\n".join(f"v{i+1}: {v}" for i, v in enumerate(verses))
    message = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        messages=[{
            "role": "user",
            "content": f"Write a 2-3 sentence plain-language summary of {book} chapter {chapter} suitable for a general Catholic reader. Be simple and clear.\n\n{text[:3000]}"
        }]
    )
    return message.content[0].text.strip()

async def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    chapters = conn.execute(
        "SELECT DISTINCT book, chapter FROM bible_verses WHERE translation='KJV' ORDER BY rowid"
    ).fetchall()

    existing = set(
        (r["book"], r["chapter"])
        for r in conn.execute("SELECT book, chapter FROM chapter_summaries").fetchall()
    )

    todo = [(r["book"], r["chapter"]) for r in chapters if (r["book"], r["chapter"]) not in existing]
    print(f"Generating {len(todo)} summaries (skipping {len(existing)} already done)...")

    for book, chapter in todo:
        verses = [
            r["text"] for r in conn.execute(
                "SELECT text FROM bible_verses WHERE book=? AND chapter=? AND translation='KJV' ORDER BY verse",
                (book, chapter)
            ).fetchall()
        ]
        try:
            summary = await summarise_chapter(book, chapter, verses)
            conn.execute(
                "INSERT OR REPLACE INTO chapter_summaries (book,chapter,summary,language) VALUES (?,?,?,'en')",
                (book, chapter, summary)
            )
            conn.commit()
            print(f"  {book} {chapter}: done")
        except Exception as e:
            print(f"  {book} {chapter}: ERROR — {e}")
        await asyncio.sleep(0.3)  # avoid rate limits

    conn.close()
    print("Summary generation complete.")

if __name__ == "__main__":
    asyncio.run(main())
