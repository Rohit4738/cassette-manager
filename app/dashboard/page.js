'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Calendar, Plus, LogOut, Settings, User, ChevronDown, Palette, ArrowRight } from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
      if (!prof?.username) { router.replace('/login'); return }
      document.documentElement.setAttribute('data-theme', prof.theme || 'solar')
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
    const handleClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const logout = async () => { await supabase.auth.signOut(); router.replace('/login') }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '44px', height: '44px', background: 'var(--accent, #f0c040)', borderRadius: '13px', margin: '0 auto .75rem' }} />
        <p style={{ color: '#444', fontSize: '.9rem' }}>Loading...</p>
      </div>
    </div>
  )

  const today = new Date()
  const hour = today.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const deadlines = events.filter(e => e.deadline)
    .map(e => ({ ...e, daysLeft: Math.ceil((new Date(e.deadline) - today) / 86400000) }))
    .filter(e => e.daysLeft >= 0).sort((a, b) => a.daysLeft - b.daysLeft)

  const subjectColors = ['#f0c040','#4a7feb','#e84393','#43a047','#e53935','#9c27b0','#1e88e5','#f44336','#c8a86b','#e8d44d']

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter, sans-serif', color: 'var(--text)' }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,10,10,.85)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '58px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <div style={{ width: '30px', height: '30px', background: 'var(--accent)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={15} color="var(--accent-fg)" />
              </div>
              <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-.01em' }}>Cassette Manager</span>
            </div>
            <div style={{ display: 'flex', gap: '.25rem' }} className="hide-mobile">
              <Link href="/subjects" className="pill-nav"><BookOpen size={14} /> Subjects</Link>
              <Link href="/calendar" className="pill-nav"><Calendar size={14} /> Event Calendar</Link>
            </div>
          </div>

          <div ref={menuRef} style={{ position: 'relative' }}>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '10px', padding: '.4rem .5rem .4rem .4rem', cursor: 'pointer' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--accent-fg)', fontSize: '.8rem' }}>
                {profile?.username?.[0]?.toUpperCase()}
              </div>
              <span style={{ fontWeight: 600, fontSize: '.83rem', color: 'var(--text2)' }} className="hide-mobile">{profile?.username}</span>
              <ChevronDown size={13} color="var(--muted)" />
            </button>

            {menuOpen && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '18px', padding: '.5rem', minWidth: '210px', boxShadow: '0 16px 48px rgba(0,0,0,.6)', zIndex: 200 }}>
                <div style={{ padding: '.7rem .9rem', borderBottom: '1px solid var(--border)', marginBottom: '.4rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '.88rem' }}>{profile?.username}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '.75rem', marginTop: '.1rem' }}>{profile?.email}</div>
                </div>
                {[
                  { icon: <User size={14} />, label: 'Profile', href: '/profile' },
                  { icon: <Palette size={14} />, label: 'Change Theme', href: '/settings' },
                  { icon: <Settings size={14} />, label: 'Settings', href: '/settings' },
                ].map(item => (
                  <Link key={item.label} href={item.href} onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '.7rem', padding: '.6rem .9rem', borderRadius: '10px', color: 'var(--text2)', fontWeight: 500, fontSize: '.85rem', transition: 'background .12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ color: 'var(--muted)' }}>{item.icon}</span>{item.label}
                  </Link>
                ))}
                <div style={{ borderTop: '1px solid var(--border)', marginTop: '.4rem', paddingTop: '.4rem' }}>
                  <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '.7rem', padding: '.6rem .9rem', borderRadius: '10px', color: '#ef4444', fontWeight: 500, fontSize: '.85rem', background: 'transparent', border: 'none', width: '100%', cursor: 'pointer', transition: 'background .12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* Greeting */}
        <div className="fade-up" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.2 }}>
            {greeting}, <span style={{ color: 'var(--accent)' }}>{profile?.username}</span>
          </h1>
          <p style={{ color: 'var(--muted)', marginTop: '.3rem', fontSize: '.88rem' }}>
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {deadlines.filter(d => d.daysLeft <= 7).length > 0 && (
              <span style={{ marginLeft: '.75rem', color: 'var(--accent)', fontWeight: 600 }}>
                · {deadlines.filter(d => d.daysLeft <= 7).length} deadline{deadlines.filter(d => d.daysLeft <= 7).length !== 1 ? 's' : ''} this week
              </span>
            )}
          </p>
        </div>

        {/* Bento grid */}
        <div className="fade-up-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'auto', gap: '1rem', marginBottom: '1rem' }}>

          {/* New Subject — accent card */}
          <Link href="/subjects/new" className="card-accent" style={{ gridColumn: 'span 1', padding: '1.6rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px' }}>
            <div style={{ width: '36px', height: '36px', background: 'rgba(0,0,0,.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={18} color="var(--accent-fg)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--accent-fg)', marginBottom: '.2rem' }}>New Subject</div>
              <div style={{ fontSize: '.78rem', color: 'rgba(0,0,0,.5)' }}>Add a course</div>
            </div>
          </Link>

          {/* Add Event */}
          <Link href="/calendar" className="card" style={{ gridColumn: 'span 1', padding: '1.6rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px' }}>
            <div style={{ width: '36px', height: '36px', background: 'var(--accent-light)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={18} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '.2rem' }}>Add Event</div>
              <div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>Set a deadline</div>
            </div>
          </Link>

          {/* Stats */}
          <div className="card" style={{ gridColumn: 'span 1', padding: '1.6rem', minHeight: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 600, fontSize: '.78rem', color: 'var(--muted)', letterSpacing: '.06em' }}>SUBJECTS</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '3rem', letterSpacing: '-.04em', color: 'var(--text)', lineHeight: 1 }}>{subjects.length}</div>
              <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: '.3rem' }}>active courses</div>
            </div>
          </div>

          {/* Deadlines count */}
          <div className="card" style={{ gridColumn: 'span 1', padding: '1.6rem', minHeight: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 600, fontSize: '.78rem', color: 'var(--muted)', letterSpacing: '.06em' }}>DUE SOON</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '3rem', letterSpacing: '-.04em', color: deadlines.filter(d => d.daysLeft <= 7).length > 0 ? 'var(--accent)' : 'var(--text)', lineHeight: 1 }}>
                {deadlines.filter(d => d.daysLeft <= 7).length}
              </div>
              <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: '.3rem' }}>this week</div>
            </div>
          </div>
        </div>

        {/* Second row */}
        <div className="fade-up-3" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>

          {/* Subjects list */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <span style={{ fontWeight: 700, fontSize: '.9rem' }}>Subjects</span>
              <Link href="/subjects" style={{ display: 'flex', alignItems: 'center', gap: '.3rem', color: 'var(--accent)', fontWeight: 600, fontSize: '.8rem' }}>
                View all <ArrowRight size={13} />
              </Link>
            </div>
            {subjects.length === 0 ? (
              <div style={{ border: '1px dashed var(--border2)', borderRadius: '16px', padding: '2.5rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--muted)', marginBottom: '1rem', fontSize: '.88rem' }}>No subjects yet</p>
                <Link href="/subjects/new" className="btn-primary" style={{ fontSize: '.82rem', padding: '.5rem 1.1rem' }}>Create one</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                {subjects.slice(0, 5).map((sub, i) => {
                  const pct = sub.total === 0 ? 0 : Math.round((sub.done / sub.total) * 100)
                  const color = subjectColors[i % subjectColors.length]
                  return (
                    <Link key={sub.id} href={`/subjects/${sub.id}`} style={{ display: 'flex', alignItems: 'center', gap: '.9rem', padding: '.8rem 1rem', background: 'var(--surface2)', borderRadius: '14px', border: '1px solid var(--border)', transition: 'border-color .15s, background .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--surface3)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface2)' }}
                    >
                      <div style={{ width: '5px', height: '38px', background: color, borderRadius: '99px', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '.88rem', marginBottom: '.35rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.name}</div>
                        <div className="progress-track" style={{ height: '4px' }}>
                          <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '.85rem', color }}>{pct}%</div>
                        <div style={{ fontSize: '.7rem', color: 'var(--muted)' }}>{sub.done}/{sub.total}</div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Deadlines */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <span style={{ fontWeight: 700, fontSize: '.9rem' }}>Deadlines</span>
              <Link href="/calendar" style={{ display: 'flex', alignItems: 'center', gap: '.3rem', color: 'var(--accent)', fontWeight: 600, fontSize: '.8rem' }}>
                All <ArrowRight size={13} />
              </Link>
            </div>
            {deadlines.length === 0 ? (
              <div style={{ border: '1px dashed var(--border2)', borderRadius: '14px', padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--muted)', fontSize: '.84rem' }}>No upcoming deadlines</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                {deadlines.slice(0, 5).map(evt => {
                  const urgent = evt.daysLeft <= 3
                  return (
                    <div key={evt.id} style={{ padding: '.75rem .9rem', background: 'var(--surface2)', borderRadius: '12px', border: `1px solid ${urgent ? 'rgba(239,68,68,.25)' : 'var(--border)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.5rem' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '.83rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{evt.title}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '.72rem', marginTop: '.1rem' }}>{evt.deadline}</div>
                      </div>
                      <span style={{ flexShrink: 0, padding: '.2rem .6rem', borderRadius: '7px', fontWeight: 700, fontSize: '.72rem', background: urgent ? 'rgba(239,68,68,.12)' : 'var(--accent-light)', color: urgent ? '#ef4444' : 'var(--accent)' }}>
                        {evt.daysLeft === 0 ? 'Today' : `${evt.daysLeft}d`}
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