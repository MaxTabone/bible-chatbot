import { useState, useEffect, useRef } from 'react'

export function useVoice(verses, onVerseChange) {
  const [supported] = useState(() => 'speechSynthesis' in window)
  const [playing, setPlaying] = useState(false)
  const [voices, setVoices] = useState([])
  const [voiceIndex, setVoiceIndex] = useState(0)
  const indexRef = useRef(0)
  const versesRef = useRef(verses)

  useEffect(() => { versesRef.current = verses }, [verses])

  useEffect(() => {
    if (!supported) return
    const load = () => setVoices(speechSynthesis.getVoices())
    load()
    speechSynthesis.onvoiceschanged = load
  }, [supported])

  const speak = (startIdx = 0) => {
    if (!supported || !versesRef.current.length) return
    speechSynthesis.cancel()
    indexRef.current = startIdx

    const readNext = () => {
      if (indexRef.current >= versesRef.current.length) { setPlaying(false); onVerseChange?.(null); return }
      const v = versesRef.current[indexRef.current]
      onVerseChange?.(v.verse)
      const utt = new SpeechSynthesisUtterance(`Verse ${v.verse}. ${v.text}`)
      if (voices[voiceIndex]) utt.voice = voices[voiceIndex]
      utt.onend = () => { indexRef.current++; readNext() }
      speechSynthesis.speak(utt)
    }

    setPlaying(true)
    readNext()
  }

  const pause = () => { speechSynthesis.pause(); setPlaying(false) }
  const resume = () => { speechSynthesis.resume(); setPlaying(true) }
  const stop = () => { speechSynthesis.cancel(); setPlaying(false); onVerseChange?.(null) }

  return { supported, playing, voices, voiceIndex, setVoiceIndex, speak, pause, resume, stop }
}
