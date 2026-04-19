'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
      if (!prof?.username) { router.replace('/login'); return }
      document.documentElement.setAttribute('data-theme', prof.theme || 'springfield')
      setProfile(prof)
      const { data: subs } = await supabase.from('subjects').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
      const { data: evts } = await supabase.from('events').select('*').eq('user_id', session.user.id)
      const { data: todos } = await supabase.from('todos').select('*').eq('user_id', session.user.id)
      setSubjects((subs || []).map(s => ({
        ...s,
        total: (todos || []).filter(t => t.subject_id === s.id).length,
        done: (todos || []).filter(t => t.subject_id === s.id && t.completed).length
      })))
      setEvents(evts || [])
      setLoading(false)
    }
    load()
  }, [])

  const logout = async () => { await supabase.auth.signOut(); router.replace('/login') }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '.75rem' }}>📼</div>
        <p style={{ color: 'var(--muted)', fontWeight: 700 }}>Loading your workspace...</p>
      </div>
    </div>
  )

  const today = new Date()
  const hour = today.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const deadlines = events.filter(e => e.deadline)
    .map(e => ({ ...e, daysLeft: Math.ceil((new Date(e.deadline) - today) / 86400000) }))
    .filter(e => e.daysLeft >= 0).sort((a, b) => a.daysLeft - b.daysLeft)

  const accentColors = ['#e05a4e','#3b5bdb','#c2185b','#2e7d32','#b8860b','#6a0dad','#1565c0','#c62828','#7a6040','#2e7d32']

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Nunito, sans-serif', color: 'var(--text)' }}>

      {/* Nav */}
      <nav style={{ background: 'var(--surface)', borderBottom: '2px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <div style={{ width: '34px', height: '34px', background: 'var(--accent)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>📼</div>
              <span style={{ fontWeight: 900, fontSize: '1.05rem' }}>Cassette Manager</span>
            </div>
            <div style={{ display: 'flex', gap: '.2rem' }} className="hide-mobile">
              <Link href="/subjects" className="pill-nav">📚 Subjects</Link>
              <Link href="/calendar" className="pill-nav">📅 Event Calendar</Link>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <Link href="/settings" className="btn-ghost hide-mobile">🎨 Theme</Link>
            <div style={{ width: '34px', height: '34px', borderRadius: '99px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'var(--accent-fg)', fontSize: '.9rem', cursor: 'pointer' }}>
              {profile?.username?.[0]?.toUpperCase()}
            </div>
            <button onClick={logout} className="btn-ghost" style={{ fontSize: '.82rem' }}>Sign out</button>
          </div>
        </div>
        {/* Mobile nav */}
        <div style={{ display: 'none' }} className="mobile-nav">
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '.5rem', borderTop: '2px solid var(--border)' }}>
            <Link href="/subjects" className="pill-nav" style={{ fontSize: '.8rem' }}>📚 Subjects</Link>
            <Link href="/calendar" className="pill-nav" style={{ fontSize: '.8rem' }}>📅 Calendar</Link>
            <Link href="/settings" className="pill-nav" style={{ fontSize: '.8rem' }}>🎨 Theme</Link>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Greeting */}
        <div className="fade-up" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1.2 }} className="mobile-text-sm">
            {greeting}, <span style={{ color: 'var(--accent)' }}>{profile?.username}</span>! 👋
          </h1>
          <p style={{ color: 'var(--muted)', marginTop: '.3rem', fontWeight: 600 }}>
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {' · '}{subjects.length} subject{subjects.length !== 1 ? 's' : ''}
            {deadlines.filter(d => d.daysLeft <= 7).length > 0 && ` · ⚠️ ${deadlines.filter(d => d.daysLeft <= 7).length} deadline${deadlines.filter(d => d.daysLeft <= 7).length !== 1 ? 's' : ''} this week`}
          </p>
        </div>

        {/* Quick actions */}
        <div className="fade-up-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <Link href="/subjects/new" style={{ background: 'var(--accent)', color: 'var(--accent-fg)', borderRadius: '20px', padding: '1.3rem 1.5rem', display: 'flex', alignItems: 'center', gap: '.9rem', fontWeight: 800, boxShadow: '0 4px 16px rgba(0,0,0,.12)', transition: 'transform .18s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span style={{ fontSize: '1.8rem' }}>📚</span>
            <div>
              <div style={{ fontSize: '.95rem' }}>New Subject</div>
              <div style={{ fontSize: '.78rem', opacity: .75, fontWeight: 600 }}>Add a course</div>
            </div>
          </Link>
          <Link href="/calendar" style={{ background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: '20px', padding: '1.3rem 1.5rem', display: 'flex', alignItems: 'center', gap: '.9rem', fontWeight: 800, boxShadow: 'var(--card-shadow)', transition: 'transform .18s, border-color .18s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <span style={{ fontSize: '1.8rem' }}>📅</span>
            <div>
              <div style={{ fontSize: '.95rem', color: 'var(--text)' }}>Add Event</div>
              <div style={{ fontSize: '.78rem', color: 'var(--muted)', fontWeight: 600 }}>Set a deadline</div>
            </div>
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem' }} className="mobile-stack">

          {/* Subjects */}
          <div className="fade-up-3">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontWeight: 900, fontSize: '1.1rem' }}>Your Subjects</h2>
              <Link href="/subjects" style={{ color: 'var(--accent)', fontWeight: 800, fontSize: '.85rem' }}>View all →</Link>
            </div>
            {subjects.length === 0 ? (
              <div style={{ border: '2.5px dashed var(--border2)', borderRadius: '20px', padding: '3rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>📚</div>
                <p style={{ color: 'var(--muted)', marginBottom: '1.2rem', fontWeight: 600 }}>No subjects yet! Add your first course to get started.</p>
                <Link href="/subjects/new" className="btn-primary">+ Create Subject</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                {subjects.slice(0, 5).map((sub, i) => {
                  const pct = sub.total === 0 ? 0 : Math.round((sub.done / sub.total) * 100)
                  const color = accentColors[i % accentColors.length]
                  return (
                    <Link key={sub.id} href={`/subjects/${sub.id}`} className="card" style={{ padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '6px', height: '48px', background: color, borderRadius: '99px', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '.92rem', marginBottom: '.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.name}</div>
                        <div className="progress-track" style={{ height: '6px' }}>
                          <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        <div style={{ fontWeight: 900, fontSize: '.92rem', color }}>{pct}%</div>
                        <div style={{ fontSize: '.72rem', color: 'var(--muted)', fontWeight: 600 }}>{sub.done}/{sub.total} done</div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Deadlines */}
          <div className="fade-up-4">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontWeight: 900, fontSize: '1.1rem' }}>Deadlines</h2>
              <Link href="/calendar" style={{ color: 'var(--accent)', fontWeight: 800, fontSize: '.85rem' }}>Calendar →</Link>
            </div>
            {deadlines.length === 0 ? (
              <div style={{ border: '2.5px dashed var(--border2)', borderRadius: '20px', padding: '2.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>🎉</div>
                <p style={{ color: 'var(--muted)', fontSize: '.88rem', fontWeight: 600 }}>No upcoming deadlines!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                {deadlines.slice(0, 6).map(evt => {
                  const urgent = evt.daysLeft <= 3
                  const soon = evt.daysLeft <= 7
                  return (
                    <div key={evt.id} className="card" style={{ padding: '.9rem 1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: urgent ? '#ffbbb5' : 'var(--border)' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{evt.title}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '.75rem', fontWeight: 600, marginTop: '.1rem' }}>{evt.deadline}</div>
                      </div>
                      <span style={{ marginLeft: '.75rem', flexShrink: 0, padding: '.25rem .75rem', borderRadius: '99px', fontWeight: 800, fontSize: '.78rem', background: urgent ? '#fdecea' : soon ? '#fdf6e0' : 'var(--accent-light)', color: urgent ? '#c0392b' : soon ? '#b8860b' : 'var(--text2)' }}>
                        {evt.daysLeft === 0 ? '🔥 TODAY' : `${evt.daysLeft}d left`}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}