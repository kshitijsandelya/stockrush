import { useEffect, useState } from 'react'

function getStatus(startTime, endTime) {
  const now = Date.now()
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()

  if (now < start) {
    return { phase: 'upcoming', target: start }
  }
  if (now >= start && now < end) {
    return { phase: 'live', target: end }
  }
  return { phase: 'ended', target: null }
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function CountdownTimer({ startTime, endTime }) {
  const [status, setStatus] = useState(() => getStatus(startTime, endTime))

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getStatus(startTime, endTime))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime, endTime])

  if (status.phase === 'ended') {
    return <div className="countdown ended">Sale ended</div>
  }

  const remaining = status.target - Date.now()
  const label = status.phase === 'upcoming' ? 'Starts in' : 'Ends in'

  return (
    <div className={`countdown ${status.phase}`}>
      {label} {formatDuration(remaining)}
    </div>
  )
}

export default CountdownTimer
