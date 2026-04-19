'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import '@/app/globals.css'

export default function SubjectsPage() {
  const router = useRouter()
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
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

  if (loading) return <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', color: 'var(--muted)' }}>Loading...</div>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)', color: 'var(--text)' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 2.5rem', borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href="/dashboard" style={{ color: 'var(--muted)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>← Dashboard</Link>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Subjects</span>
        <Link href="/subjects/new" style={{ background: 'var(--accent)', color: 'var(--accent-fg)', padding: '0.45rem 1rem', borderRadius: 'var(--radius)', fontSize: '0.85rem', fontWeight: '600' }}>+ New Subject</Link>
      </nav>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2.5rem' }}>
        <div className="fade-up" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem' }}>Your Subjects</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>{subjects.length} subject{subjects.length !== 1 ? 's' : ''}</p>
        </div>

        {subjects.length === 0 ? (
          <div style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '4rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>No subjects yet</p>
            <Link href="/subjects/new" style={{ background: 'var(--accent)', color: 'var(--accent-fg)', padding: '0.6rem 1.5rem', borderRadius: 'var(--radius)', fontSize: '0.9rem', fontWeight: '600' }}>Create your first subject</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {subjects.map((sub, i) => {
              const pct = sub.total === 0 ? 0 : Math.round((sub.done / sub.total) * 100)
              return (
                <div key={sub.id} className={`fade-up`} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <Link href={`/subjects/${sub.id}`} style={{ display: 'block', padding: '1.5rem' }}>
                    <div style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '0.25rem' }}>{sub.name}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)', marginBottom: '1.2rem' }}>
                      {sub.professor ? `Prof. ${sub.professor}` : 'No professor set'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{sub.done}/{sub.total} tasks</span>
                      <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{pct}%</span>
                    </div>
                    <div style={{ background: 'var(--border)', borderRadius: '999px', height: '3px' }}>
                      <div style={{ background: 'var(--text)', width: `${pct}%`, height: '3px', borderRadius: '999px' }} />
                    </div>
                  </Link>
                  <div style={{ borderTop: '1px solid var(--border)', padding: '0.6rem 1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => deleteSubject(sub.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>Delete</button>
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