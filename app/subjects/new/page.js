'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
    if (error) setError(error.message)
    else router.push('/subjects')
    setLoading(false)
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <Link href="/subjects" style={backBtn}>← Back</Link>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>New Subject</h1>
        <div />
      </div>
      <div style={formStyle}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Subject Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mathematics" style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Professor Name</label>
          <input value={professor} onChange={e => setProfessor(e.target.value)} placeholder="e.g. Dr. Smith" style={inputStyle} />
        </div>
        {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}
        <button onClick={handleCreate} disabled={loading} style={btnStyle}>
          {loading ? 'Creating...' : 'Create Subject'}
        </button>
      </div>
    </div>
  )
}

const pageStyle = { minHeight: '100vh', background: '#0f0f0f', color: 'white', fontFamily: 'sans-serif' }
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', borderBottom: '1px solid #222' }
const formStyle = { maxWidth: '500px', margin: '3rem auto', padding: '0 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }
const fieldStyle = { display: 'flex', flexDirection: 'column', gap: '0.5rem' }
const labelStyle = { color: '#aaa', fontSize: '0.9rem' }
const inputStyle = { padding: '0.75rem 1rem', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: 'white', fontSize: '1rem' }
const btnStyle = { padding: '0.75rem', background: '#7c6fcd', border: 'none', borderRadius: '8px', color: 'white', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold' }
const backBtn = { color: '#888', textDecoration: 'none' }