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

  if (loading) return <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', color: 'var(--muted)' }}>Loading...</div>

  const username = user?.email?.replace('@cassette.local', '')
  const today = new Date()
  const deadlines = events.filter(e => e.deadline).map(e => ({ ...e, daysLeft: Math.ceil((new Date(e.deadline) - today) / 86400000) })).filter(e => e.daysLeft >= 0).sort((a, b) => a.daysLeft - b.daysLeft)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)', color: 'var(--text)' }}>
      {/* Top nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 2.5rem', borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.2rem' }}>📼</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>Cassette</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link href="/subjects" style={{ color: 'var(--muted)', fontSize: '0.9rem', fontWeight: '500' }}>Subjects</Link>
          <Link href="/calendar" style={{ color: 'var(--muted)', fontSize: '0.9rem', fontWeight: '500' }}>Calendar</Link>
          <Link href="/settings" style={{ color: 'var(--muted)', fontSize: '0.9rem', fontWeight: '500' }}>Settings</Link>
          <button onClick={logout} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', padding: '0.4rem 0.9rem', borderRadius: 'var(--radius)', fontSize: '0.85rem' }}>Sign out</button>
        </div>
      </nav>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 2.5rem' }}>
        {/* Header */}
        <div className="fade-up" style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', lineHeight: 1.15, marginBottom: '0.5rem' }}>
            Good {today.getHours() < 12 ? 'morning' : today.getHours() < 17 ? 'afternoon' : 'evening'}, {username}.
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '1rem' }}>
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Stats row */}
        <div className="fade-up-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '3rem' }}>
          {[
            { label: 'Subjects', value: subjects.length, icon: '📚', link: '/subjects' },
            { label: 'Events', value: events.length, icon: '📅', link: '/calendar' },
            { label: 'Deadlines', value: deadlines.filter(d => d.daysLeft <= 7).length, icon: '⏰', link: '/calendar' },
          ].map(s => (
            <Link key={s.label} href={s.link} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'block', transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{s.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '0.2rem' }}>{s.value}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>{s.label}</div>
            </Link>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Subjects */}
          <div className="fade-up-3">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem' }}>Subjects</h2>
              <Link href="/subjects/new" style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', border: '1px solid var(--border)', padding: '0.3rem 0.8rem', borderRadius: 'var(--radius)' }}>+ New</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {subjects.length === 0 && <p style={{ color: 'var(--muted)', fontSize: '0.9rem', padding: '1.5rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>No subjects yet</p>}
              {subjects.slice(0, 5).map(sub => {
                const pct = sub.total === 0 ? 0 : Math.round((sub.done / sub.total) * 100)
                return (
                  <Link key={sub.id} href={`/subjects/${sub.id}`} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.2rem', display: 'block', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{sub.name}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--muted)' }}>{pct}%</span>
                    </div>
                    <div style={{ background: 'var(--border)', borderRadius: '999px', height: '3px' }}>
                      <div style={{ background: 'var(--text)', width: `${pct}%`, height: '3px', borderRadius: '999px', transition: 'width 0.5s' }} />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Deadlines */}
          <div className="fade-up-4">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem' }}>Upcoming Deadlines</h2>
              <Link href="/calendar" style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', border: '1px solid var(--border)', padding: '0.3rem 0.8rem', borderRadius: 'var(--radius)' }}>+ New</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {deadlines.length === 0 && <p style={{ color: 'var(--muted)', fontSize: '0.9rem', padding: '1.5rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>No upcoming deadlines 🎉</p>}
              {deadlines.slice(0, 5).map(evt => (
                <div key={evt.id} style={{ background: 'var(--surface)', border: `1px solid ${evt.daysLeft <= 3 ? '#f5c6c6' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', padding: '1rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.15rem' }}>{evt.title}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>{evt.deadline}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: evt.daysLeft <= 3 ? 'var(--danger)' : evt.daysLeft <= 7 ? '#e67e22' : 'var(--muted)', fontWeight: '600' }}>
                    {evt.daysLeft === 0 ? 'Today' : `${evt.daysLeft}d`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}