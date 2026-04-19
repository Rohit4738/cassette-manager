'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import '@/app/globals.css'

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
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    setError('')
    const email = `${username.toLowerCase()}@cassette.local`

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      router.push('/dashboard')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError('Wrong username or password'); setLoading(false); return }
      router.push('/dashboard')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex' }}>
      {/* Left panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '3rem', borderRight: '1px solid var(--border)', maxWidth: '480px' }}>
        <div className="fade-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '4rem' }}>
            <span style={{ fontSize: '1.4rem' }}>📼</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--text)' }}>Cassette</span>
          </div>

          <div style={{ marginBottom: '2.5rem' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', lineHeight: 1.2, marginBottom: '0.75rem', color: 'var(--text)' }}>
              {isSignUp ? 'Create your account.' : 'Welcome back.'}
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
              {isSignUp ? 'Start managing your studies.' : 'Sign in to continue.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', marginBottom: '0.4rem', letterSpacing: '0.08em' }}>USERNAME</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="your_username"
                style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'var(--font-mono)' }}
                onFocus={e => e.target.style.borderColor = 'var(--text)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', marginBottom: '0.4rem', letterSpacing: '0.08em' }}>PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="••••••••"
                style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'var(--font-mono)' }}
                onFocus={e => e.target.style.borderColor = 'var(--text)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          </div>

          {error && (
            <div style={{ background: '#fdf2f2', border: '1px solid #f5c6c6', borderRadius: 'var(--radius)', padding: '0.7rem 1rem', marginBottom: '1rem', color: 'var(--danger)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: '100%', padding: '0.85rem', background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 'var(--radius)', fontSize: '0.9rem', fontWeight: '600', letterSpacing: '0.02em', opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>

          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem', marginTop: '1.2rem' }}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <span onClick={() => { setIsSignUp(!isSignUp); setError('') }} style={{ color: 'var(--text)', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}>
              {isSignUp ? 'Sign in' : 'Sign up'}
            </span>
          </p>
        </div>

        <p style={{ color: 'var(--muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>No email required. Just username + password.</p>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '3rem', gap: '2rem' }}>
        {[
          { icon: '📚', label: 'Subjects', desc: 'Organise by course' },
          { icon: '✅', label: 'To-Do Lists', desc: 'Track assignments' },
          { icon: '📅', label: 'Calendar', desc: 'Never miss deadlines' },
          { icon: '🧠', label: 'Notes', desc: 'Quick revision points' },
        ].map((f, i) => (
          <div key={f.label} className={`fade-up-${i + 1}`} style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', padding: '1.2rem 1.5rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '340px' }}>
            <span style={{ fontSize: '1.8rem' }}>{f.icon}</span>
            <div>
              <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{f.label}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}