import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function getUsers() {
  try { return JSON.parse(localStorage.getItem('users') || '[]') } catch (e) { return [] }
}
function saveUsers(users) { localStorage.setItem('users', JSON.stringify(users)) }

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function submit(e) {
    e.preventDefault()
    setError('')
    const users = getUsers()
    if (users.find(u => u.email === email)) { setError('Email already registered'); return }
    const newUser = { name, email, password }
    users.push(newUser)
    saveUsers(users)
    localStorage.setItem('currentUser', JSON.stringify({ name: newUser.name, email: newUser.email }))
    window.dispatchEvent(new Event('auth-changed'))
    navigate('/calculator')
  }

  return (
    <div className="auth" style={{ maxWidth: 420, margin: '2rem auto' }}>
      <h2>Register</h2>
      <form onSubmit={submit}>
        <label>Name</label>
        <input type="text" value={name} required onChange={e => setName(e.target.value)} />
        <label>Email</label>
        <input type="email" value={email} required onChange={e => setEmail(e.target.value)} />
        <label>Password</label>
        <input type="password" value={password} required onChange={e => setPassword(e.target.value)} />
        <button style={{ marginTop: 12 }} type="submit">Register</button>
      </form>
      {error ? <p style={{ color: 'red' }}>{error}</p> : null}
    </div>
  )
}
