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
    if (!username.trim() || !password.trim()) { setError('Fill in all fields'); return }
    if (username.includes(' ')) { setError('No spaces in username'); return }
    if (password.length < 6) { setError('Password needs 6+ characters'); return }
    setLoading(true); setError('')
    const email = `${username.toLowerCase()}@cassette.local`
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError('Wrong username or password'); setLoading(false); return }
    }
    router.push('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>

      {/* Background decoration */}
      <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,200,66,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(90,143,224,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', width: '100%', maxWidth: '900px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>

        {/* Left: form */}
        <div className="fade-up" style={{ flex: 1, padding: '3.5rem 3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className="cassette-tape">📼</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.02em' }}>Cassette Manager</span>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Study smarter. Stay organised. Ace it.</p>
          </div>

          {/* Toggle */}
          <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '4px', marginBottom: '2rem', border: '1px solid var(--border)' }}>
            {['Login', 'Sign Up'].map((t, i) => (
              <button key={t} onClick={() => { setIsSignUp(i === 1); setError('') }} style={{ flex: 1, padding: '0.55rem', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', fontFamily: 'var(--font-display)', transition: 'all 0.2s', background: (i === 1) === isSignUp ? 'var(--accent)' : 'transparent', color: (i === 1) === isSignUp ? 'var(--accent-fg)' : 'var(--muted)' }}>{t}</button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', marginBottom: '0.4rem', letterSpacing: '0.1em' }}>USERNAME</label>
              <input className="input-field" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder="your_username" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', marginBottom: '0.4rem', letterSpacing: '0.1em' }}>PASSWORD</label>
              <input className="input-field" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder="••••••••" />
            </div>
          </div>

          {error && <div style={{ background: 'rgba(224,90,78,0.12)', border: '1px solid rgba(224,90,78,0.3)', borderRadius: 'var(--radius)', padding: '0.7rem 1rem', marginBottom: '1rem', color: 'var(--red)', fontSize: '0.85rem' }}>⚠️ {error}</div>}

          <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Loading...' : isSignUp ? '🚀 Create Account' : '▶ Sign In'}
          </button>

          {isSignUp && <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem', marginTop: '1rem' }}>No email needed — just username & password</p>}
        </div>

        {/* Right: feature highlights */}
        <div className="fade-up-2" style={{ flex: 1, background: 'var(--surface2)', borderLeft: '1px solid var(--border)', padding: '3.5rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.2rem' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>EVERYTHING YOU NEED</p>
          {[
            { icon: '📚', title: 'Subjects', desc: 'Organise notes, media & tasks per course' },
            { icon: '✅', title: 'To-Do Lists', desc: 'Folders, checkboxes, progress tracking' },
            { icon: '📅', title: 'Calendar', desc: 'Deadlines, events & reminders' },
            { icon: '🧠', title: 'Notes', desc: 'Quick points you can revisit anytime' },
            { icon: '🎨', title: 'Themes', desc: 'Light & dark modes with custom colours' },
          ].map((f, i) => (
            <div key={f.title} className={`fade-up-${Math.min(i + 2, 5)}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.1rem' }}>{f.title}</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.8rem', lineHeight: 1.4 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}