import { useState, useEffect } from 'react'
import { getBookmarks, createBookmark, deleteBookmark } from '../api'

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState([])

  useEffect(() => {
    getBookmarks().then(setBookmarks)
  }, [])

  const add = async (book, chapter, verse, label) => {
    const result = await createBookmark(book, chapter, verse, label)
    setBookmarks(prev => [...prev, { id: result.id, book, chapter, verse, label }])
  }

  const remove = async (id) => {
    await deleteBookmark(id)
    setBookmarks(prev => prev.filter(b => b.id !== id))
  }

  const isBookmarked = (book, chapter, verse) =>
    bookmarks.some(b => b.book === book && b.chapter === chapter && b.verse === verse)

  return { bookmarks, add, remove, isBookmarked }
}
