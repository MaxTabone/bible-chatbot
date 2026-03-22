import { useState } from 'react'

const COLORS = ['#FFFF99', '#99FF99', '#99CCFF', '#FFB3BA', '#E0BAFF']

export default function VerseRow({ verse, text, highlight, hasNote, onHighlight, onNoteClick, onBookmark, isBookmarked, isReading }) {
  const [showColors, setShowColors] = useState(false)

  const bg = isReading ? '#3a3a6e' : highlight ? highlight.color + '33' : 'transparent'

  return (
    <div style={{ display: 'flex', gap: 8, padding: '6px 0', background: bg, borderRadius: 4, position: 'relative' }}>
      <span style={{ color: '#6b7280', minWidth: 28, fontSize: 12, paddingTop: 3, fontFamily: 'sans-serif' }}>{verse}</span>
      <span style={{ flex: 1, lineHeight: 1.8 }}>{text}</span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start', paddingTop: 2 }}>
        <button title="Highlight" onClick={() => setShowColors(v => !v)}
          style={{ padding: '2px 6px', fontSize: 12, background: highlight ? highlight.color : '#2e2e4e' }}>
          ✏
        </button>
        {showColors && (
          <div style={{ position: 'absolute', right: 40, top: 0, background: '#12122a', border: '1px solid #2e2e4e', borderRadius: 6, padding: 4, display: 'flex', gap: 4, zIndex: 10 }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => { onHighlight(verse, c); setShowColors(false) }}
                style={{ background: c, width: 20, height: 20, padding: 0, borderRadius: 3 }} />
            ))}
            {highlight && <button onClick={() => { onHighlight(verse, null); setShowColors(false) }} style={{ fontSize: 10 }}>✕</button>}
          </div>
        )}
        <button title="Note" onClick={() => onNoteClick(verse)}
          style={{ padding: '2px 6px', fontSize: 12, background: hasNote ? '#5b4fcf' : '#2e2e4e' }}>
          📝
        </button>
        <button title="Bookmark" onClick={() => onBookmark(verse)}
          style={{ padding: '2px 6px', fontSize: 12, background: isBookmarked ? '#f4a261' : '#2e2e4e' }}>
          🔖
        </button>
      </div>
    </div>
  )
}
