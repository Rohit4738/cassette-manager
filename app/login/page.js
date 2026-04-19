'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const THEMES = [
  { id: 'springfield',    label: '☀️ Springfield Days',   desc: 'Sunny yellow, warm and cheerful' },
  { id: 'spartans-rage',  label: '⚔️ Spartan\'s Rage',    desc: 'Deep red, battle-worn grey' },
  { id: 'the-invincible', label: '🦸 The Invincible',     desc: 'Royal blue and electric yellow' },
  { id: 'nolans-daughter',label: '🌸 Nolan\'s Daughter',  desc: 'Rose pink, sage, cream' },
  { id: 'quahog-dad',     label: '🍺 Quahog Dad',         desc: 'Earthy olive and warm brown' },
  { id: 'man-of-steel',   label: '🔵 Man of Steel',       desc: 'Classic cobalt blue and gold' },
  { id: 'dark-knight',    label: '🦇 The Dark Knight',    desc: 'Near-black with golden spark' },
  { id: 'web-slinger',    label: '🕷️ Web Slinger',        desc: 'Bold red and deep navy' },
  { id: 'wakanda',        label: '💜 Wakanda Forever',    desc: 'Royal purple and silver' },
  { id: 'emerald-archer', label: '🏹 Emerald Archer',     desc: 'Forest green and earthy gold' },
]

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState('google') // 'google' | 'username' | 'theme'
  const [username, setUsername] = useState('')
  const [selectedTheme, setSelectedTheme] = useState('springfield')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        if (profile?.username) {
          document.documentElement.setAttribute('data-theme', profile.theme || 'springfield')
          router.replace('/dashboard')
          return
        } else {
          setStep('username')
        }
      }
      setChecking(false)
    }
    check()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        if (profile?.username) {
          document.documentElement.setAttribute('data-theme', profile.theme || 'springfield')
          router.replace('/dashboard')
        } else {
          setChecking(false)
          setStep('username')
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleGoogle = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/login` }
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  const handleUsername = async () => {
    if (!username.trim()) { setError('Please enter a username'); return }
    if (username.includes(' ')) { setError('No spaces allowed'); return }
    if (username.length < 3) { setError('At least 3 characters'); return }
    setLoading(true); setError('')
    const { data: existing } = await supabase.from('profiles').select('id').eq('username', username.toLowerCase()).maybeSingle()
    if (existing) { setError('Username taken — try another one!'); setLoading(false); return }
    setStep('theme')
    setLoading(false)
  }

  const handleFinish = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      username: username.toLowerCase(),
      email: session.user.email,
      theme: selectedTheme
    })
    if (error) { setError(error.message); setLoading(false); return }
    await supabase.auth.updateUser({ data: { username: username.toLowerCase() } })
    document.documentElement.setAttribute('data-theme', selectedTheme)
    router.replace('/dashboard')
  }

  if (checking) return (
    <div data-theme="springfield" style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📼</div>
        <p style={{ color: 'var(--muted, #999)' }}>Just a sec...</p>
      </div>
    </div>
  )

  return (
    <div data-theme="springfield" style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Nunito, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>

      {step === 'google' && (
        <div style={{ display: 'flex', width: '100%', maxWidth: '960px', gap: '2rem', alignItems: 'stretch' }} className="mobile-stack">

          {/* Left: login */}
          <div className="fade-up card mobile-full" style={{ flex: '0 0 400px', padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '2.5rem' }}>
              <div style={{ width: '44px', height: '44px', background: 'var(--accent)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>📼</div>
              <div>
                <div style={{ fontWeight: 900, fontSize: '1.15rem', lineHeight: 1.1 }}>Cassette Manager</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Your personal study tool</div>
              </div>
            </div>

            <h1 style={{ fontSize: '1.9rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '.6rem' }}>
              Study smarter,<br />not harder. 🎯
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginBottom: '2rem', lineHeight: 1.6 }}>
              Track subjects, assignments, deadlines and notes — all in one place. Sign in to get started.
            </p>

            {error && <div style={{ background: '#fdecea', border: '2px solid #ffbbb5', borderRadius: '14px', padding: '.75rem 1rem', marginBottom: '1rem', color: '#c0392b', fontSize: '.85rem', fontWeight: 700 }}>⚠️ {error}</div>}

            <button onClick={handleGoogle} disabled={loading} style={{ width: '100%', padding: '.9rem 1.5rem', background: 'var(--surface)', border: '2px solid var(--border2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.75rem', fontSize: '.95rem', fontWeight: 800, color: 'var(--text)', cursor: 'pointer', transition: 'all .18s', boxShadow: '0 2px 8px rgba(0,0,0,.06)', opacity: loading ? .6 : 1 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? 'Opening Google...' : 'Continue with Google'}
            </button>
            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '.78rem', marginTop: '1rem' }}>New? You'll pick a username after signing in.</p>
          </div>

          {/* Right: feature cards */}
          <div className="fade-up-2 mobile-full" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem' }}>
            <p style={{ fontSize: '.72rem', fontWeight: 900, letterSpacing: '.12em', color: 'var(--accent)', marginBottom: '.25rem' }}>WHAT YOU GET</p>
            {[
              { icon: '📚', title: 'Subjects', desc: 'Create a subject for each course. Add notes, upload files, and track tasks all in one spot.' },
              { icon: '📅', title: 'Event Calendar', desc: 'See all your deadlines in a calendar. Get reminders 7 and 5 days before anything is due.' },
              { icon: '✅', title: 'To-Do Lists', desc: 'Organise tasks into folders per subject. A live progress bar shows how close you are to done.' },
              { icon: '🎨', title: 'Themes', desc: '10 unique colour themes inspired by iconic characters. Change anytime from settings.' },
            ].map((f, i) => (
              <div key={f.title} className={`fade-up-${i + 2} card`} style={{ padding: '1.1rem 1.3rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', cursor: 'default' }}>
                <div style={{ width: '38px', height: '38px', background: 'var(--accent-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{f.icon}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '.9rem', marginBottom: '.15rem' }}>{f.title}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '.82rem', lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'username' && (
        <div className="pop-in card" style={{ width: '100%', maxWidth: '420px', padding: '3rem 2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👋</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '.5rem' }}>Welcome!</h2>
          <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginBottom: '2rem', lineHeight: 1.6 }}>
            You're almost in! Pick a username — this is how you'll appear on Cassette Manager. You only do this once.
          </p>
          <input className="input-field" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUsername()} placeholder="e.g. rohit_4738" style={{ marginBottom: '1rem', textAlign: 'left' }} />
          {error && <div style={{ background: '#fdecea', border: '2px solid #ffbbb5', borderRadius: '14px', padding: '.75rem 1rem', marginBottom: '1rem', color: '#c0392b', fontSize: '.85rem', fontWeight: 700 }}>⚠️ {error}</div>}
          <button className="btn-primary" onClick={handleUsername} disabled={loading} style={{ width: '100%', padding: '.85rem', fontSize: '1rem' }}>
            {loading ? 'Checking...' : 'Next → Pick Your Theme'}
          </button>
        </div>
      )}

      {step === 'theme' && (
        <div className="pop-in" style={{ width: '100%', maxWidth: '680px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>🎨</div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '.4rem' }}>Pick your vibe</h2>
            <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>Choose a colour theme. You can change it anytime in Settings.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '.75rem', marginBottom: '1.5rem' }}>
            {THEMES.map(t => (
              <div key={t.id} data-theme={t.id} onClick={() => setSelectedTheme(t.id)} style={{ padding: '1rem 1.2rem', background: 'var(--surface)', border: `2.5px solid ${selectedTheme === t.id ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '18px', cursor: 'pointer', transition: 'all .18s', boxShadow: selectedTheme === t.id ? '0 4px 16px rgba(0,0,0,.12)' : 'none', transform: selectedTheme === t.id ? 'translateY(-2px)' : 'none', display: 'flex', alignItems: 'center', gap: '.85rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '99px', background: 'var(--accent)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '.88rem', color: 'var(--text)' }}>{t.label}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '.75rem' }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
          {error && <div style={{ background: '#fdecea', border: '2px solid #ffbbb5', borderRadius: '14px', padding: '.75rem 1rem', marginBottom: '1rem', color: '#c0392b', fontSize: '.85rem', fontWeight: 700, textAlign: 'center' }}>⚠️ {error}</div>}
          <button className="btn-primary" onClick={handleFinish} disabled={loading} style={{ width: '100%', padding: '.9rem', fontSize: '1rem' }} data-theme={selectedTheme}>
            {loading ? 'Setting up your space...' : '🚀 Launch Cassette Manager'}
          </button>
        </div>
      )}
    </div>
  )
}