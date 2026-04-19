'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState('login') // 'login' | 'username'
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Check if already logged in
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const meta = session.user.user_metadata
        if (meta?.username) router.replace('/dashboard')
        else setStep('username')
      }
      setChecking(false)
    }
    check()

    // Handle OAuth redirect
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const meta = session.user.user_metadata
        if (meta?.username) router.replace('/dashboard')
        else setStep('username')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/login` }
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  const handleSetUsername = async () => {
    if (!username.trim()) { setError('Please enter a username'); return }
    if (username.includes(' ')) { setError('No spaces allowed'); return }
    if (username.length < 3) { setError('Username must be at least 3 characters'); return }
    setLoading(true); setError('')

    // Check uniqueness
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .maybeSingle()

    if (existing) { setError('Username already taken — try another'); setLoading(false); return }

    const { data: { session } } = await supabase.auth.getSession()

    // Save username to profiles table
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      username: username.toLowerCase(),
      email: session.user.email
    })

    if (error) { setError(error.message); setLoading(false); return }

    // Update user metadata
    await supabase.auth.updateUser({ data: { username: username.toLowerCase() } })
    router.replace('/dashboard')
  }

  if (checking) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📼</div>
        <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Loading...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', fontFamily: 'var(--font-body)' }}>

      {/* Left panel */}
      <div style={{ flex: '0 0 480px', background: 'var(--surface)', borderRight: '1.5px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '3rem', justifyContent: 'space-between' }}>
        <div>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3.5rem' }}>
            <div style={{ width: '36px', height: '36px', background: 'var(--accent)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📼</div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--text)', fontStyle: 'italic' }}>Cassette Manager</span>
          </div>

          {step === 'login' && (
            <div className="fade-up">
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.6rem', lineHeight: 1.15, marginBottom: '0.6rem', fontStyle: 'italic' }}>
                Your studies,<br />organised.
              </h1>
              <p style={{ color: 'var(--muted)', fontSize: '0.95rem', marginBottom: '2.5rem' }}>Sign in to access your subjects, tasks and calendar.</p>

              {error && (
                <div style={{ background: '#fef2f0', border: '1.5px solid #f5c4bb', borderRadius: 'var(--radius)', padding: '0.8rem 1rem', marginBottom: '1.2rem', color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600 }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                style={{ width: '100%', padding: '0.85rem 1.5rem', background: 'var(--surface)', border: '1.5px solid var(--border2)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', cursor: 'pointer', transition: 'all 0.18s', boxShadow: 'var(--shadow-sm)', opacity: loading ? 0.6 : 1 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text)'; e.currentTarget.style.boxShadow = 'var(--shadow)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Redirecting...' : 'Continue with Google'}
              </button>

              <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem', marginTop: '1.5rem' }}>
                New users will be asked to pick a username after signing in.
              </p>
            </div>
          )}

          {step === 'username' && (
            <div className="scale-in">
              <div style={{ width: '48px', height: '48px', background: 'var(--accent-light)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1.5rem' }}>👋</div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', marginBottom: '0.5rem', fontStyle: 'italic' }}>Pick a username</h1>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>This is how you'll be identified on Cassette Manager.</p>

              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text2)', marginBottom: '0.5rem', letterSpacing: '0.06em' }}>USERNAME</label>
              <input
                className="input-field"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSetUsername()}
                placeholder="e.g. rohit_4738"
                style={{ marginBottom: '1rem' }}
              />

              {error && (
                <div style={{ background: '#fef2f0', border: '1.5px solid #f5c4bb', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', marginBottom: '1rem', color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600 }}>
                  ⚠️ {error}
                </div>
              )}

              <button className="btn-primary" onClick={handleSetUsername} disabled={loading} style={{ width: '100%', padding: '0.85rem' }}>
                {loading ? 'Setting up...' : 'Get Started →'}
              </button>
            </div>
          )}
        </div>

        <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
          Your data is private and secure. No email confirmation needed.
        </p>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem 3.5rem', gap: '1.5rem' }}>
        <div className="fade-up" style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--accent)', marginBottom: '0.75rem' }}>EVERYTHING IN ONE PLACE</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', lineHeight: 1.25, color: 'var(--text)', fontStyle: 'italic' }}>Built for students<br />who mean business.</h2>
        </div>

        {[
          { icon: '📚', color: 'var(--navy)', bg: 'var(--navy-light)', title: 'Subjects', desc: 'Organise notes, media, and assignments per course with progress tracking.' },
          { icon: '📅', color: 'var(--accent)', bg: 'var(--accent-light)', title: 'Event Calendar', desc: 'Plan ahead with deadlines, events, and smart reminders 7 & 5 days before.' },
          { icon: '✅', color: 'var(--green)', bg: 'var(--green-light)', title: 'To-Do Lists', desc: 'Folders, checkboxes, and a live progress bar per subject.' },
          { icon: '🧠', color: '#7c5cbf', bg: '#f0ebfb', title: 'Quick Notes', desc: 'Jot down key points you can revisit and convert to tasks anytime.' },
        ].map((f, i) => (
          <div key={f.title} className={`fade-up-${i + 2} card`} style={{ padding: '1.2rem 1.4rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', cursor: 'default' }}>
            <div style={{ width: '40px', height: '40px', background: f.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>{f.icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: f.color, marginBottom: '0.15rem' }}>{f.title}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.83rem', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}