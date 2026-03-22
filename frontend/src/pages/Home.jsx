import { useState } from 'react'
import BibleReader from '../components/BibleReader'
import ChatPanel from '../components/ChatPanel'
import Notepad from '../components/Notepad'

export default function Home() {
  const [context, setContext] = useState({ book: 'Genesis', chapter: 1, translation: 'KJV' })

  return (
    <div style={{ display:'grid', gridTemplateRows:'1fr', gridTemplateColumns:'1fr 340px', height:'calc(100vh - 56px)', overflow:'hidden' }}>
      <div style={{ overflowY:'auto', padding:'16px 32px' }}>
        <BibleReader onContextChange={setContext} />
      </div>
      <div style={{ borderLeft:'1px solid #2e2e4e', overflow:'hidden', display:'flex', flexDirection:'column' }}>
        <ChatPanel book={context.book} chapter={context.chapter} translation={context.translation} />
      </div>
      <Notepad />
    </div>
  )
}
