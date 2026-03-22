import { useState, useEffect } from 'react'
import { getHighlights, createHighlight, deleteHighlight } from '../api'

export function useHighlights(book, chapter) {
  const [highlights, setHighlights] = useState({}) // verse -> {id, color}

  useEffect(() => {
    if (!book || !chapter) return
    getHighlights(book, chapter).then(data => {
      const map = {}
      data.forEach(h => { map[h.verse] = { id: h.id, color: h.color } })
      setHighlights(map)
    })
  }, [book, chapter])

  const toggle = async (verse, color) => {
    if (highlights[verse]) {
      await deleteHighlight(highlights[verse].id)
      setHighlights(prev => { const n = {...prev}; delete n[verse]; return n })
    } else {
      const result = await createHighlight(book, chapter, verse, color)
      setHighlights(prev => ({ ...prev, [verse]: { id: result.id, color } }))
    }
  }

  return { highlights, toggle }
}
