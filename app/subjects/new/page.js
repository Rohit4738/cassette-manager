'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import '@/app/globals.css'

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
    if (!session) { router.push('/login'); return }
    const { error } = await supabase.from('subjects').insert({ name, professor, user_id: session.user.id })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/subjects')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)', color: 'var(--text)' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 2.5rem', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <Link href="/subjects" style={{ color: 'var(--muted)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>← Subjects</Link>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>New Subject</span>
        <div style={{ width: '80px' }} />
      </nav>

      <main style={{ maxWidth: '520px', margin: '5rem auto', padding: '0 2rem' }}>
        <div className="fade-up">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '0.5rem' }}>New Subject</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '2.5rem' }}>Add a course to your study manager</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', marginBottom: '0.5rem', letterSpacing: '0.08em' }}>SUBJECT NAME *</label>
              <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} placeholder="e.g. Mathematics, Physics..." style={{ width: '100%', padding: '0.85rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '0.95rem', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--text)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', marginBottom: '0.5rem', letterSpacing: '0.08em' }}>PROFESSOR NAME</label>
              <input value={professor} onChange={e => setProfessor(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} placeholder="e.g. Dr. Smith" style={{ width: '100%', padding: '0.85rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '0.95rem', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--text)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          </div>

          {error && <div style={{ background: '#fdf2f2', border: '1px solid #f5c6c6', borderRadius: 'var(--radius)', padding: '0.7rem 1rem', marginBottom: '1rem', color: 'var(--danger)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>{error}</div>}

          <button onClick={handleCreate} disabled={loading} style={{ width: '100%', padding: '0.9rem', background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 'var(--radius)', fontSize: '0.9rem', fontWeight: '600', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Creating...' : 'Create Subject'}
          </button>
        </div>
      </main>
    </div>
  )
}