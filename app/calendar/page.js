'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Edit2, X, Calendar, BookOpen } from 'lucide-react'

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
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      setUserId(session.user.id)
      const { data: prof } = await supabase.from('profiles').select('theme').eq('id', session.user.id).maybeSingle()
      document.documentElement.setAttribute('data-theme', prof?.theme || 'solar-dark')
      const { data: evts } = await supabase.from('events').select('*').eq('user_id', session.user.id)
      const { data: subs } = await supabase.from('subjects').select('*').eq('user_id', session.user.id)
      setEvents(evts || [])
      setSubjects(subs || [])
      setLoading(false)
    }
    load()
  }, [])

  const openForm = (evt = null) => {
    if (evt) { setEditEvent(evt); setTitle(evt.title); setStartDate(evt.start_date); setDeadline(evt.deadline || ''); setSubjectId(evt.subject_id || '') }
    else { setEditEvent(null); setTitle(''); setStartDate(''); setDeadline(''); setSubjectId('') }
    setShowForm(true)
  }

  const saveEvent = async () => {
    if (!title.trim() || !startDate) return
    const payload = { title, start_date: startDate, deadline: deadline || null, subject_id: subjectId || null, user_id: userId }
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

  const today = new Date()
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })

  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.start_date === dateStr || e.deadline === dateStr)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg,#0a0a0a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="loading-pulse" style={{ width: '52px', height: '52px', background: 'var(--accent,#f0c040)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto .75rem' }}>
          <Calendar size={24} color="var(--accent-fg,#0a0a0a)" />
        </div>
        <p style={{ color: 'var(--muted,#555)', fontSize: '.88rem' }}>Loading calendar...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter,sans-serif', color: 'var(--text)' }}>
      <nav style={{ borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100, background: 'var(--nav-bg)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '.45rem', color: 'var(--muted)', fontWeight: 500, fontSize: '.86rem' }}>
            <ArrowLeft size={15} /> Dashboard
          </Link>
          <span style={{ fontWeight: 700, fontSize: '.95rem' }}>Event Calendar</span>
          <button onClick={() => openForm()} className="btn-primary" style={{ padding: '.48rem 1rem', fontSize: '.84rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
            <Plus size={15} /> New
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <div className="cal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem' }}>

          {/* Calendar */}
          <div className="card fade-up" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="btn-ghost" style={{ padding: '.4rem .7rem' }}>←</button>
              <span style={{ fontWeight: 700, fontSize: '.95rem' }}>{monthName}</span>
              <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="btn-ghost" style={{ padding: '.4rem .7rem' }}>→</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px', textAlign: 'center' }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} style={{ color: 'var(--muted)', fontSize: '.7rem', fontWeight: 600, padding: '.4rem 0' }}>{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dayEvents = getEventsForDay(day)
                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
                return (
                  <div key={day} style={{ padding: '.4rem .2rem', borderRadius: '9px', fontSize: '.82rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', background: isToday ? 'var(--accent)' : 'transparent', color: isToday ? 'var(--accent-fg)' : 'var(--text)', fontWeight: isToday ? 700 : 400 }}>
                    {day}
                    {dayEvents.length > 0 && <div style={{ width: '4px', height: '4px', borderRadius: '99px', background: isToday ? 'var(--accent-fg)' : 'var(--accent)' }} />}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Events list */}
          <div className="fade-up-2">
            <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: '1rem', color: 'var(--text2)' }}>All Events</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {events.length === 0 && <p style={{ color: 'var(--muted)', fontSize: '.84rem' }}>No events yet.</p>}
              {events.sort((a, b) => new Date(a.start_date) - new Date(b.start_date)).map(evt => {
                const daysLeft = evt.deadline ? Math.ceil((new Date(evt.deadline) - today) / 86400000) : null
                const linked = subjects.find(s => s.id === evt.subject_id)
                const urgent = daysLeft !== null && daysLeft <= 3
                return (
                  <div key={evt.id} className="card" style={{ padding: '1rem 1.1rem', borderColor: urgent ? 'rgba(239,68,68,.3)' : 'var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.35rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '.86rem', flex: 1, paddingRight: '.5rem' }}>{evt.title}</div>
                      <div style={{ display: 'flex', gap: '.25rem', flexShrink: 0 }}>
                        <button onClick={() => openForm(evt)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: '.2rem' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
                        ><Edit2 size={13} /></button>
                        <button onClick={() => deleteEvent(evt.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: '.2rem' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
                        ><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '.72rem', color: 'var(--muted)' }}>Start: {evt.start_date}</span>
                      {evt.deadline && <span style={{ fontSize: '.72rem', padding: '.15rem .5rem', borderRadius: '6px', background: urgent ? 'rgba(239,68,68,.12)' : 'var(--accent-light)', color: urgent ? '#ef4444' : 'var(--accent)', fontWeight: 600 }}>
                        Due: {evt.deadline} {daysLeft === 0 ? '(Today)' : daysLeft !== null ? `(${daysLeft}d)` : ''}
                      </span>}
                      {linked && <span style={{ fontSize: '.72rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '.25rem' }}><BookOpen size={11} />{linked.name}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
          <div className="pop-in" style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '22px', padding: '2rem', width: '100%', maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{editEvent ? 'Edit Event' : 'New Event'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.9rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.4rem', letterSpacing: '.07em' }}>TITLE *</label>
                <input className="input-field" value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.4rem', letterSpacing: '.07em' }}>START DATE *</label>
                <input className="input-field" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.4rem', letterSpacing: '.07em' }}>DEADLINE (optional)</label>
                <input className="input-field" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.4rem', letterSpacing: '.07em' }}>LINK SUBJECT (optional)</label>
                <select className="input-field" value={subjectId} onChange={e => setSubjectId(e.target.value)}>
                  <option value="">None</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '.6rem', marginTop: '.25rem' }}>
                <button className="btn-primary" onClick={saveEvent} style={{ flex: 1, padding: '.78rem' }}>Save</button>
                <button onClick={() => setShowForm(false)} className="btn-ghost" style={{ flex: 1, padding: '.78rem', justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .cal-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}