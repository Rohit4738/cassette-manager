'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    const email = `${username}@cassette.app`

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else router.push('/dashboard')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('Invalid username or password')
      else router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0f0f0f', fontFamily: 'sans-serif'
    }}>
      <div style={{
        background: '#1a1a1a', padding: '2.5rem', borderRadius: '16px',
        width: '100%', maxWidth: '400px', color: 'white'
      }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>📼 Cassette</h1>
        <p style={{ color: '#888', marginBottom: '2rem' }}>Your personal study manager</p>

        <h2 style={{ marginBottom: '1.5rem' }}>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>

        <input
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={inputStyle}
        />

        {error && <p style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{error}</p>}

        <button onClick={handleSubmit} disabled={loading} style={btnStyle}>
          {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Login'}
        </button>

        <p style={{ textAlign: 'center', color: '#888', marginTop: '1rem' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <span
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ color: '#7c6fcd', cursor: 'pointer' }}
          >
            {isSignUp ? 'Login' : 'Sign Up'}
          </span>
        </p>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '0.75rem 1rem', marginBottom: '1rem',
  background: '#2a2a2a', border: '1px solid #333', borderRadius: '8px',
  color: 'white', fontSize: '1rem', boxSizing: 'border-box'
}

const btnStyle = {
  width: '100%', padding: '0.75rem', background: '#7c6fcd',
  border: 'none', borderRadius: '8px', color: 'white',
  fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold'
}