import { useState } from 'react'
import { getToken, setToken } from '../api'

function TokenBar() {
  const [value, setValue] = useState(getToken())
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setToken(value.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="token-bar">
      <span>JWT token:</span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="paste token from /api/auth/login"
      />
      <button onClick={handleSave}>Save</button>
      {saved && <span className="token-saved">saved</span>}
    </div>
  )
}

export default TokenBar
