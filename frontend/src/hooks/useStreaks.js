import { useState, useEffect } from 'react'
import { checkin, getStreaks } from '../api'

export function useStreaks() {
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const lastCheckin = localStorage.getItem('lastCheckin')
    if (lastCheckin !== today) {
      checkin().then(() => {
        localStorage.setItem('lastCheckin', today)
      })
    }
    getStreaks().then(data => setStreak(data.current_streak))
  }, [])

  return streak
}
