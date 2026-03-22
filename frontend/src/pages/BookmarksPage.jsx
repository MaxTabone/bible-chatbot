import { Link } from 'react-router-dom'
import { useBookmarks } from '../hooks/useBookmarks'

export default function BookmarksPage() {
  const { bookmarks, remove } = useBookmarks()

  return (
    <div style={{ padding:32, fontFamily:'sans-serif', maxWidth:700, margin:'0 auto' }}>
      <h1 style={{ color:'#a89de0', marginBottom:24 }}>Bookmarks</h1>
      {bookmarks.length === 0 && <p style={{ color:'#6b7280' }}>No bookmarks yet. Bookmark verses while reading.</p>}
      {bookmarks.map(b => (
        <div key={b.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #2e2e4e' }}>
          <Link to="/" style={{ color:'#e0d7c6' }}>
            <strong style={{ color:'#a89de0' }}>{b.book} {b.chapter}:{b.verse}</strong>
            {b.label && <span style={{ color:'#6b7280', marginLeft:8, fontSize:13 }}>— {b.label}</span>}
          </Link>
          <button onClick={() => remove(b.id)} style={{ background:'transparent', color:'#6b7280', fontSize:18 }}>✕</button>
        </div>
      ))}
    </div>
  )
}
