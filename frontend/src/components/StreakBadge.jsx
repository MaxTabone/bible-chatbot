export default function StreakBadge({ streak }) {
  if (!streak) return null
  return (
    <span style={{ fontSize: 14, color: '#f4a261', fontFamily: 'sans-serif' }}>
      🔥 {streak} day{streak !== 1 ? 's' : ''}
    </span>
  )
}
