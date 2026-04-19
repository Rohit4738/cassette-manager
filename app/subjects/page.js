'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SubjectsPage() {
  const router = useRouter()
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)
      const { data } = await supabase.from('subjects').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
      setSubjects(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const deleteSubject = async (id) => {
    if (!confirm('Delete this subject?')) return
    await supabase.from('subjects').delete().eq('id', id)
    setSubjects(subjects.filter(s => s.id !== id))
  }

  if (loading) return <div style={loadingStyle}>Loading...</div>

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/dashboard" style={backBtn}>← Back</Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>📚 Subjects</h1>
        </div>
        <Link href="/subjects/new" style={addBtn}>+ New Subject</Link>
      </div>

      <div style={contentStyle}>
        {subjects.length === 0 ? (
          <div style={emptyCard}>No subjects yet. <Link href="/subjects/new" style={{ color: '#7c6fcd' }}>Create your first!</Link></div>
        ) : (
          <div style={gridStyle}>
            {subjects.map(sub => (
              <div key={sub.id} style={subjectCard}>
                <Link href={`/subjects/${sub.id}`} style={{ textDecoration: 'none', color: 'white' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{sub.name}</div>
                  <div style={{ color: '#888', fontSize: '0.85rem' }}>Prof. {sub.professor || 'N/A'}</div>
                </Link>
                <button onClick={() => deleteSubject(sub.id)} style={deleteBtn}>🗑️</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const pageStyle = { minHeight: '100vh', background: '#0f0f0f', color: 'white', fontFamily: 'sans-serif' }
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', borderBottom: '1px solid #222', position: 'sticky', top: 0, background: '#0f0f0f', zIndex: 10 }
const contentStyle = { padding: '2rem', maxWidth: '1100px', margin: '0 auto' }
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }
const subjectCard = { background: '#1a1a1a', borderRadius: '12px', padding: '1.5rem', border: '1px solid #2a2a2a', position: 'relative' }
const emptyCard = { background: '#1a1a1a', borderRadius: '12px', padding: '2rem', color: '#888', textAlign: 'center' }
const backBtn = { color: '#888', textDecoration: 'none', fontSize: '0.9rem' }
const addBtn = { background: '#7c6fcd', color: 'white', padding: '0.5rem 1.2rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }
const deleteBtn = { position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem' }
const loadingStyle = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f0f', color: 'white', fontFamily: 'sans-serif' }