'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState('google') // 'google' | 'username'
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
        if (profile?.username) {
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
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
        if (profile?.username) {
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
      options: {
        redirectTo: 'https://cassette-manager.vercel.app/login'
      }
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  const handleUsername = async () => {
    if (!username.trim()) { setError('Please enter a username'); return }
    if (username.includes(' ')) { setError('No spaces allowed'); return }
    if (username.length < 3) { setError('At least 3 characters'); return }
    setLoading(true); setError('')

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .maybeSingle()

    if (existing) { setError('Username taken — try another!'); setLoading(false); return }

    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      username: username.toLowerCase(),
      email: session.user.email,
      theme: 'clean-white'
    })
    if (error) { setError(error.message); setLoading(false); return }
    await supabase.auth.updateUser({ data: { username: username.toLowerCase() } })
    router.replace('/dashboard')
  }

  if (checking) return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📼</div>
        <p style={{ color: '#999', fontWeight: 600 }}>Just a sec...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', fontFamily: 'Nunito, sans-serif' }}>

      {/* Left panel */}
      <div style={{ flex: '0 0 460px', borderRight: '1.5px solid #f0f0f0', display: 'flex', flexDirection: 'column', padding: '3rem', justifyContent: 'center' }}>

        {step === 'google' && (
          <div>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '3rem' }}>
              <div style={{ width: '40px', height: '40px', background: '#1a1a1a', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>📼</div>
              <div>
                <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#1a1a1a' }}>Cassette Manager</div>
                <div style={{ color: '#999', fontSize: '0.75rem', fontWeight: 600 }}>Your personal study tool</div>
              </div>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#1a1a1a', lineHeight: 1.2, marginBottom: '.6rem' }}>
              Study smarter,<br />not harder. 🎯
            </h1>
            <p style={{ color: '#888', fontSize: '.9rem', marginBottom: '2.5rem', lineHeight: 1.7, fontWeight: 500 }}>
              Track subjects, assignments, deadlines and notes — all in one place. Sign in with Google to get started.
            </p>

            {error && (
              <div style={{ background: '#fff5f5', border: '1.5px solid #ffcccc', borderRadius: '14px', padding: '.8rem 1rem', marginBottom: '1rem', color: '#cc3333', fontSize: '.85rem', fontWeight: 700 }}>
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleGoogle}
              disabled={loading}
              style={{ width: '100%', padding: '1rem 1.5rem', background: '#fff', border: '2px solid #e8e8e8', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.85rem', fontSize: '1rem', fontWeight: 800, color: '#1a1a1a', cursor: 'pointer', transition: 'all .18s', boxShadow: '0 2px 8px rgba(0,0,0,.06)', opacity: loading ? .6 : 1 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a1a1a'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,.1)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8e8e8'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.06)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? 'Opening Google...' : 'Continue with Google'}
            </button>

            <p style={{ textAlign: 'center', color: '#bbb', fontSize: '.78rem', marginTop: '1.2rem', fontWeight: 600 }}>
              New users will pick a username after signing in. No password needed.
            </p>
          </div>
        )}

        {step === 'username' && (
          <div>
            <div style={{ width: '52px', height: '52px', background: '#f5f5f5', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', marginBottom: '1.5rem' }}>👋</div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1a1a1a', marginBottom: '.5rem' }}>One last step!</h1>
            <p style={{ color: '#888', fontSize: '.9rem', marginBottom: '2rem', lineHeight: 1.7, fontWeight: 500 }}>
              Pick a username for your Cassette Manager account. You only do this once — it can't be changed later.
            </p>

            <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 800, color: '#555', marginBottom: '.5rem', letterSpacing: '.06em' }}>YOUR USERNAME</label>
            <input
              className="input-field"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUsername()}
              placeholder="e.g. name_6767"
              style={{ marginBottom: '1rem', fontSize: '1rem' }}
            />

            {error && (
              <div style={{ background: '#fff5f5', border: '1.5px solid #ffcccc', borderRadius: '14px', padding: '.8rem 1rem', marginBottom: '1rem', color: '#cc3333', fontSize: '.85rem', fontWeight: 700 }}>
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleUsername}
              disabled={loading}
              style={{ width: '100%', padding: '1rem', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '16px', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', opacity: loading ? .6 : 1, transition: 'all .18s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#333'}
              onMouseLeave={e => e.currentTarget.style.background = '#1a1a1a'}
            >
              {loading ? 'Setting up...' : "Let's go →"}
            </button>
          </div>
        )}
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, background: '#fafafa', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem 3rem', gap: '1rem' }}>
        <p style={{ fontSize: '.72rem', fontWeight: 900, letterSpacing: '.14em', color: '#999', marginBottom: '.5rem' }}>WHAT YOU GET</p>
        {[
          { icon: '📚', title: 'Subjects', desc: 'One place for every course. Notes, files, tasks and progress — all organised by subject.' },
          { icon: '📅', title: 'Event Calendar', desc: 'See all your deadlines in a calendar view. Automatic reminders 7 and 5 days before anything is due.' },
          { icon: '✅', title: 'To-Do Lists', desc: 'Create task folders per subject. A live progress bar tracks how close you are to done.' },
          { icon: '🎨', title: '10 Themes', desc: 'Pick a colour theme inspired by iconic characters. Change it anytime from settings.' },
        ].map((f, i) => (
          <div key={f.title} style={{ padding: '1.2rem 1.4rem', background: '#fff', border: '1.5px solid #efefef', borderRadius: '18px', display: 'flex', gap: '1rem', alignItems: 'flex-start', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
            <div style={{ width: '40px', height: '40px', background: '#f5f5f5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{f.icon}</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '.92rem', color: '#1a1a1a', marginBottom: '.15rem' }}>{f.title}</div>
              <div style={{ color: '#888', fontSize: '.82rem', lineHeight: 1.55, fontWeight: 500 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}