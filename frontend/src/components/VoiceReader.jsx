import { useVoice } from '../hooks/useVoice'

export default function VoiceReader({ verses, onVerseChange }) {
  const { supported, playing, voices, voiceIndex, setVoiceIndex, speak, pause, resume, stop } = useVoice(verses, onVerseChange)

  if (!supported) {
    return <div style={{ fontFamily:'sans-serif', fontSize:13, color:'#6b7280', padding:'8px 0' }}>Voice reading is not supported in your browser.</div>
  }

  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', fontFamily:'sans-serif', fontSize:13 }}>
      <button onClick={() => playing ? pause() : speak(0)}>{playing ? '⏸ Pause' : '▶ Play'}</button>
      {!playing && <button onClick={resume}>⏯ Resume</button>}
      <button onClick={stop}>⏹ Stop</button>
      <select value={voiceIndex} onChange={e => setVoiceIndex(Number(e.target.value))}
        style={{ background:'#2e2e4e', color:'#e0d7c6', border:'none', borderRadius:4, padding:'4px 8px' }}>
        {voices.map((v, i) => <option key={i} value={i}>{v.name} ({v.lang})</option>)}
      </select>
    </div>
  )
}
