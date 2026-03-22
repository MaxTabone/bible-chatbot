import { useState, useEffect } from 'react'
import { getChapter, getSummary } from '../api'
import { useHighlights } from '../hooks/useHighlights'
import { useNotes } from '../hooks/useNotes'
import { useBookmarks } from '../hooks/useBookmarks'
import VerseRow from './VerseRow'
import Navbar from './Navbar'
import VoiceReader from './VoiceReader'

export default function BibleReader({ onContextChange }) {
  const saved = JSON.parse(localStorage.getItem('lastRead') || '{"book":"Genesis","chapter":1,"verse":1}')
  const [book, setBook] = useState(saved.book)
  const [chapter, setChapter] = useState(saved.chapter)
  const [translation, setTranslation] = useState('KJV')
  const [language, setLanguage] = useState('en')
  const [verses, setVerses] = useState([])
  const [summary, setSummary] = useState(null)
  const [fontSize, setFontSize] = useState(18)
  const [activeNote, setActiveNote] = useState(null)
  const [noteInput, setNoteInput] = useState('')
  const [readingVerse, setReadingVerse] = useState(null)

  const { highlights, toggle: toggleHighlight } = useHighlights(book, chapter)
  const { notes, addNote } = useNotes(book, chapter)
  const { bookmarks, add: addBookmark, remove, isBookmarked } = useBookmarks()

  useEffect(() => {
    getChapter(book, chapter, translation, language).then(setVerses)
    getSummary(book, chapter).then(setSummary)
    localStorage.setItem('lastRead', JSON.stringify({ book, chapter, verse: 1 }))
    if (onContextChange) onContextChange({ book, chapter, translation })
  }, [book, chapter, translation, language])

  const nav = (b, c) => { setBook(b); setChapter(c) }

  return (
    <div>
      <Navbar
        book={book} chapter={chapter} translation={translation} language={language}
        onNav={nav} onTranslationChange={(t, l) => { setTranslation(t); setLanguage(l) }}
        fontSize={fontSize} onFontSize={setFontSize}
      />
      <VoiceReader verses={verses} onVerseChange={setReadingVerse} />

      {summary && (
        <div style={{ background: '#1e1e3e', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontFamily: 'sans-serif', fontSize: 14, color: '#b0a8c8', fontStyle: 'italic' }}>
          {summary.summary}
        </div>
      )}

      <h2 style={{ fontFamily: 'sans-serif', marginBottom: 12, color: '#a89de0' }}>{book} {chapter}</h2>

      <div style={{ fontSize }}>
        {verses.map(v => (
          <VerseRow
            key={v.verse}
            verse={v.verse}
            text={v.text}
            highlight={highlights[v.verse]}
            hasNote={!!(notes[v.verse]?.length)}
            isBookmarked={isBookmarked(book, chapter, v.verse)}
            isReading={readingVerse === v.verse}
            onHighlight={(verse, color) => color ? toggleHighlight(verse, color) : toggleHighlight(verse, null)}
            onNoteClick={verse => { setActiveNote(verse); setNoteInput('') }}
            onBookmark={verse => {
              if (isBookmarked(book, chapter, verse)) {
                const bm = bookmarks.find(b => b.book === book && b.chapter === chapter && b.verse === verse)
                if (bm) remove(bm.id)
              } else {
                addBookmark(book, chapter, verse, `${book} ${chapter}:${verse}`)
              }
            }}
          />
        ))}
      </div>

      {activeNote && (
        <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: '#1e1e3e', border: '1px solid #2e2e4e', borderRadius: 8, padding: 16, zIndex: 100, width: 340 }}>
          <div style={{ fontFamily: 'sans-serif', marginBottom: 8, color: '#a89de0' }}>Note for verse {activeNote}</div>
          <textarea value={noteInput} onChange={e => setNoteInput(e.target.value)}
            style={{ width: '100%', height: 80, background: '#12122a', color: '#e0d7c6', border: '1px solid #2e2e4e', borderRadius: 4, padding: 8, resize: 'none', fontFamily: 'Georgia' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="primary" onClick={() => { addNote(activeNote, noteInput); setActiveNote(null) }}>Save</button>
            <button onClick={() => setActiveNote(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
