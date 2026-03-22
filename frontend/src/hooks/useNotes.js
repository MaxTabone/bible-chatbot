import { useState, useEffect } from 'react'
import { getNotes, createNote, deleteNote } from '../api'

export function useNotes(book, chapter) {
  const [notes, setNotes] = useState({}) // verse -> [{id, note_text}]

  useEffect(() => {
    if (!book || !chapter) return
    getNotes(book, chapter).then(data => {
      const map = {}
      data.forEach(n => {
        if (!map[n.verse]) map[n.verse] = []
        map[n.verse].push(n)
      })
      setNotes(map)
    })
  }, [book, chapter])

  const addNote = async (verse, text) => {
    const result = await createNote(book, chapter, verse, text)
    setNotes(prev => ({
      ...prev,
      [verse]: [...(prev[verse] || []), { id: result.id, note_text: text }]
    }))
  }

  const removeNote = async (verse, id) => {
    await deleteNote(id)
    setNotes(prev => ({
      ...prev,
      [verse]: (prev[verse] || []).filter(n => n.id !== id)
    }))
  }

  return { notes, addNote, removeNote }
}
