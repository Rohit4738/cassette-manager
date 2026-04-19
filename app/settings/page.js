'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const THEMES = [
  { id: 'springfield',     label: '☀️ Springfield Days',    desc: 'Sunny yellow & warm cream' },
  { id: 'spartans-rage',   label: '⚔️ Spartan\'s Rage',     desc: 'Deep red & battle-worn grey' },
  { id: 'the-invincible',  label: '🦸 The Invincible',      desc: 'Royal blue & electric yellow' },
  { id: 'nolans-daughter', label: '🌸 Nolan\'s Daughter',   desc: 'Rose pink & sage green' },
  { id: 'quahog-dad',      label: '🍺 Quahog Dad',          desc: 'Earthy olive & warm brown' },
  { id: 'man-of-steel',    label: '🔵 Man of Steel',        desc: 'Cobalt blue & gold' },
  { id: 'dark-knight',     label: '🦇 The Dark Knight',     desc: 'Near-black & golden spark' },
  { id: 'web-slinger',     label: '🕷️ Web Slinger',         desc: 'Bold red & deep navy' },
  { id: 'wakanda',         label: '💜 Wakanda Forever',     desc: 'Royal purple & silver' },
  { id: 'emerald-archer',  label: '🏹 Emerald Archer',      desc: 'Forest green & earthy gold' },
]

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [current, setCurrent] = useState('springfield')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
      if (!prof) { router.replace('/login'); return }
      setProfile(prof)
      setCurrent(prof.theme || 'springfield')
      document.documentElement.setAttribute('data-theme', prof.theme || 'springfield')
    }
    load()
  }, [])

  const applyTheme = async (themeId) => {
    setCurrent(themeId)
    document.documentElement.setAttribute('data-theme', themeId)
    setSaving(true); setSaved(false)
    await supabase.from('profiles').update({ theme: themeId }).eq('id', profile.id)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!profile) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif' }}>
      <p style={{ color: 'var(--muted)', fontWeight: 700 }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Nunito, sans-serif', color: 'var(--text)' }}>
      <nav style={{ background: 'var(--surface)', borderBottom: '2px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontWeight: 800, color: 'var(--muted)', fontSize: '.88rem' }}>← Back</Link>
          <span style={{ fontWeight: 900, fontSize: '1.05rem' }}>🎨 Theme Settings</span>
          <div style={{ width: '60px' }} />
        </div>
      </nav>

      <main style={{ maxWidth: '700px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <div className="fade-up" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '.5rem' }}>Your Theme</h1>
          <p style={{ color: 'var(--muted)', fontWeight: 600 }}>Pick your vibe. It saves instantly and works on all your devices.</p>
          {saved && <div style={{ marginTop: '.75rem', display: 'inline-block', background: 'var(--accent-light)', color: 'var(--text)', padding: '.35rem 1rem', borderRadius: '99px', fontSize: '.82rem', fontWeight: 800 }}>✅ Theme saved!</div>}
        </div>

        <div className="fade-up-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '.85rem' }}>
          {THEMES.map(t => (
            <div key={t.id} data-theme={t.id} onClick={() => applyTheme(t.id)} style={{ padding: '1.1rem 1.3rem', background: 'var(--surface)', border: `2.5px solid ${current === t.id ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '20px', cursor: 'pointer', transition: 'all .18s', transform: current === t.id ? 'translateY(-3px)' : 'none', boxShadow: current === t.id ? '0 6px 20px rgba(0,0,0,.12)' : 'var(--card-shadow)', display: 'flex', alignItems: 'center', gap: '.9rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '99px', background: 'var(--accent)', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,.15)' }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '.88rem', color: 'var(--text)' }}>{t.label}</div>
                <div style={{ color: 'var(--muted)', fontSize: '.75rem', fontWeight: 600 }}>{t.desc}</div>
              </div>
              {current === t.id && <div style={{ marginLeft: 'auto', fontSize: '1rem' }}>✓</div>}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}