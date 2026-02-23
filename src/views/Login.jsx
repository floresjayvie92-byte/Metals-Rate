import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function getUsers() {
  try { return JSON.parse(localStorage.getItem('users') || '[]') } catch (e) { return [] }
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function submit(e) {
    e.preventDefault()
    setError('')
    const users = getUsers()
    const user = users.find(u => u.email === email && u.password === password)
    if (!user) { setError('Invalid email or password'); return }
    localStorage.setItem('currentUser', JSON.stringify({ name: user.name, email: user.email }))
    window.dispatchEvent(new Event('auth-changed'))
    navigate('/calculator')
  }

  return (
    <div className="auth" style={{ maxWidth: 420, margin: '2rem auto' }}>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <label>Email</label>
        <input type="email" value={email} required onChange={e => setEmail(e.target.value)} />
        <label>Password</label>
        <input type="password" value={password} required onChange={e => setPassword(e.target.value)} />
        <button style={{ marginTop: 12 }} type="submit">Login</button>
      </form>
      {error ? <p style={{ color: 'red' }}>{error}</p> : null}
    </div>
  )
}
