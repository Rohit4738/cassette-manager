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
    if (!username.trim() || !password.trim()) { setError('Please fill in all fields'); return }
    if (username.includes(' ')) { setError('Username cannot contain spaces'); return }
    setLoading(true)
    setError('')
    const email = `${username.toLowerCase()}@cassette.app`

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
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Segoe UI', sans-serif",
      padding: '1rem'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        padding: '3rem 2.5rem',
        width: '100%',
        maxWidth: '420px',
        color: 'white',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📼</div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>Cassette</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0.4rem 0 0', fontSize: '0.95rem' }}>Your personal study manager</p>
        </div>

        {/* Toggle */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '4px', marginBottom: '2rem' }}>
          {['Login', 'Sign Up'].map((t, i) => (
            <button key={t} onClick={() => { setIsSignUp(i === 1); setError('') }} style={{
              flex: 1, padding: '0.6rem', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', transition: 'all 0.2s',
              background: (i === 0 && !isSignUp) || (i === 1 && isSignUp) ? 'white' : 'transparent',
              color: (i === 0 && !isSignUp) || (i === 1 && isSignUp) ? '#302b63' : 'rgba(255,255,255,0.6)'
            }}>{t}</button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.4rem', display: 'block' }}>USERNAME</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Enter your username"
              style={{
                width: '100%', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', color: 'white',
                fontSize: '1rem', boxSizing: 'border-box', outline: 'none'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.4rem', display: 'block' }}>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Enter your password"
              style={{
                width: '100%', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', color: 'white',
                fontSize: '1rem', boxSizing: 'border-box', outline: 'none'
              }}
            />
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#ff6b6b', fontSize: '0.9rem' }}>
            ⚠️ {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '0.9rem', background: 'linear-gradient(135deg, #7c6fcd, #5a4fcf)',
          border: 'none', borderRadius: '12px', color: 'white', fontSize: '1rem',
          fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          transition: 'all 0.2s', letterSpacing: '0.3px'
        }}>
          {loading ? '⏳ Please wait...' : isSignUp ? '🚀 Create Account' : '✨ Login'}
        </button>

        {isSignUp && (
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '1.2rem' }}>
            No email needed — just a username & password
          </p>
        )}
      </div>
    </div>
  )
}