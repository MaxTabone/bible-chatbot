import { useState, useRef } from 'react'
import { useNotes } from '../hooks/useNotes'

export default function Notepad({ book, chapter, activeVerse, onClose }) {
  const [open, setOpen] = useState(false)
  const [noteInput, setNoteInput] = useState('')
  const [pos, setPos] = useState({ x: 80, y: 120 })
  const dragging = useRef(false)
  const offset = useRef({ x: 0, y: 0 })

  const { notes, addNote, removeNote } = useNotes(book, chapter)
  const verseNotes = activeVerse ? (notes[activeVerse] || []) : []

  const onMouseDown = (e) => {
    dragging.current = true
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }
  const onMouseMove = (e) => {
    if (!dragging.current) return
    setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y })
  }
  const onMouseUp = () => {
    dragging.current = false
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  const save = async () => {
    if (!noteInput.trim() || !activeVerse) return
    await addNote(activeVerse, noteInput.trim())
    setNoteInput('')
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        style={{ position:'fixed', bottom:24, left:24, zIndex:200, background:'#5b4fcf', color:'white', padding:'10px 16px', borderRadius:24, fontSize:16 }}>
        📓 Notepad
      </button>
    )
  }

  return (
    <div style={{ position:'fixed', left:pos.x, top:pos.y, zIndex:200, background:'#1e1e3e', border:'1px solid #3e3e6e', borderRadius:10, width:320, boxShadow:'0 8px 32px rgba(0,0,0,0.5)' }}>
      <div onMouseDown={onMouseDown}
        style={{ padding:'8px 12px', background:'#2e2e4e', borderRadius:'10px 10px 0 0', cursor:'grab', display:'flex', justifyContent:'space-between', alignItems:'center', userSelect:'none' }}>
        <span style={{ fontFamily:'sans-serif', fontSize:13, color:'#a89de0' }}>
          📓 {activeVerse ? `Notes — verse ${activeVerse}` : 'Notepad'}
        </span>
        <button onClick={() => setOpen(false)} style={{ background:'transparent', color:'#6b7280', padding:0, fontSize:16 }}>✕</button>
      </div>

      <div style={{ padding:'8px 12px', maxHeight:160, overflowY:'auto' }}>
        {verseNotes.length === 0 && <p style={{ color:'#6b7280', fontSize:13, fontFamily:'sans-serif' }}>{activeVerse ? 'No notes for this verse yet.' : 'Click 📝 on a verse to attach a note.'}</p>}
        {verseNotes.map(n => (
          <div key={n.id} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid #2e2e4e', fontSize:14 }}>
            <span style={{ flex:1 }}>{n.note_text}</span>
            <button onClick={() => removeNote(activeVerse, n.id)} style={{ background:'transparent', color:'#6b7280', padding:'0 4px', fontSize:14 }}>✕</button>
          </div>
        ))}
      </div>

      {activeVerse && (
        <div style={{ padding:'8px 12px', borderTop:'1px solid #2e2e4e' }}>
          <textarea value={noteInput} onChange={e => setNoteInput(e.target.value)}
            style={{ width:'100%', height:72, background:'#12122a', color:'#e0d7c6', border:'1px solid #2e2e4e', borderRadius:4, padding:8, resize:'none', fontFamily:'Georgia', fontSize:14 }}
            placeholder="Add a note..." />
          <button className="primary" onClick={save} style={{ marginTop:6, width:'100%' }}>Save Note</button>
        </div>
      )}
    </div>
  )
}
