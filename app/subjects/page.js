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
      document.documentElement.setAttribute('data-theme', prof?.theme || 'solar-dark')
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

  const accentColors = ['#f0c040', '#4a7feb', '#e84393', '#43a047', '#e53935', '#9c27b0', '#1e88e5', '#f44336', '#c8a86b', '#e8d44d']

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg,#0a0a0a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="loading-pulse" style={{ width: '52px', height: '52px', background: 'var(--accent,#f0c040)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto .75rem' }}>
          <BookOpen size={24} color="var(--accent-fg,#0a0a0a)" />
        </div>
        <p style={{ color: 'var(--muted,#555)', fontSize: '.88rem' }}>Loading subjects...</p>
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
          <span style={{ fontWeight: 700, fontSize: '.95rem' }}>Subjects</span>
          <Link href="/subjects/new" className="btn-primary" style={{ padding: '.48rem 1rem', fontSize: '.84rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
            <Plus size={15} /> New
          </Link>
        </div>
      </nav>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <div className="fade-up" style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-.02em' }}>Your Subjects</h1>
          <p style={{ color: 'var(--muted)', fontSize: '.84rem', marginTop: '.25rem' }}>{subjects.length} subject{subjects.length !== 1 ? 's' : ''}</p>
        </div>

        {subjects.length === 0 ? (
          <div style={{ border: '1px dashed var(--border2)', borderRadius: '20px', padding: '4rem', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', background: 'var(--surface2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <BookOpen size={26} color="var(--muted)" />
            </div>
            <p style={{ color: 'var(--muted)', marginBottom: '1.5rem', fontWeight: 500 }}>No subjects yet</p>
            <Link href="/subjects/new" className="btn-primary">Create your first subject</Link>
          </div>
        ) : (
          <div className="subjects-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {subjects.map((sub, i) => {
              const pct = sub.total === 0 ? 0 : Math.round((sub.done / sub.total) * 100)
              const color = accentColors[i % accentColors.length]
              return (
                <div key={sub.id} className="card" style={{ overflow: 'hidden' }}>
                  <div style={{ height: '4px', background: color }} />
                  <Link href={`/subjects/${sub.id}`} style={{ display: 'block', padding: '1.3rem 1.4rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '.2rem' }}>{sub.name}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '.8rem', fontWeight: 500, marginBottom: '1.1rem' }}>
                      {sub.professor ? `Prof. ${sub.professor}` : 'No professor set'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.4rem' }}>
                      <span style={{ fontSize: '.75rem', color: 'var(--muted)', fontWeight: 600 }}>{sub.done}/{sub.total} tasks</span>
                      <span style={{ fontSize: '.75rem', fontWeight: 800, color }}>{pct}%</span>
                    </div>
                    <div className="progress-track" style={{ height: '5px' }}>
                      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </Link>
                  <div style={{ borderTop: '1px solid var(--border)', padding: '.55rem 1.4rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => deleteSubject(sub.id)} style={{ display: 'flex', alignItems: 'center', gap: '.35rem', background: 'none', border: 'none', color: 'var(--muted)', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', padding: '.25rem .5rem', borderRadius: '7px', transition: 'background .15s, color .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,.08)'; e.currentTarget.style.color = '#ef4444' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)' }}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <style>{`
        @media (max-width: 600px) {
          .subjects-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}