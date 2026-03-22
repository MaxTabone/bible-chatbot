import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import LearnPage from './pages/LearnPage'
import BookmarksPage from './pages/BookmarksPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/bookmarks" element={<BookmarksPage />} />
      </Routes>
    </BrowserRouter>
  )
}
