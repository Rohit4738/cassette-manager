'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const THEMES = [
  { id: 'solar',    label: 'Solar',    hex: '#f0c040' },
  { id: 'crimson',  label: 'Crimson',  hex: '#e53935' },
  { id: 'cobalt',   label: 'Cobalt',   hex: '#4a7feb' },
  { id: 'bloom',    label: 'Bloom',    hex: '#e84393' },
  { id: 'terrain',  label: 'Terrain',  hex: '#c8a86b' },
  { id: 'sapphire', label: 'Sapphire', hex: '#1e88e5' },
  { id: 'obsidian', label: 'Obsidian', hex: '#e8d44d' },
  { id: 'scarlet',  label: 'Scarlet',  hex: '#f44336' },
  { id: 'violet',   label: 'Violet',   hex: '#9c27b0' },
  { id: 'forest',   label: 'Forest',   hex: '#43a047' },
]

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState('google')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        if (profile?.username) {
          document.documentElement.setAttribute('data-theme', profile.theme || 'solar')
          router.replace('/dashboard')
          return
        } else { setStep('username') }
      }
      setChecking(false)
    }
    check()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        if (profile?.username) {
          document.documentElement.setAttribute('data-theme', profile.theme || 'solar')
          router.replace('/dashboard')
        } else { setChecking(false); setStep('username') }
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleGoogle = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://cassette-manager.vercel.app/login' }
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  const handleUsername = async () => {
    if (!username.trim()) { setError('Please enter a username'); return }
    if (username.includes(' ')) { setError('No spaces allowed'); return }
    if (username.length < 3) { setError('At least 3 characters'); return }
    setLoading(true); setError('')
    const { data: existing } = await supabase.from('profiles').select('id').eq('username', username.toLowerCase()).maybeSingle()
    if (existing) { setError('Username taken — try another'); setLoading(false); return }
    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id, username: username.toLowerCase(),
      email: session.user.email, theme: 'solar'
    })
    if (error) { setError(error.message); setLoading(false); return }
    await supabase.auth.updateUser({ data: { username: username.toLowerCase() } })
    router.replace('/dashboard')
  }

  if (checking) return (
    <div data-theme="solar" style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', background: '#f0c040', borderRadius: '14px', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
        </div>
        <p style={{ color: '#606060', fontSize: '.9rem' }}>Loading...</p>
      </div>
    </div>
  )

  return (
    <div data-theme="solar" style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', fontFamily: 'Inter, sans-serif' }}>

      {step === 'google' && (
        <>
          {/* Left */}
          <div style={{ flex: '0 0 440px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem 3.5rem', borderRight: '1px solid #1e1e1e' }}>
            <div className="fade-up">
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '3.5rem' }}>
                <div style={{ width: '38px', height: '38px', background: '#f0c040', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
                </div>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f5f5f5', letterSpacing: '-.01em' }}>Cassette Manager</span>
              </div>

              <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#f5f5f5', lineHeight: 1.15, letterSpacing: '-.03em', marginBottom: '.75rem' }}>
                Your studies,<br />under control.
              </h1>
              <p style={{ color: '#606060', fontSize: '.95rem', marginBottom: '2.5rem', lineHeight: 1.7 }}>
                One place for subjects, tasks, deadlines and notes. Sign in to get started.
              </p>

              {error && (
                <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: '12px', padding: '.75rem 1rem', marginBottom: '1.2rem', color: '#ef4444', fontSize: '.84rem', fontWeight: 500 }}>
                  {error}
                </div>
              )}

              <button onClick={handleGoogle} disabled={loading} style={{ width: '100%', padding: '.9rem 1.5rem', background: '#f5f5f5', border: 'none', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.85rem', fontSize: '.95rem', fontWeight: 700, color: '#0a0a0a', cursor: 'pointer', transition: 'opacity .18s, transform .18s', opacity: loading ? .6 : 1 }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Redirecting...' : 'Continue with Google'}
              </button>
              <p style={{ textAlign: 'center', color: '#444', fontSize: '.78rem', marginTop: '1rem' }}>New users will choose a username after sign in.</p>
            </div>
          </div>

          {/* Right — feature bento */}
          <div className="fade-up-2" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto auto', gap: '1rem', padding: '3rem', alignContent: 'center' }}>
            {[
              { title: 'Subjects', desc: 'One place for each course — notes, files and tasks.', span: false, accent: false },
              { title: 'Event Calendar', desc: 'Deadlines and reminders, always visible.', span: false, accent: true },
              { title: 'To-Do Lists', desc: 'Folders, checkboxes, and a live progress bar per subject.', span: true, accent: false },
              { title: '10 Themes', desc: 'Switch your colour palette any time from settings.', span: false, accent: false },
            ].map((f, i) => (
              <div key={f.title} className={`fade-up-${i + 2}`} style={{ gridColumn: f.span ? 'span 2' : 'span 1', background: f.accent ? '#f0c040' : '#141414', border: `1px solid ${f.accent ? 'transparent' : '#222'}`, borderRadius: '22px', padding: '1.75rem', cursor: 'default' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: f.accent ? '#0a0a0a' : '#f5f5f5', marginBottom: '.4rem' }}>{f.title}</div>
                <div style={{ color: f.accent ? 'rgba(0,0,0,.6)' : '#606060', fontSize: '.84rem', lineHeight: 1.55 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {step === 'username' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="pop-in" style={{ width: '100%', maxWidth: '420px', background: '#141414', border: '1px solid #222', borderRadius: '28px', padding: '3rem 2.5rem' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f5f5f5', letterSpacing: '-.02em', marginBottom: '.5rem' }}>One last step</h2>
            <p style={{ color: '#606060', fontSize: '.9rem', marginBottom: '2rem', lineHeight: 1.6 }}>
              Pick a username for your account. You only do this once.
            </p>
            <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#606060', marginBottom: '.5rem', letterSpacing: '.08em' }}>USERNAME</label>
            <input className="input-field" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUsername()} placeholder="e.g. alex_smith" style={{ marginBottom: '1rem' }} />
            {error && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: '10px', padding: '.7rem 1rem', marginBottom: '1rem', color: '#ef4444', fontSize: '.84rem' }}>{error}</div>}
            <button className="btn-primary" onClick={handleUsername} disabled={loading} style={{ width: '100%', padding: '.85rem', fontSize: '.95rem', borderRadius: '12px' }}>
              {loading ? 'Setting up...' : 'Get Started'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}