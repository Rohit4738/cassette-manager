'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'

export default function NewSubject() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [professor, setProfessor] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) { setError('Subject name is required'); return }
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.replace('/login'); return }
    const { error } = await supabase.from('subjects').insert({ name, professor, user_id: session.user.id })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/subjects')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Nunito, sans-serif', color: 'var(--text)' }}>
      <nav style={{ background: 'var(--surface)', borderBottom: '2px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <Link href="/subjects" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', color: 'var(--muted)', fontWeight: 700, fontSize: '.88rem' }}>
            <ArrowLeft size={16} /> Subjects
          </Link>
          <span style={{ fontWeight: 900, fontSize: '1.05rem' }}>New Subject</span>
          <div style={{ width: '80px' }} />
        </div>
      </nav>

      <main style={{ maxWidth: '520px', margin: '4rem auto', padding: '0 1.5rem' }}>
        <div className="fade-up">
          <div style={{ width: '52px', height: '52px', background: 'var(--accent-light)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <BookOpen size={24} color="var(--accent)" />
          </div>
          <h1 style={{ fontWeight: 900, fontSize: '1.8rem', marginBottom: '.4rem' }}>New Subject</h1>
          <p style={{ color: 'var(--muted)', fontWeight: 600, marginBottom: '2.5rem' }}>Add a course to your study manager</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 800, color: 'var(--text2)', marginBottom: '.5rem', letterSpacing: '.06em' }}>SUBJECT NAME *</label>
              <input className="input-field" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} placeholder="e.g. Mathematics, Physics, History..." />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 800, color: 'var(--text2)', marginBottom: '.5rem', letterSpacing: '.06em' }}>PROFESSOR NAME</label>
              <input className="input-field" value={professor} onChange={e => setProfessor(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} placeholder="e.g. Dr. Johnson" />
            </div>
          </div>

          {error && <div style={{ background: '#fdecea', border: '1.5px solid #ffbbb5', borderRadius: '14px', padding: '.8rem 1rem', marginBottom: '1rem', color: '#c0392b', fontSize: '.85rem', fontWeight: 700 }}>{error}</div>}

          <button className="btn-primary" onClick={handleCreate} disabled={loading} style={{ width: '100%', padding: '.9rem', fontSize: '1rem' }}>
            {loading ? 'Creating...' : 'Create Subject'}
          </button>
        </div>
      </main>
    </div>
  )
}