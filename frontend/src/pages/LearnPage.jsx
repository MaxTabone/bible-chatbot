import { useState, useEffect } from 'react'
import { getLearnArticles, getLearnArticle } from '../api'
import ChatPanel from '../components/ChatPanel'

export default function LearnPage() {
  const [articles, setArticles] = useState([])
  const [current, setCurrent] = useState(null)

  useEffect(() => { getLearnArticles().then(setArticles) }, [])

  const open = (slug) => getLearnArticle(slug).then(setCurrent)

  return (
    <div style={{ display:'grid', gridTemplateColumns:'220px 1fr 340px', height:'calc(100vh - 56px)', fontFamily:'sans-serif' }}>
      <div style={{ padding:16, borderRight:'1px solid #2e2e4e', overflowY:'auto' }}>
        <h3 style={{ color:'#a89de0', marginBottom:12, fontSize:14 }}>Catholic Reference</h3>
        {articles.map(a => (
          <div key={a.slug} onClick={() => open(a.slug)}
            style={{ padding:'8px 10px', borderRadius:6, cursor:'pointer', marginBottom:4,
              background: current?.slug === a.slug ? '#2e2e4e' : 'transparent', fontSize:14 }}>
            {a.title}
          </div>
        ))}
      </div>

      <div style={{ padding:32, overflowY:'auto', maxWidth:720 }}>
        {current
          ? <div style={{ lineHeight:1.8, fontSize:16 }}>
              <pre style={{ whiteSpace:'pre-wrap', fontFamily:'Georgia' }}>{current.content}</pre>
            </div>
          : <div style={{ color:'#6b7280', marginTop:60, textAlign:'center' }}>Select an article to read</div>
        }
      </div>

      <div style={{ borderLeft:'1px solid #2e2e4e' }}>
        <ChatPanel />
      </div>
    </div>
  )
}
