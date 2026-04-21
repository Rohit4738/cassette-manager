'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { BookOpen } from 'lucide-react'

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
        if (profile?.username) { router.replace('/dashboard'); return }
        else { setStep('username') }
      }
      setChecking(false)
    }
    check()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        if (profile?.username) { router.replace('/dashboard') }
        else { setChecking(false); setStep('username') }
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
      email: session.user.email, theme: 'solar-dark'
    })
    if (error) { setError(error.message); setLoading(false); return }
    await supabase.auth.updateUser({ data: { username: username.toLowerCase() } })
    router.replace('/dashboard')
  }

  if (checking) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="loading-pulse" style={{ width: '52px', height: '52px', background: '#f0c040', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <BookOpen size={24} color="#0a0a0a" />
        </div>
        <p style={{ color: '#555', fontSize: '.88rem' }}>Loading...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: 'Inter,sans-serif' }}>
      {step === 'google' && (
        <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'row' }}>
          {/* Left panel */}
          <div style={{ flex: '0 0 420px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem 3rem', borderRight: '1px solid #1e1e1e' }}
            className="mobile-login-left">
            <div className="fade-up">
              <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem', marginBottom: '2.5rem' }}>
                <div style={{ width: '36px', height: '36px', background: '#f0c040', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BookOpen size={18} color="#0a0a0a" />
                </div>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#f5f5f5' }}>Cassette Manager</span>
              </div>
              <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f5f5f5', lineHeight: 1.15, letterSpacing: '-.03em', marginBottom: '.65rem' }}>
                Your studies,<br />under control.
              </h1>
              <p style={{ color: '#555', fontSize: '.9rem', marginBottom: '2rem', lineHeight: 1.7 }}>
                Subjects, tasks, deadlines and notes — all in one place.
              </p>
              {error && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: '10px', padding: '.75rem 1rem', marginBottom: '1rem', color: '#ef4444', fontSize: '.84rem' }}>{error}</div>}
              <button onClick={handleGoogle} disabled={loading} style={{ width: '100%', padding: '.9rem 1.5rem', background: '#f5f5f5', border: 'none', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.85rem', fontSize: '.95rem', fontWeight: 700, color: '#0a0a0a', cursor: 'pointer', transition: 'opacity .18s, transform .15s', opacity: loading ? .6 : 1 }}
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
              <p style={{ textAlign: 'center', color: '#333', fontSize: '.76rem', marginTop: '.9rem' }}>New users choose a username after sign in.</p>
            </div>
          </div>
          {/* Right bento — hidden on mobile */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.85rem', padding: '3rem', alignContent: 'center' }} className="mobile-hide-bento">
            {[
              { title: 'Subjects', desc: 'Notes, files and tasks per course.', accent: false },
              { title: 'Event Calendar', desc: 'Deadlines and reminders.', accent: true },
              { title: 'To-Do Lists', desc: 'Folders, checkboxes, live progress.', accent: false },
              { title: '10 Themes', desc: 'Dark & light. Switch any time.', accent: false },
            ].map((f, i) => (
              <div key={f.title} className={`fade-up-${i + 2}`} style={{ background: f.accent ? '#f0c040' : '#141414', border: `1px solid ${f.accent ? 'transparent' : '#222'}`, borderRadius: '20px', padding: '1.6rem' }}>
                <div style={{ fontWeight: 700, fontSize: '.95rem', color: f.accent ? '#0a0a0a' : '#f5f5f5', marginBottom: '.35rem' }}>{f.title}</div>
                <div style={{ color: f.accent ? 'rgba(0,0,0,.55)' : '#555', fontSize: '.82rem', lineHeight: 1.55 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'username' && (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="pop-in" style={{ width: '100%', maxWidth: '400px', background: '#141414', border: '1px solid #222', borderRadius: '24px', padding: '2.5rem 2rem' }}>
            <div className="loading-pulse" style={{ width: '44px', height: '44px', background: '#f0c040', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <BookOpen size={20} color="#0a0a0a" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f5f5f5', letterSpacing: '-.02em', marginBottom: '.4rem' }}>One last step</h2>
            <p style={{ color: '#555', fontSize: '.88rem', marginBottom: '1.8rem', lineHeight: 1.6 }}>Pick a username. You only do this once.</p>
            <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#555', marginBottom: '.45rem', letterSpacing: '.08em' }}>USERNAME</label>
            <input className="input-field" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUsername()} placeholder="e.g. alex_smith" style={{ marginBottom: '1rem' }} />
            {error && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: '10px', padding: '.7rem 1rem', marginBottom: '1rem', color: '#ef4444', fontSize: '.84rem' }}>{error}</div>}
            <button className="btn-primary" onClick={handleUsername} disabled={loading} style={{ width: '100%', padding: '.85rem', fontSize: '.95rem' }}>
              {loading ? 'Setting up...' : 'Get Started'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .mobile-login-left {
            flex: 1 !important;
            border-right: none !important;
            padding: 2.5rem 1.5rem !important;
          }
          .mobile-hide-bento {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}