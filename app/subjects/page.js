'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Plus, Trash2, ArrowLeft } from 'lucide-react'

export default function SubjectsPage() {
  const router = useRouter()
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      const { data: prof } = await supabase.from('profiles').select('theme').eq('id', session.user.id).maybeSingle()
      document.documentElement.setAttribute('data-theme', prof?.theme || 'clean-white')
      const { data: subs } = await supabase.from('subjects').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
      const { data: todos } = await supabase.from('todos').select('*').eq('user_id', session.user.id)
      setSubjects((subs || []).map(s => ({
        ...s,
        total: (todos || []).filter(t => t.subject_id === s.id).length,
        done: (todos || []).filter(t => t.subject_id === s.id && t.completed).length
      })))
      setLoading(false)
    }
    load()
  }, [])

  const deleteSubject = async (id) => {
    if (!confirm('Delete this subject and all its data?')) return
    await supabase.from('subjects').delete().eq('id', id)
    setSubjects(subjects.filter(s => s.id !== id))
  }

  const accentColors = ['#e05a4e','#3b5bdb','#c2185b','#2e7d32','#b8860b','#6a0dad','#1565c0','#c62828','#7a6040','#2e7d32']

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif' }}>
      <p style={{ color: 'var(--muted)', fontWeight: 600 }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Nunito, sans-serif', color: 'var(--text)' }}>
      <nav style={{ background: 'var(--surface)', borderBottom: '2px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', color: 'var(--muted)', fontWeight: 700, fontSize: '.88rem' }}>
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <span style={{ fontWeight: 900, fontSize: '1.05rem' }}>Subjects</span>
          <Link href="/subjects/new" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.5rem 1.1rem' }}>
            <Plus size={16} /> New
          </Link>
        </div>
      </nav>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <div className="fade-up" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontWeight: 900, fontSize: '2rem' }}>Your Subjects</h1>
          <p style={{ color: 'var(--muted)', fontWeight: 600, marginTop: '.3rem' }}>{subjects.length} subject{subjects.length !== 1 ? 's' : ''}</p>
        </div>

        {subjects.length === 0 ? (
          <div style={{ border: '2.5px dashed var(--border2)', borderRadius: '20px', padding: '4rem', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', background: 'var(--surface2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <BookOpen size={26} color="var(--muted)" />
            </div>
            <p style={{ color: 'var(--muted)', marginBottom: '1.5rem', fontWeight: 600 }}>No subjects yet</p>
            <Link href="/subjects/new" className="btn-primary">Create your first subject</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {subjects.map((sub, i) => {
              const pct = sub.total === 0 ? 0 : Math.round((sub.done / sub.total) * 100)
              const color = accentColors[i % accentColors.length]
              return (
                <div key={sub.id} className="card fade-up" style={{ overflow: 'hidden' }}>
                  <div style={{ height: '5px', background: color }} />
                  <Link href={`/subjects/${sub.id}`} style={{ display: 'block', padding: '1.3rem 1.4rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '.25rem' }}>{sub.name}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '.82rem', fontWeight: 600, marginBottom: '1.2rem' }}>
                      {sub.professor ? `Prof. ${sub.professor}` : 'No professor set'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.4rem' }}>
                      <span style={{ fontSize: '.78rem', color: 'var(--muted)', fontWeight: 700 }}>{sub.done}/{sub.total} tasks</span>
                      <span style={{ fontSize: '.78rem', fontWeight: 900, color }}>{pct}%</span>
                    </div>
                    <div className="progress-track" style={{ height: '6px' }}>
                      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </Link>
                  <div style={{ borderTop: '1.5px solid var(--border)', padding: '.6rem 1.4rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => deleteSubject(sub.id)} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', background: 'none', border: 'none', color: 'var(--muted)', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer', padding: '.3rem .6rem', borderRadius: '8px', transition: 'background .15s, color .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#fdecea'; e.currentTarget.style.color = '#c0392b' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)' }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}