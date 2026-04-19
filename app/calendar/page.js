'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CalendarPage() {
  const router = useRouter()
  const [events, setEvents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editEvent, setEditEvent] = useState(null)
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [deadline, setDeadline] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const { data: evts } = await supabase.from('events').select('*').eq('user_id', session.user.id)
      const { data: subs } = await supabase.from('subjects').select('*').eq('user_id', session.user.id)
      setEvents(evts || [])
      setSubjects(subs || [])
      setLoading(false)

      // Check deadline notifications
      const today = new Date()
      ;(evts || []).forEach(evt => {
        if (!evt.deadline) return
        const daysLeft = Math.ceil((new Date(evt.deadline) - today) / (1000 * 60 * 60 * 24))
        if (daysLeft === 7 || daysLeft === 5) {
          if (Notification.permission === 'granted') {
            new Notification(`⏰ "${evt.title}" deadline in ${daysLeft} days!`)
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(p => {
              if (p === 'granted') new Notification(`⏰ "${evt.title}" deadline in ${daysLeft} days!`)
            })
          }
        }
      })
    }
    load()
  }, [])

  const openForm = (evt = null) => {
    if (evt) {
      setEditEvent(evt)
      setTitle(evt.title)
      setStartDate(evt.start_date)
      setDeadline(evt.deadline || '')
      setSubjectId(evt.subject_id || '')
    } else {
      setEditEvent(null)
      setTitle('')
      setStartDate('')
      setDeadline('')
      setSubjectId('')
    }
    setShowForm(true)
  }

  const saveEvent = async () => {
    if (!title.trim() || !startDate) return
    const { data: { session } } = await supabase.auth.getSession()
    const payload = { title, start_date: startDate, deadline: deadline || null, subject_id: subjectId || null, user_id: session.user.id }
    if (editEvent) {
      const { data } = await supabase.from('events').update(payload).eq('id', editEvent.id).select().single()
      setEvents(events.map(e => e.id === editEvent.id ? data : e))
    } else {
      const { data } = await supabase.from('events').insert(payload).select().single()
      setEvents([...events, data])
    }
    setShowForm(false)
  }

  const deleteEvent = async (id) => {
    await supabase.from('events').delete().eq('id', id)
    setEvents(events.filter(e => e.id !== id))
  }

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth }
  }

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth)
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })

  const getEventsForDay = (day) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.start_date === dateStr || e.deadline === dateStr)
  }

  if (loading) return <div style={loadingStyle}>Loading...</div>

  const today = new Date()
  const upcomingDeadlines = events.filter(e => e.deadline && new Date(e.deadline) >= today).sort((a, b) => new Date(a.deadline) - new Date(b.deadline))

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/dashboard" style={backBtn}>← Back</Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>📅 Calendar</h1>
        </div>
        <button onClick={() => openForm()} style={addBtn}>+ New Event</button>
      </div>

      <div style={contentStyle}>
        {/* Calendar Grid */}
        <div style={calendarCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} style={navBtn}>←</button>
            <h2 style={{ fontWeight: 'bold' }}>{monthName}</h2>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} style={navBtn}>→</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} style={{ color: '#666', fontSize: '0.8rem', padding: '0.5rem 0' }}>{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dayEvents = getEventsForDay(day)
              const isToday = day === today.getDate() && currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear()
              return (
                <div key={day} style={{ ...dayCell, ...(isToday ? todayCell : {}), ...(dayEvents.length > 0 ? hasEventCell : {}) }}>
                  <span>{day}</span>
                  {dayEvents.length > 0 && <div style={eventDot} />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <h2 style={sectionTitle}>All Events</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {events.length === 0 && <p style={{ color: '#555' }}>No events yet.</p>}
          {events.sort((a, b) => new Date(a.start_date) - new Date(b.start_date)).map(evt => {
            const daysLeft = evt.deadline ? Math.ceil((new Date(evt.deadline) - today) / (1000 * 60 * 60 * 24)) : null
            const linkedSubject = subjects.find(s => s.id === evt.subject_id)
            return (
              <div key={evt.id} style={eventCard}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>{evt.title}</div>
                  <div style={{ color: '#888', fontSize: '0.85rem' }}>Start: {evt.start_date}</div>
                  {evt.deadline && <div style={{ color: daysLeft <= 5 ? '#ff6b6b' : '#4ecdc4', fontSize: '0.85rem' }}>Deadline: {evt.deadline} ({daysLeft}d left)</div>}
                  {linkedSubject && <div style={{ color: '#7c6fcd', fontSize: '0.85rem' }}>📚 {linkedSubject.name}</div>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => openForm(evt)} style={editBtn}>✏️</button>
                  <button onClick={() => deleteEvent(evt.id)} style={editBtn}>🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div style={overlay}>
          <div style={modal}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editEvent ? 'Edit Event' : 'New Event'}</h2>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title *" style={inputStyle} />
            <label style={labelStyle}>Start Date *</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
            <label style={labelStyle}>Deadline (optional)</label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={inputStyle} />
            <label style={labelStyle}>Link Subject (optional)</label>
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)} style={inputStyle}>
              <option value="">None</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button onClick={saveEvent} style={btnStyle}>Save</button>
              <button onClick={() => setShowForm(false)} style={cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const pageStyle = { minHeight: '100vh', background: '#0f0f0f', color: 'white', fontFamily: 'sans-serif' }
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', borderBottom: '1px solid #222', position: 'sticky', top: 0, background: '#0f0f0f', zIndex: 10 }
const contentStyle = { padding: '2rem', maxWidth: '900px', margin: '0 auto' }
const backBtn = { color: '#888', textDecoration: 'none' }
const addBtn = { background: '#7c6fcd', color: 'white', padding: '0.5rem 1.2rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }
const calendarCard = { background: '#1a1a1a', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem', border: '1px solid #2a2a2a' }
const navBtn = { background: '#2a2a2a', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' }
const dayCell = { padding: '0.5rem', borderRadius: '8px', fontSize: '0.9rem', cursor: 'default', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }
const todayCell = { background: '#7c6fcd', color: 'white', fontWeight: 'bold' }
const hasEventCell = { background: '#1f1a2e' }
const eventDot = { width: '5px', height: '5px', borderRadius: '50%', background: '#4ecdc4', marginTop: '2px' }
const eventCard = { background: '#1a1a1a', borderRadius: '12px', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', border: '1px solid #2a2a2a' }
const sectionTitle = { fontSize: '1.1rem', fontWeight: 'bold', color: '#ccc', marginBottom: '1rem', marginTop: '1rem' }
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }
const modal = { background: '#1a1a1a', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }
const inputStyle = { padding: '0.65rem 1rem', background: '#2a2a2a', border: '1px solid #333', borderRadius: '8px', color: 'white', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' }
const labelStyle = { color: '#888', fontSize: '0.85rem' }
const btnStyle = { flex: 1, padding: '0.75rem', background: '#7c6fcd', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }
const cancelBtn = { flex: 1, padding: '0.75rem', background: '#2a2a2a', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }
const editBtn = { background: '#2a2a2a', border: 'none', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: 'pointer' }
const loadingStyle = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f0f', color: 'white', fontFamily: 'sans-serif' }