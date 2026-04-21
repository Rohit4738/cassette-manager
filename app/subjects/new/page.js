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
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter,sans-serif', color: 'var(--text)' }}>
      <nav style={{ borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100, background: 'var(--nav-bg)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>
          <Link href="/subjects" style={{ display: 'flex', alignItems: 'center', gap: '.45rem', color: 'var(--muted)', fontWeight: 500, fontSize: '.86rem' }}>
            <ArrowLeft size={15} /> Subjects
          </Link>
          <span style={{ fontWeight: 700, fontSize: '.95rem' }}>New Subject</span>
          <div style={{ width: '70px' }} />
        </div>
      </nav>

      <main style={{ maxWidth: '520px', margin: '0 auto', padding: '3rem 1.25rem' }}>
        <div className="fade-up">
          <div style={{ width: '50px', height: '50px', background: 'var(--accent-light)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <BookOpen size={22} color="var(--accent)" />
          </div>
          <h1 style={{ fontWeight: 800, fontSize: '1.7rem', letterSpacing: '-.02em', marginBottom: '.4rem' }}>New Subject</h1>
          <p style={{ color: 'var(--muted)', fontSize: '.88rem', marginBottom: '2.5rem' }}>Add a course to your study manager</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.45rem', letterSpacing: '.07em' }}>SUBJECT NAME *</label>
              <input className="input-field" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} placeholder="e.g. Mathematics, Physics..." />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.45rem', letterSpacing: '.07em' }}>PROFESSOR NAME</label>
              <input className="input-field" value={professor} onChange={e => setProfessor(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} placeholder="e.g. Dr. Johnson" />
            </div>
          </div>

          {error && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: '10px', padding: '.75rem 1rem', marginBottom: '1rem', color: '#ef4444', fontSize: '.84rem' }}>{error}</div>}

          <button className="btn-primary" onClick={handleCreate} disabled={loading} style={{ width: '100%', padding: '.9rem', fontSize: '.95rem' }}>
            {loading ? 'Creating...' : 'Create Subject'}
          </button>
        </div>
      </main>
    </div>
  )
}