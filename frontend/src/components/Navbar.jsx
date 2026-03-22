import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getBooks, getTranslations } from '../api'
import StreakBadge from './StreakBadge'
import { useStreaks } from '../hooks/useStreaks'

export default function Navbar({ book, chapter, translation, language, onNav, onTranslationChange, fontSize, onFontSize }) {
  const [books, setBooks] = useState([])
  const [translations, setTranslations] = useState([])
  const streak = useStreaks()

  useEffect(() => {
    getBooks().then(setBooks)
    getTranslations().then(setTranslations)
  }, [])

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px',
      height: 56, background: '#12122a', borderBottom: '1px solid #2e2e4e',
      fontFamily: 'sans-serif', fontSize: 14
    }}>
      <Link to="/" style={{ fontWeight: 'bold', color: '#a89de0', fontSize: 18 }}>Bible</Link>

      <select value={book} onChange={e => onNav(e.target.value, 1)}
        style={{ background: '#2e2e4e', color: '#e0d7c6', border: 'none', borderRadius: 4, padding: '4px 8px' }}>
        {books.map(b => <option key={b} value={b}>{b}</option>)}
      </select>

      <input type="number" min={1} value={chapter}
        onChange={e => onNav(book, parseInt(e.target.value) || 1)}
        style={{ width: 56, background: '#2e2e4e', color: '#e0d7c6', border: 'none', borderRadius: 4, padding: '4px 8px' }} />

      <select value={translation} onChange={e => onTranslationChange(e.target.value, language)}
        style={{ background: '#2e2e4e', color: '#e0d7c6', border: 'none', borderRadius: 4, padding: '4px 8px' }}>
        {translations.map(t => (
          <option key={t.translation} value={t.translation}>{t.translation} ({t.language})</option>
        ))}
      </select>

      <button onClick={() => onFontSize(Math.max(12, fontSize - 2))}>A-</button>
      <button onClick={() => onFontSize(Math.min(32, fontSize + 2))}>A+</button>

      <div style={{ marginLeft: 'auto' }}>
        <StreakBadge streak={streak} />
      </div>

      <Link to="/learn" style={{ color: '#a89de0' }}>Learn</Link>
      <Link to="/bookmarks" style={{ color: '#a89de0' }}>Bookmarks</Link>
    </nav>
  )
}
