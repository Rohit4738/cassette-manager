'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Calendar } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [subjectCount, setSubjectCount] = useState(0)
  const [todoCount, setTodoCount] = useState(0)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
      if (!prof) { router.replace('/login'); return }
      document.documentElement.setAttribute('data-theme', prof.theme || 'clean-white')
      setProfile(prof)
      const { count: sCount } = await supabase.from('subjects').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id)
      const { count: tCount } = await supabase.from('todos').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id)
      setSubjectCount(sCount || 0)
      setTodoCount(tCount || 0)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif' }}>
      <p style={{ color: 'var(--muted)', fontWeight: 600 }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Nunito, sans-serif', color: 'var(--text)' }}>
      <nav style={{ background: 'var(--surface)', borderBottom: '2px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', color: 'var(--muted)', fontWeight: 700, fontSize: '.88rem' }}>
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <span style={{ fontWeight: 900, fontSize: '1.05rem' }}>Profile</span>
          <div style={{ width: '80px' }} />
        </div>
      </nav>

      <main style={{ maxWidth: '700px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Avatar + name */}
          <div style={{ background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: '20px', padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '99px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontWeight: 900, fontSize: '2rem', color: 'var(--accent-fg)' }}>
              {profile?.username?.[0]?.toUpperCase()}
            </div>
            <h1 style={{ fontWeight: 900, fontSize: '1.5rem', marginBottom: '.3rem' }}>{profile?.username}</h1>
            <p style={{ color: 'var(--muted)', fontWeight: 600, fontSize: '.9rem' }}>{profile?.email}</p>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {[
              { icon: <User size={20} color="var(--accent)" />, label: 'Subjects', value: subjectCount },
              { icon: <Calendar size={20} color="var(--accent)" />, label: 'Total Tasks', value: todoCount },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '44px', height: '44px', background: 'var(--accent-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1.5rem' }}>{s.value}</div>
                  <div style={{ color: 'var(--muted)', fontWeight: 600, fontSize: '.82rem' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Account info */}
          <div style={{ background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: '20px', overflow: 'hidden' }}>
            {[
              { icon: <User size={16} />, label: 'Username', value: profile?.username },
              { icon: <Mail size={16} />, label: 'Email', value: profile?.email },
            ].map((item, i) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.5rem', borderBottom: i === 0 ? '2px solid var(--border)' : 'none' }}>
                <span style={{ color: 'var(--muted)', display: 'flex' }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: '.75rem', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.06em' }}>{item.label.toUpperCase()}</div>
                  <div style={{ fontWeight: 700, fontSize: '.92rem' }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>

          <Link href="/settings" className="btn-primary" style={{ textAlign: 'center', padding: '.85rem' }}>
            Change Theme
          </Link>
        </div>
      </main>
    </div>
  )
}