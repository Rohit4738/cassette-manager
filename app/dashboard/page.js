'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      const meta = session.user.user_metadata
      if (!meta?.username) { router.replace('/login'); return }
      setUser({ ...session.user, username: meta.username })
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
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📼</div>
        <p style={{ color: 'var(--muted)' }}>Loading your workspace...</p>
      </div>
    </div>
  )

  const today = new Date()
  const hour = today.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const deadlines = events
    .filter(e => e.deadline)
    .map(e => ({ ...e, daysLeft: Math.ceil((new Date(e.deadline) - today) / 86400000) }))
    .filter(e => e.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft)

  const subjectAccents = [
    { color: '#2c3e6b', bg: '#e8ecf5' },
    { color: '#c85c3a', bg: '#f0e8e4' },
    { color: '#3a7d5c', bg: '#e4f0eb' },
    { color: '#7c5cbf', bg: '#f0ebfb' },
    { color: '#b8860b', bg: '#fdf6e0' },
    { color: '#c0392b', bg: '#fdecea' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)', color: 'var(--text)' }}>

      {/* Nav */}
      <nav style={{ background: 'var(--surface)', borderBottom: '1.5px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '30px', height: '30px', background: 'var(--accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>📼</div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontStyle: 'italic' }}>Cassette Manager</span>
            </div>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <Link href="/subjects" className="nav-link">📚 Subjects</Link>
              <Link href="/calendar" className="nav-link">📅 Event Calendar</Link>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)', cursor: 'pointer' }}
              title={user?.username}
            >
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <button onClick={logout} className="btn-ghost" style={{ fontSize: '0.82rem' }}>Sign out</button>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 2rem' }}>

        {/* Greeting */}
        <div className="fade-up" style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontStyle: 'italic', lineHeight: 1.2 }}>
            {greeting}, <span style={{ color: 'var(--accent)' }}>{user?.username}</span>.
          </h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.3rem' }}>
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {' · '}{subjects.length} subject{subjects.length !== 1 ? 's' : ''} · {deadlines.filter(d => d.daysLeft <= 7).length} upcoming deadline{deadlines.filter(d => d.daysLeft <= 7).length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Quick actions */}
        <div className="fade-up-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
          <Link href="/subjects/new" style={{ background: 'var(--navy)', color: 'white', borderRadius: 'var(--radius-lg)', padding: '1.4rem 1.6rem', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'opacity 0.18s, transform 0.18s', boxShadow: 'var(--shadow)' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.12)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>📚</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>New Subject</div>
              <div style={{ fontSize: '0.82rem', opacity: 0.7, marginTop: '0.1rem' }}>Add a course to track</div>
            </div>
          </Link>
          <Link href="/calendar" style={{ background: 'var(--accent)', color: 'white', borderRadius: 'var(--radius-lg)', padding: '1.4rem 1.6rem', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'opacity 0.18s, transform 0.18s', boxShadow: '0 4px 14px rgba(200,92,58,0.25)' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>📅</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>Add Event</div>
              <div style={{ fontSize: '0.82rem', opacity: 0.7, marginTop: '0.1rem' }}>Schedule or set a deadline</div>
            </div>
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem' }}>

          {/* Subjects */}
          <div className="fade-up-3">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.25rem' }}>Subjects</h2>
              <Link href="/subjects" style={{ fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 600 }}>View all →</Link>
            </div>
            {subjects.length === 0 ? (
              <div style={{ border: '2px dashed var(--border2)', borderRadius: 'var(--radius-lg)', padding: '3rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>No subjects yet</p>
                <Link href="/subjects/new" className="btn-primary">+ Create first subject</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {subjects.slice(0, 5).map((sub, i) => {
                  const pct = sub.total === 0 ? 0 : Math.round((sub.done / sub.total) * 100)
                  const accent = subjectAccents[i % subjectAccents.length]
                  return (
                    <Link key={sub.id} href={`/subjects/${sub.id}`} className="card" style={{ padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '5px', height: '44px', background: accent.color, borderRadius: '3px', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.name}</div>
                        <div className="progress-bar-track" style={{ height: '5px' }}>
                          <div className="progress-bar-fill" style={{ width: `${pct}%`, background: accent.color }} />
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: accent.color }}>{pct}%</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{sub.done}/{sub.total}</div>
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
              <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.25rem' }}>Deadlines</h2>
              <Link href="/calendar" style={{ fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 600 }}>Calendar →</Link>
            </div>
            {deadlines.length === 0 ? (
              <div style={{ border: '2px dashed var(--border2)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
                <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>No upcoming deadlines!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {deadlines.slice(0, 6).map(evt => {
                  const urgent = evt.daysLeft <= 3
                  const soon = evt.daysLeft <= 7
                  const badgeColor = urgent ? '#c85c3a' : soon ? '#b8860b' : '#3a7d5c'
                  const badgeBg = urgent ? '#fef2f0' : soon ? '#fdf6e0' : '#e4f0eb'
                  return (
                    <div key={evt.id} className="card" style={{ padding: '1rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: urgent ? '#f5c4bb' : 'var(--border)' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{evt.title}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.1rem' }}>{evt.deadline}</div>
                      </div>
                      <span className="badge" style={{ marginLeft: '0.75rem', background: badgeBg, color: badgeColor, flexShrink: 0 }}>
                        {evt.daysLeft === 0 ? 'TODAY' : `${evt.daysLeft}d`}
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