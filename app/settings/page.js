'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'

const THEMES = [
  { id: 'solar',    label: 'Solar',    desc: 'Warm yellow on black',   hex: '#f0c040' },
  { id: 'crimson',  label: 'Crimson',  desc: 'Deep red on black',      hex: '#e53935' },
  { id: 'cobalt',   label: 'Cobalt',   desc: 'Royal blue on black',    hex: '#4a7feb' },
  { id: 'bloom',    label: 'Bloom',    desc: 'Vivid pink on black',    hex: '#e84393' },
  { id: 'terrain',  label: 'Terrain',  desc: 'Earthy gold on black',   hex: '#c8a86b' },
  { id: 'sapphire', label: 'Sapphire', desc: 'Electric blue on black', hex: '#1e88e5' },
  { id: 'obsidian', label: 'Obsidian', desc: 'Sharp gold on black',    hex: '#e8d44d' },
  { id: 'scarlet',  label: 'Scarlet',  desc: 'Bold red on black',      hex: '#f44336' },
  { id: 'violet',   label: 'Violet',   desc: 'Rich purple on black',   hex: '#9c27b0' },
  { id: 'forest',   label: 'Forest',   desc: 'Deep green on black',    hex: '#43a047' },
]

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [current, setCurrent] = useState('solar')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
      if (!prof) { router.replace('/login'); return }
      setProfile(prof)
      setCurrent(prof.theme || 'solar')
      document.documentElement.setAttribute('data-theme', prof.theme || 'solar')
    }
    load()
  }, [])

  const applyTheme = async (themeId) => {
    setCurrent(themeId)
    document.documentElement.setAttribute('data-theme', themeId)
    setSaved(false)
    await supabase.from('profiles').update({ theme: themeId }).eq('id', profile.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!profile) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <p style={{ color: '#444' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter, sans-serif', color: 'var(--text)' }}>
      <nav style={{ borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,10,10,.85)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '58px' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', color: 'var(--muted)', fontWeight: 500, fontSize: '.88rem' }}>
            <ArrowLeft size={15} /> Back
          </Link>
          <span style={{ fontWeight: 700, fontSize: '.95rem' }}>Theme</span>
          <div style={{ width: '60px', display: 'flex', justifyContent: 'flex-end' }}>
            {saved && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', color: 'var(--accent)', fontWeight: 600, fontSize: '.8rem' }}>
                <Check size={13} /> Saved
              </div>
            )}
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div className="fade-up" style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-.03em', marginBottom: '.4rem' }}>Choose your theme</h1>
          <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>Saves instantly and syncs across all your devices.</p>
        </div>

        <div className="fade-up-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '.75rem' }}>
          {THEMES.map(t => (
            <button key={t.id} onClick={() => applyTheme(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.25rem', background: current === t.id ? 'var(--surface2)' : 'var(--surface)', border: `1px solid ${current === t.id ? t.hex : 'var(--border)'}`, borderRadius: '18px', cursor: 'pointer', transition: 'all .18s', textAlign: 'left', boxShadow: current === t.id ? `0 0 0 1px ${t.hex}33` : 'none' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: t.hex, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text)', marginBottom: '.15rem' }}>{t.label}</div>
                <div style={{ color: 'var(--muted)', fontSize: '.75rem' }}>{t.desc}</div>
              </div>
              {current === t.id && <Check size={16} color={t.hex} style={{ flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}