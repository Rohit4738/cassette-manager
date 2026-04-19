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
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      
      const { data: subs } = await supabase.from('subjects').select('*').eq('user_id', session.user.id)
      const { data: evts } = await supabase.from('events').select('*').eq('user_id', session.user.id)
      setSubjects(subs || [])
      setEvents(evts || [])
      setLoading(false)
    }
    getUser()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <div style={loadingStyle}>Loading...</div>

  const username = user?.email?.replace('@cassette.app', '')
  const today = new Date()
  const upcomingEvents = events.filter(e => e.deadline && new Date(e.deadline) >= today)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3)

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>📼 Cassette</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#888' }}>Hey, {username}!</span>
          <button onClick={logout} style={logoutBtn}>Logout</button>
        </div>
      </div>

      <div style={contentStyle}>
        {/* Quick Actions */}
        <h2 style={sectionTitle}>Quick Actions</h2>
        <div style={gridStyle}>
          <Link href="/subjects" style={actionCard('#7c6fcd')}>
            <div style={{ fontSize: '2rem' }}>📚</div>
            <div style={{ fontWeight: 'bold' }}>Subjects</div>
            <div style={{ color: '#ccc', fontSize: '0.85rem' }}>{subjects.length} subjects</div>
          </Link>
          <Link href="/calendar" style={actionCard('#4ecdc4')}>
            <div style={{ fontSize: '2rem' }}>📅</div>
            <div style={{ fontWeight: 'bold' }}>Calendar</div>
            <div style={{ color: '#ccc', fontSize: '0.85rem' }}>{events.length} events</div>
          </Link>
          <Link href="/subjects/new" style={actionCard('#ff6b6b')}>
            <div style={{ fontSize: '2rem' }}>➕</div>
            <div style={{ fontWeight: 'bold' }}>Add Subject</div>
            <div style={{ color: '#ccc', fontSize: '0.85rem' }}>Create new</div>
          </Link>
          <Link href="/settings" style={actionCard('#f7dc6f')}>
            <div style={{ fontSize: '2rem' }}>⚙️</div>
            <div style={{ fontWeight: 'bold', color: '#333' }}>Settings</div>
            <div style={{ color: '#555', fontSize: '0.85rem' }}>Themes & more</div>
          </Link>
        </div>

        {/* Subjects Overview */}
        <h2 style={sectionTitle}>Your Subjects</h2>
        {subjects.length === 0 ? (
          <div style={emptyCard}>
            No subjects yet. <Link href="/subjects/new" style={{ color: '#7c6fcd' }}>Create one!</Link>
          </div>
        ) : (
          <div style={gridStyle}>
            {subjects.map(sub => (
              <Link key={sub.id} href={`/subjects/${sub.id}`} style={subjectCard}>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{sub.name}</div>
                <div style={{ color: '#888', fontSize: '0.85rem' }}>Prof. {sub.professor || 'N/A'}</div>
              </Link>
            ))}
          </div>
        )}

        {/* Upcoming Deadlines */}
        <h2 style={sectionTitle}>Upcoming Deadlines</h2>
        {upcomingEvents.length === 0 ? (
          <div style={emptyCard}>No upcoming deadlines 🎉</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {upcomingEvents.map(evt => {
              const daysLeft = Math.ceil((new Date(evt.deadline) - today) / (1000 * 60 * 60 * 24))
              return (
                <div key={evt.id} style={deadlineCard}>
                  <div style={{ fontWeight: 'bold' }}>{evt.title}</div>
                  <div style={{ color: daysLeft <= 5 ? '#ff6b6b' : '#4ecdc4', fontSize: '0.85rem' }}>
                    {daysLeft} days left
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const pageStyle = { minHeight: '100vh', background: '#0f0f0f', color: 'white', fontFamily: 'sans-serif' }
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', borderBottom: '1px solid #222', position: 'sticky', top: 0, background: '#0f0f0f', zIndex: 10 }
const contentStyle = { padding: '2rem', maxWidth: '1100px', margin: '0 auto' }
const sectionTitle = { fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', marginTop: '2rem', color: '#ccc' }
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }
const actionCard = (bg) => ({ background: bg, borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', textDecoration: 'none', color: 'white', cursor: 'pointer' })
const subjectCard = { background: '#1a1a1a', borderRadius: '12px', padding: '1.5rem', textDecoration: 'none', color: 'white', border: '1px solid #2a2a2a', display: 'block' }
const deadlineCard = { background: '#1a1a1a', borderRadius: '12px', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #2a2a2a' }
const emptyCard = { background: '#1a1a1a', borderRadius: '12px', padding: '1.5rem', color: '#888', textAlign: 'center' }
const logoutBtn = { background: 'transparent', border: '1px solid #444', color: '#888', padding: '0.4rem 1rem', borderRadius: '8px', cursor: 'pointer' }
const loadingStyle = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f0f', color: 'white', fontFamily: 'sans-serif' }