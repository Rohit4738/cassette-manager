'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import '@/app/globals.css'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)
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

  const logout = async () => { await supabase.auth.signOut(); router.push('/login') }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)' }}>
      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📼</span>
        <p style={{ color: 'var(--muted)' }}>Loading your workspace...</p>
      </div>
    </div>
  )

  const username = user?.email?.replace('@cassette.local', '')
  const today = new Date()
  const hour = today.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const deadlines = events.filter(e => e.deadline).map(e => ({ ...e, daysLeft: Math.ceil((new Date(e.deadline) - today) / 86400000) })).filter(e => e.daysLeft >= 0).sort((a, b) => a.daysLeft - b.daysLeft)

  const subjectColors = ['#f5c842', '#5ab97a', '#5a8fe0', '#e05a4e', '#c77dff', '#ff9f43']

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)', color: 'var(--text)' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2.5rem', borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.3rem' }}>📼</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>Cassette Manager</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {[['📚', 'Subjects', '/subjects'], ['📅', 'Calendar', '/calendar'], ['⚙️', 'Settings', '/settings']].map(([icon, label, href]) => (
            <Link key={href} href={href} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem' }}>
              <span>{icon}</span><span style={{ fontSize: '0.85rem' }}>{label}</span>
            </Link>
          ))}
          <button onClick={logout} className="btn-ghost" style={{ marginLeft: '0.5rem' }}>Sign out</button>
        </div>
      </nav>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 2rem' }}>

        {/* Hero greeting */}
        <div className="fade-up" style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2.6rem', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            {greeting}, <span style={{ color: 'var(--accent)' }}>{username}</span> 👋
          </h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.4rem', fontSize: '0.95rem' }}>
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Stats */}
        <div className="fade-up-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
          {[
            { label: 'Subjects', value: subjects.length, icon: '📚', color: '#f5c842', link: '/subjects' },
            { label: 'Events', value: events.length, icon: '📅', color: '#5a8fe0', link: '/calendar' },
            { label: 'Due soon', value: deadlines.filter(d => d.daysLeft <= 7).length, icon: '⏰', color: '#e05a4e', link: '/calendar' },
          ].map(s => (
            <Link key={s.label} href={s.link} className="card-hover" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'block', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '5rem', opacity: 0.06 }}>{s.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, color: s.color, marginBottom: '0.25rem' }}>{s.value}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 600 }}>{s.label}</div>
            </Link>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem' }}>

          {/* Subjects */}
          <div className="fade-up-3">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem' }}>📚 Your Subjects</h2>
              <Link href="/subjects/new" className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.82rem' }}>+ New</Link>
            </div>
            {subjects.length === 0 ? (
              <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '3rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>No subjects yet!</p>
                <Link href="/subjects/new" className="btn-primary">Create first subject</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {subjects.slice(0, 6).map((sub, i) => {
                  const pct = sub.total === 0 ? 0 : Math.round((sub.done / sub.total) * 100)
                  const color = subjectColors[i % subjectColors.length]
                  return (
                    <Link key={sub.id} href={`/subjects/${sub.id}`} className="card-hover" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.1rem 1.3rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '4px', height: '40px', background: color, borderRadius: '2px', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.4rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.name}</div>
                        <div style={{ background: 'var(--border)', borderRadius: '999px', height: '4px' }}>
                          <div style={{ background: color, width: `${pct}%`, height: '4px', borderRadius: '999px', transition: 'width 0.5s' }} />
                        </div>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--muted)', flexShrink: 0 }}>{pct}%</div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Deadlines */}
          <div className="fade-up-4">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem' }}>⏰ Deadlines</h2>
              <Link href="/calendar" className="btn-ghost" style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}>View all</Link>
            </div>
            {deadlines.length === 0 ? (
              <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center' }}>
                <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎉</p>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>No upcoming deadlines!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {deadlines.slice(0, 6).map(evt => {
                  const urgent = evt.daysLeft <= 3
                  const soon = evt.daysLeft <= 7
                  return (
                    <div key={evt.id} style={{ background: urgent ? 'rgba(224,90,78,0.08)' : 'var(--surface)', border: `1px solid ${urgent ? 'rgba(224,90,78,0.3)' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', padding: '1rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{evt.title}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>{evt.deadline}</div>
                      </div>
                      <div style={{ marginLeft: '0.75rem', flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: urgent ? 'var(--red)' : soon ? '#ff9f43' : 'var(--muted)', background: urgent ? 'rgba(224,90,78,0.15)' : 'var(--surface2)', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                        {evt.daysLeft === 0 ? 'TODAY' : `${evt.daysLeft}d`}
                      </div>
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