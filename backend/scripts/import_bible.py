"""
Downloads public domain Bible translations and imports into bible_app.db.
Run once: python scripts/import_bible.py
"""
import sqlite3
import csv
import io
import os
import sys
import requests

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "bible_app.db")

TRANSLATIONS = {
    "KJV": {
        "url": "https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/csv/KJV.csv",
        "language": "en",
    },
    "ASV": {
        "url": "https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/csv/ASV.csv",
        "language": "en",
    },
    "WEB": {
        "url": "https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/csv/Webster.csv",  # Webster's 1833 revision (public domain)
        "language": "en",
    },
}

def import_translation(conn, name, url, language):
    print(f"Downloading {name}...")
    r = requests.get(url, timeout=30)
    r.raise_for_status()
    reader = csv.DictReader(io.StringIO(r.text))
    rows = []
    for row in reader:
        book = row["Book"]
        chapter = int(row["Chapter"])
        verse = int(row["Verse"])
        text = row["Text"].strip()
        rows.append((book, chapter, verse, text, name, language))
    conn.executemany(
        "INSERT OR IGNORE INTO bible_verses (book,chapter,verse,text,translation,language) VALUES (?,?,?,?,?,?)",
        rows
    )
    conn.commit()
    print(f"  Imported {len(rows)} verses for {name}")

def main():
    conn = sqlite3.connect(DB_PATH)
    for name, info in TRANSLATIONS.items():
        import_translation(conn, name, info["url"], info["language"])
    conn.close()
    print("Import complete.")

if __name__ == "__main__":
    main()
