'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const themes = {
  dark: [
    { name: 'Purple Night', bg: '#0f0f0f', card: '#1a1a1a', accent: '#7c6fcd' },
    { name: 'Ocean Dark', bg: '#0a0f1e', card: '#111827', accent: '#4ecdc4' },
    { name: 'Red Dark', bg: '#110a0a', card: '#1a1010', accent: '#ff6b6b' },
    { name: 'Green Dark', bg: '#0a110a', card: '#101a10', accent: '#6bcb77' },
  ],
  light: [
    { name: 'Clean White', bg: '#f5f5f5', card: '#ffffff', accent: '#7c6fcd' },
    { name: 'Sky Blue', bg: '#e8f4fd', card: '#ffffff', accent: '#4ecdc4' },
    { name: 'Warm Sand', bg: '#fdf6ec', card: '#ffffff', accent: '#e8935a' },
    { name: 'Mint Fresh', bg: '#edfdf5', card: '#ffffff', accent: '#6bcb77' },
  ]
}

export default function SettingsPage() {
  const router = useRouter()
  const [mode, setMode] = useState('dark')
  const [selectedTheme, setSelectedTheme] = useState(0)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
    }
    const saved = localStorage.getItem('cm-theme')
    if (saved) {
      const parsed = JSON.parse(saved)
      setMode(parsed.mode)
      setSelectedTheme(parsed.index)
    }
    load()
  }, [])

  const applyTheme = (m, i) => {
    setMode(m)
    setSelectedTheme(i)
    localStorage.setItem('cm-theme', JSON.stringify({ mode: m, index: i }))
  }

  const theme = themes[mode][selectedTheme]
  const textColor = mode === 'dark' ? 'white' : '#111'
  const subColor = mode === 'dark' ? '#888' : '#555'

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, color: textColor, fontFamily: 'sans-serif', transition: 'all 0.3s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', borderBottom: `1px solid ${mode === 'dark' ? '#222' : '#ddd'}` }}>
        <Link href="/dashboard" style={{ color: subColor, textDecoration: 'none' }}>← Back</Link>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>⚙️ Settings</h1>
        <div />
      </div>

      <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '0 2rem' }}>
        {/* Mode Toggle */}
        <h2 style={{ marginBottom: '1rem', color: subColor, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mode</h2>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          {['dark', 'light'].map(m => (
            <button key={m} onClick={() => applyTheme(m, 0)} style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: `2px solid ${mode === m ? theme.accent : 'transparent'}`, background: m === 'dark' ? '#1a1a1a' : '#f0f0f0', color: m === 'dark' ? 'white' : '#111', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: 'all 0.2s' }}>
              {m === 'dark' ? '🌙 Dark' : '☀️ Light'}
            </button>
          ))}
        </div>

        {/* Sub Themes */}
        <h2 style={{ marginBottom: '1rem', color: subColor, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Color Theme</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {themes[mode].map((t, i) => (
            <button key={i} onClick={() => applyTheme(mode, i)} style={{ padding: '1.2rem', borderRadius: '12px', border: `2px solid ${selectedTheme === i ? t.accent : 'transparent'}`, background: t.card, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: t.accent }} />
                <span style={{ color: mode === 'dark' ? 'white' : '#111', fontWeight: selectedTheme === i ? 'bold' : 'normal' }}>{t.name}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Preview */}
        <h2 style={{ marginBottom: '1rem', marginTop: '2rem', color: subColor, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Preview</h2>
        <div style={{ background: theme.card, borderRadius: '12px', padding: '1.5rem', border: `1px solid ${mode === 'dark' ? '#2a2a2a' : '#ddd'}` }}>
          <div style={{ fontWeight: 'bold', color: textColor, marginBottom: '0.5rem' }}>Sample Subject Card</div>
          <div style={{ color: subColor, fontSize: '0.85rem', marginBottom: '1rem' }}>Prof. Example</div>
          <div style={{ background: theme.bg, borderRadius: '999px', height: '8px' }}>
            <div style={{ background: theme.accent, width: '65%', height: '8px', borderRadius: '999px' }} />
          </div>
          <div style={{ color: theme.accent, fontSize: '0.8rem', marginTop: '0.5rem' }}>65% complete</div>
        </div>
      </div>
    </div>
  )
}