'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Calendar, Plus, LogOut, ChevronDown, ArrowRight, Sun, Moon, Menu, X } from 'lucide-react'

const THEMES = [
  { id: 'solar',    label: 'Solar',    dark: 'solar-dark',    light: 'solar-light',    hex: '#f0c040' },
  { id: 'crimson',  label: 'Crimson',  dark: 'crimson-dark',  light: 'crimson-light',  hex: '#e53935' },
  { id: 'cobalt',   label: 'Cobalt',   dark: 'cobalt-dark',   light: 'cobalt-light',   hex: '#4a7feb' },
  { id: 'bloom',    label: 'Bloom',    dark: 'bloom-dark',    light: 'bloom-light',    hex: '#e84393' },
  { id: 'terrain',  label: 'Terrain',  dark: 'terrain-dark',  light: 'terrain-light',  hex: '#c8a86b' },
  { id: 'sapphire', label: 'Sapphire', dark: 'sapphire-dark', light: 'sapphire-light', hex: '#1e88e5' },
  { id: 'obsidian', label: 'Obsidian', dark: 'obsidian-dark', light: 'obsidian-light', hex: '#e8d44d' },
  { id: 'scarlet',  label: 'Scarlet',  dark: 'scarlet-dark',  light: 'scarlet-light',  hex: '#f44336' },
  { id: 'violet',   label: 'Violet',   dark: 'violet-dark',   light: 'violet-light',   hex: '#9c27b0' },
  { id: 'forest',   label: 'Forest',   dark: 'forest-dark',   light: 'forest-light',   hex: '#43a047' },
]

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const menuRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
      if (!prof?.username) { router.replace('/login'); return }
      const theme = prof.theme || 'solar-dark'
      document.documentElement.setAttribute('data-theme', theme)
      setIsDark(theme.endsWith('-dark'))
      setProfile(prof)
      const { data: subs } = await supabase.from('subjects').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
      const { data: evts } = await supabase.from('events').select('*').eq('user_id', session.user.id)
      const { data: todos } = await supabase.from('todos').select('*').eq('user_id', session.user.id)
      setSubjects((subs || []).map(s => ({ ...s, total: (todos || []).filter(t => t.subject_id === s.id).length, done: (todos || []).filter(t => t.subject_id === s.id && t.completed).length })))
      setEvents(evts || [])
      setLoading(false)
    }
    load()
    const handleClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const applyTheme = async (themeId, dark) => {
    const full = dark ? `${themeId}-dark` : `${themeId}-light`
    document.documentElement.setAttribute('data-theme', full)
    setIsDark(dark)
    await supabase.from('profiles').update({ theme: full }).eq('id', profile.id)
    setProfile(p => ({ ...p, theme: full }))
  }

  const toggleMode = () => {
    const base = (profile?.theme || 'solar-dark').replace('-dark', '').replace('-light', '')
    applyTheme(base, !isDark)
  }

  const logout = async () => { await supabase.auth.signOut(); router.replace('/login') }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg,#0a0a0a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="loading-pulse" style={{ width: '52px', height: '52px', background: 'var(--accent,#f0c040)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto .75rem' }}>
          <BookOpen size={24} color="var(--accent-fg,#0a0a0a)" />
        </div>
        <p style={{ color: 'var(--muted,#555)', fontSize: '.88rem' }}>Loading your workspace...</p>
      </div>
    </div>
  )

  const today = new Date()
  const hour = today.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const deadlines = events.filter(e => e.deadline)
    .map(e => ({ ...e, daysLeft: Math.ceil((new Date(e.deadline) - today) / 86400000) }))
    .filter(e => e.daysLeft >= 0).sort((a, b) => a.daysLeft - b.daysLeft)
  const subjectColors = ['#f0c040', '#4a7feb', '#e84393', '#43a047', '#e53935', '#9c27b0', '#1e88e5', '#f44336', '#c8a86b', '#e8d44d']
  const currentBase = (profile?.theme || 'solar-dark').replace('-dark', '').replace('-light', '')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter,sans-serif', color: 'var(--text)' }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100, background: 'var(--nav-bg)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>
          {/* Logo + desktop nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem' }}>
              <div style={{ width: '30px', height: '30px', background: 'var(--accent)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BookOpen size={15} color="var(--accent-fg)" />
              </div>
              <span style={{ fontWeight: 700, fontSize: '.95rem', letterSpacing: '-.01em' }} className="dash-title">Cassette Manager</span>
            </div>
            <div style={{ display: 'flex', gap: '.2rem' }} className="dash-nav-links">
              <Link href="/subjects" className="pill-nav"><BookOpen size={14} /> Subjects</Link>
              <Link href="/calendar" className="pill-nav"><Calendar size={14} /> Calendar</Link>
            </div>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
            <button onClick={toggleMode} className="btn-ghost" style={{ padding: '.45rem .55rem', borderRadius: '9px' }}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Mobile menu button */}
            <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className="btn-ghost dash-mobile-menu" style={{ padding: '.45rem .55rem', borderRadius: '9px' }}>
              {mobileNavOpen ? <X size={16} /> : <Menu size={16} />}
            </button>

            {/* Profile dropdown */}
            <div ref={menuRef} style={{ position: 'relative' }} className="dash-profile">
              <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'flex', alignItems: 'center', gap: '.45rem', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '10px', padding: '.38rem .45rem .38rem .4rem', cursor: 'pointer' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--accent-fg)', fontSize: '.8rem', flexShrink: 0 }}>
                  {profile?.username?.[0]?.toUpperCase()}
                </div>
                <span style={{ fontWeight: 600, fontSize: '.82rem', color: 'var(--text2)' }} className="dash-username">{profile?.username}</span>
                <ChevronDown size={13} color="var(--muted)" />
              </button>

              {menuOpen && (
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '18px', padding: '.5rem', minWidth: '240px', boxShadow: '0 16px 48px rgba(0,0,0,.25)', zIndex: 200 }}>
                  <div style={{ padding: '.65rem .9rem', borderBottom: '1px solid var(--border)', marginBottom: '.4rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '.88rem' }}>{profile?.username}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '.75rem', marginTop: '.1rem' }}>{profile?.email}</div>
                  </div>
                  <div style={{ padding: '.5rem .9rem' }}>
                    <div style={{ fontSize: '.72rem', fontWeight: 600, color: 'var(--muted)', letterSpacing: '.07em', marginBottom: '.5rem' }}>THEME</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '.35rem', marginBottom: '.6rem' }}>
                      {THEMES.map(t => (
                        <button key={t.id} onClick={() => applyTheme(t.id, isDark)} title={t.label} style={{ width: '32px', height: '32px', borderRadius: '8px', background: t.hex, border: `2px solid ${currentBase === t.id ? t.hex : 'transparent'}`, cursor: 'pointer', outline: currentBase === t.id ? `2px solid ${t.hex}` : 'none', outlineOffset: '2px', transition: 'transform .15s' }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        />
                      ))}
                    </div>
                    <button onClick={toggleMode} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', width: '100%', padding: '.5rem .6rem', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '9px', color: 'var(--text2)', fontWeight: 600, fontSize: '.8rem', cursor: 'pointer' }}>
                      {isDark ? <Sun size={14} /> : <Moon size={14} />}
                      Switch to {isDark ? 'Light' : 'Dark'} mode
                    </button>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', marginTop: '.4rem', paddingTop: '.4rem' }}>
                    <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '.7rem', padding: '.6rem .9rem', borderRadius: '10px', color: '#ef4444', fontWeight: 500, fontSize: '.85rem', background: 'transparent', border: 'none', width: '100%', cursor: 'pointer' }}
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
        </div>

        {/* Mobile nav drawer */}
        {mobileNavOpen && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '.75rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '.4rem', background: 'var(--nav-bg)' }} className="dash-mobile-drawer">
            <Link href="/subjects" onClick={() => setMobileNavOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.7rem .9rem', borderRadius: '10px', color: 'var(--text2)', fontWeight: 600, fontSize: '.9rem', background: 'var(--surface2)' }}>
              <BookOpen size={16} /> Subjects
            </Link>
            <Link href="/calendar" onClick={() => setMobileNavOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.7rem .9rem', borderRadius: '10px', color: 'var(--text2)', fontWeight: 600, fontSize: '.9rem', background: 'var(--surface2)' }}>
              <Calendar size={16} /> Event Calendar
            </Link>
            <button onClick={() => { logout(); setMobileNavOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.7rem .9rem', borderRadius: '10px', color: '#ef4444', fontWeight: 600, fontSize: '.9rem', background: 'var(--surface2)', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <LogOut size={16} /> Sign out
            </button>
          </div>
        )}
      </nav>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.75rem 1.25rem' }}>

        {/* Greeting */}
        <div className="fade-up" style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.2 }}>
            {greeting}, <span style={{ color: 'var(--accent)' }}>{profile?.username}</span>
          </h1>
          <p style={{ color: 'var(--muted)', marginTop: '.25rem', fontSize: '.84rem' }}>
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {deadlines.filter(d => d.daysLeft <= 7).length > 0 && (
              <span style={{ marginLeft: '.6rem', color: 'var(--accent)', fontWeight: 600 }}>
                · {deadlines.filter(d => d.daysLeft <= 7).length} deadline{deadlines.filter(d => d.daysLeft <= 7).length !== 1 ? 's' : ''} this week
              </span>
            )}
          </p>
        </div>

        {/* Bento top row */}
        <div className="fade-up-2 dash-bento-top" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.85rem', marginBottom: '.85rem' }}>
          <Link href="/subjects/new" className="card-accent" style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px' }}>
            <div style={{ width: '32px', height: '32px', background: 'rgba(0,0,0,.15)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={16} color="var(--accent-fg)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--accent-fg)', marginBottom: '.12rem' }}>New Subject</div>
              <div style={{ fontSize: '.74rem', color: 'rgba(0,0,0,.45)' }}>Add a course</div>
            </div>
          </Link>

          <Link href="/calendar" className="card" style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--accent-light)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={16} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: '.12rem' }}>Add Event</div>
              <div style={{ fontSize: '.74rem', color: 'var(--muted)' }}>Set a deadline</div>
            </div>
          </Link>

          <div className="card" style={{ padding: '1.4rem', minHeight: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 600, fontSize: '.7rem', color: 'var(--muted)', letterSpacing: '.06em' }}>SUBJECTS</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '2.6rem', letterSpacing: '-.04em', lineHeight: 1 }}>{subjects.length}</div>
              <div style={{ fontSize: '.74rem', color: 'var(--muted)', marginTop: '.2rem' }}>courses</div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.4rem', minHeight: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 600, fontSize: '.7rem', color: 'var(--muted)', letterSpacing: '.06em' }}>DUE SOON</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '2.6rem', letterSpacing: '-.04em', lineHeight: 1, color: deadlines.filter(d => d.daysLeft <= 7).length > 0 ? 'var(--accent)' : 'var(--text)' }}>
                {deadlines.filter(d => d.daysLeft <= 7).length}
              </div>
              <div style={{ fontSize: '.74rem', color: 'var(--muted)', marginTop: '.2rem' }}>this week</div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="fade-up-3 dash-bottom" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '.85rem' }}>
          {/* Subjects */}
          <div className="card" style={{ padding: '1.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 700, fontSize: '.88rem' }}>Subjects</span>
              <Link href="/subjects" style={{ display: 'flex', alignItems: 'center', gap: '.3rem', color: 'var(--accent)', fontWeight: 600, fontSize: '.78rem' }}>
                View all <ArrowRight size={13} />
              </Link>
            </div>
            {subjects.length === 0 ? (
              <div style={{ border: '1px dashed var(--border2)', borderRadius: '14px', padding: '2.5rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--muted)', marginBottom: '1rem', fontSize: '.85rem' }}>No subjects yet</p>
                <Link href="/subjects/new" className="btn-primary" style={{ fontSize: '.82rem', padding: '.5rem 1.1rem' }}>Create one</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                {subjects.slice(0, 5).map((sub, i) => {
                  const pct = sub.total === 0 ? 0 : Math.round((sub.done / sub.total) * 100)
                  const color = subjectColors[i % subjectColors.length]
                  return (
                    <Link key={sub.id} href={`/subjects/${sub.id}`} style={{ display: 'flex', alignItems: 'center', gap: '.85rem', padding: '.75rem .95rem', background: 'var(--surface2)', borderRadius: '13px', border: '1px solid var(--border)', transition: 'border-color .15s, background .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--surface3)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface2)' }}
                    >
                      <div style={{ width: '4px', height: '36px', background: color, borderRadius: '99px', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '.85rem', marginBottom: '.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.name}</div>
                        <div className="progress-track" style={{ height: '4px' }}>
                          <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '.82rem', color }}>{pct}%</div>
                        <div style={{ fontSize: '.68rem', color: 'var(--muted)' }}>{sub.done}/{sub.total}</div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Deadlines */}
          <div className="card" style={{ padding: '1.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 700, fontSize: '.88rem' }}>Deadlines</span>
              <Link href="/calendar" style={{ display: 'flex', alignItems: 'center', gap: '.3rem', color: 'var(--accent)', fontWeight: 600, fontSize: '.78rem' }}>
                All <ArrowRight size={13} />
              </Link>
            </div>
            {deadlines.length === 0 ? (
              <div style={{ border: '1px dashed var(--border2)', borderRadius: '13px', padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--muted)', fontSize: '.82rem' }}>No upcoming deadlines</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
                {deadlines.slice(0, 5).map(evt => {
                  const urgent = evt.daysLeft <= 3
                  return (
                    <div key={evt.id} style={{ padding: '.7rem .85rem', background: 'var(--surface2)', borderRadius: '12px', border: `1px solid ${urgent ? 'rgba(239,68,68,.25)' : 'var(--border)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.5rem' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{evt.title}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '.7rem', marginTop: '.1rem' }}>{evt.deadline}</div>
                      </div>
                      <span style={{ flexShrink: 0, padding: '.18rem .55rem', borderRadius: '7px', fontWeight: 700, fontSize: '.7rem', background: urgent ? 'rgba(239,68,68,.12)' : 'var(--accent-light)', color: urgent ? '#ef4444' : 'var(--accent)' }}>
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

      <style>{`
        @media (max-width: 768px) {
          .dash-title { display: none; }
          .dash-nav-links { display: none !important; }
          .dash-username { display: none !important; }
          .dash-mobile-menu { display: flex !important; }
          .dash-bento-top { grid-template-columns: 1fr 1fr !important; }
          .dash-bottom { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) {
          .dash-mobile-menu { display: none !important; }
          .dash-mobile-drawer { display: none !important; }
        }
      `}</style>
    </div>
  )
}