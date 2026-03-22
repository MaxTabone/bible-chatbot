import { useState, useRef, useEffect } from 'react'

export default function ChatPanel({ book = 'Genesis', chapter = 1, translation = 'KJV' }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your Catholic Bible guide. Ask me anything about the passage you are reading or about the Faith.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg, book, chapter, translation }),
    })

    if (!res.ok) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'The AI assistant is currently unavailable. Please check your API key and internet connection.' }])
      setLoading(false)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let aiText = ''
    setMessages(prev => [...prev, { role: 'assistant', text: '' }])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
      for (const line of lines) {
        const data = line.slice(6)
        if (data === '[DONE]') { setLoading(false); break }
        if (data.startsWith('[ERROR]')) {
          setMessages(prev => { const n=[...prev]; n[n.length-1].text = data; return n })
          setLoading(false)
          break
        }
        aiText += data
        setMessages(prev => { const n=[...prev]; n[n.length-1]={role:'assistant',text:aiText}; return n })
      }
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'sans-serif' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #2e2e4e', fontSize: 13, color: '#a89de0', fontWeight: 'bold' }}>
        AI Bible Guide
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            background: m.role === 'user' ? '#5b4fcf' : '#1e1e3e',
            color: '#e0d7c6',
            padding: '8px 12px',
            borderRadius: 10,
            maxWidth: '88%',
            fontSize: 14,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}>
            {m.text}
          </div>
        ))}
        {loading && <div style={{ color: '#6b7280', fontSize: 13 }}>Thinking...</div>}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '10px 14px', borderTop: '1px solid #2e2e4e', display: 'flex', gap: 8 }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Ask about this passage..."
          style={{ flex: 1, height: 60, background: '#12122a', color: '#e0d7c6', border: '1px solid #2e2e4e', borderRadius: 6, padding: '8px 10px', resize: 'none', fontFamily: 'sans-serif', fontSize: 13 }}
        />
        <button className="primary" onClick={send} disabled={loading} style={{ alignSelf: 'flex-end' }}>Send</button>
      </div>
    </div>
  )
}
