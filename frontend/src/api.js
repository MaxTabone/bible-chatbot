const BASE = '/api'

export async function getBooks() {
  const r = await fetch(`${BASE}/bible/books`)
  return r.json()
}

export async function getChapter(book, chapter, translation = 'KJV', language = 'en') {
  const r = await fetch(`${BASE}/bible/${encodeURIComponent(book)}/${chapter}?translation=${translation}&language=${language}`)
  return r.json()
}

export async function getTranslations() {
  const r = await fetch(`${BASE}/bible/translations`)
  return r.json()
}

export async function searchVerses(q, translation = 'KJV', limit = 50, offset = 0) {
  const r = await fetch(`${BASE}/bible/search?q=${encodeURIComponent(q)}&translation=${translation}&limit=${limit}&offset=${offset}`)
  return r.json()
}

export async function getSummary(book, chapter) {
  const r = await fetch(`${BASE}/summaries/${encodeURIComponent(book)}/${chapter}`)
  if (r.status === 404) return null
  return r.json()
}

export async function getNotes(book, chapter) {
  const r = await fetch(`${BASE}/notes/${encodeURIComponent(book)}/${chapter}`)
  return r.json()
}

export async function createNote(book, chapter, verse, note_text) {
  const r = await fetch(`${BASE}/notes`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({book,chapter,verse,note_text}) })
  return r.json()
}

export async function deleteNote(id) {
  return fetch(`${BASE}/notes/${id}`, { method: 'DELETE' })
}

export async function getHighlights(book, chapter) {
  const r = await fetch(`${BASE}/highlights/${encodeURIComponent(book)}/${chapter}`)
  return r.json()
}

export async function createHighlight(book, chapter, verse, color) {
  const r = await fetch(`${BASE}/highlights`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({book,chapter,verse,color}) })
  return r.json()
}

export async function deleteHighlight(id) {
  return fetch(`${BASE}/highlights/${id}`, { method: 'DELETE' })
}

export async function getBookmarks() {
  const r = await fetch(`${BASE}/bookmarks`)
  return r.json()
}

export async function createBookmark(book, chapter, verse, label) {
  const r = await fetch(`${BASE}/bookmarks`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({book,chapter,verse,label}) })
  return r.json()
}

export async function deleteBookmark(id) {
  return fetch(`${BASE}/bookmarks/${id}`, { method: 'DELETE' })
}

export async function checkin() {
  return fetch(`${BASE}/streaks/checkin`, { method: 'POST' })
}

export async function getStreaks() {
  const r = await fetch(`${BASE}/streaks`)
  return r.json()
}

export async function getLearnArticles() {
  const r = await fetch(`${BASE}/learn`)
  return r.json()
}

export async function getLearnArticle(slug) {
  const r = await fetch(`${BASE}/learn/${slug}`)
  return r.json()
}
