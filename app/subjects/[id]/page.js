'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function SubjectPage() {
  const router = useRouter()
  const { id } = useParams()
  const [subject, setSubject] = useState(null)
  const [tab, setTab] = useState('todos')
  const [todos, setTodos] = useState([])
  const [folders, setFolders] = useState([])
  const [notes, setNotes] = useState([])
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [newTodo, setNewTodo] = useState('')
  const [newNote, setNewNote] = useState('')
  const [newFolder, setNewFolder] = useState('')
  const [newMediaTitle, setNewMediaTitle] = useState('')
  const [newMediaUrl, setNewMediaUrl] = useState('')
  const [newMediaType, setNewMediaType] = useState('link')
  const [selectedFolder, setSelectedFolder] = useState(null)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const { data: sub } = await supabase.from('subjects').select('*').eq('id', id).single()
      const { data: td } = await supabase.from('todos').select('*').eq('subject_id', id).order('created_at')
      const { data: fl } = await supabase.from('todo_folders').select('*').eq('subject_id', id)
      const { data: nt } = await supabase.from('notes').select('*').eq('subject_id', id).order('created_at')
      const { data: md } = await supabase.from('media').select('*').eq('subject_id', id).order('created_at')
      setSubject(sub)
      setTodos(td || [])
      setFolders(fl || [])
      setNotes(nt || [])
      setMedia(md || [])
      setLoading(false)
    }
    load()
  }, [id])

  const totalTodos = todos.length
  const completedTodos = todos.filter(t => t.completed).length
  const progress = totalTodos === 0 ? 0 : Math.round((completedTodos / totalTodos) * 100)

  const addTodo = async () => {
    if (!newTodo.trim()) return
    const { data: { session } } = await supabase.auth.getSession()
    const { data } = await supabase.from('todos').insert({ title: newTodo, subject_id: id, user_id: session.user.id, folder_id: selectedFolder }).select().single()
    setTodos([...todos, data])
    setNewTodo('')
  }

  const toggleTodo = async (todo) => {
    await supabase.from('todos').update({ completed: !todo.completed }).eq('id', todo.id)
    setTodos(todos.map(t => t.id === todo.id ? { ...t, completed: !t.completed } : t))
  }

  const deleteTodo = async (todoId) => {
    await supabase.from('todos').delete().eq('id', todoId)
    setTodos(todos.filter(t => t.id !== todoId))
  }

  const addFolder = async () => {
    if (!newFolder.trim()) return
    const { data: { session } } = await supabase.auth.getSession()
    const { data } = await supabase.from('todo_folders').insert({ name: newFolder, subject_id: id, user_id: session.user.id }).select().single()
    setFolders([...folders, data])
    setNewFolder('')
  }

  const deleteFolder = async (folderId) => {
    await supabase.from('todo_folders').delete().eq('id', folderId)
    setFolders(folders.filter(f => f.id !== folderId))
  }

  const addNote = async () => {
    if (!newNote.trim()) return
    const { data: { session } } = await supabase.auth.getSession()
    const { data } = await supabase.from('notes').insert({ content: newNote, subject_id: id, user_id: session.user.id }).select().single()
    setNotes([...notes, data])
    setNewNote('')
  }

  const deleteNote = async (noteId) => {
    await supabase.from('notes').delete().eq('id', noteId)
    setNotes(notes.filter(n => n.id !== noteId))
  }

  const addMedia = async () => {
    if (!newMediaUrl.trim()) return
    const { data: { session } } = await supabase.auth.getSession()
    const { data } = await supabase.from('media').insert({ title: newMediaTitle, url: newMediaUrl, type: newMediaType, subject_id: id, user_id: session.user.id }).select().single()
    setMedia([...media, data])
    setNewMediaTitle('')
    setNewMediaUrl('')
  }

  const deleteMedia = async (mediaId) => {
    await supabase.from('media').delete().eq('id', mediaId)
    setMedia(media.filter(m => m.id !== mediaId))
  }

  if (loading) return <div style={loadingStyle}>Loading...</div>

  const filteredTodos = selectedFolder ? todos.filter(t => t.folder_id === selectedFolder) : todos.filter(t => !t.folder_id)

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/subjects" style={backBtn}>← Back</Link>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{subject?.name}</h1>
            <p style={{ color: '#888', fontSize: '0.8rem' }}>Prof. {subject?.professor || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ padding: '1rem 2rem', background: '#111', borderBottom: '1px solid #222' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <span style={{ color: '#888', fontSize: '0.85rem' }}>Progress</span>
          <span style={{ color: '#7c6fcd', fontWeight: 'bold' }}>{progress}%</span>
        </div>
        <div style={{ background: '#2a2a2a', borderRadius: '999px', height: '8px' }}>
          <div style={{ background: '#7c6fcd', width: `${progress}%`, height: '8px', borderRadius: '999px', transition: 'width 0.3s' }} />
        </div>
        <p style={{ color: '#555', fontSize: '0.8rem', marginTop: '0.4rem' }}>{completedTodos}/{totalTodos} tasks completed</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #222', padding: '0 2rem' }}>
        {['todos', 'notes', 'media'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...tabBtn, ...(tab === t ? activeTab : {}) }}>
            {t === 'todos' ? '✅ To-Do' : t === 'notes' ? '🧠 Notes' : '🖼️ Media'}
          </button>
        ))}
      </div>

      <div style={contentStyle}>

        {/* TODOS TAB */}
        {tab === 'todos' && (
          <div>
            {/* Folders */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
              <button onClick={() => setSelectedFolder(null)} style={{ ...folderBtn, ...(selectedFolder === null ? activeFolder : {}) }}>All</button>
              {folders.map(f => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <button onClick={() => setSelectedFolder(f.id)} style={{ ...folderBtn, ...(selectedFolder === f.id ? activeFolder : {}) }}>{f.name}</button>
                  <button onClick={() => deleteFolder(f.id)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input value={newFolder} onChange={e => setNewFolder(e.target.value)} placeholder="New folder..." style={{ ...inputStyle, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} />
                <button onClick={addFolder} style={{ ...smallBtn, background: '#333' }}>+ Folder</button>
              </div>
            </div>

            {/* Add Todo */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input value={newTodo} onChange={e => setNewTodo(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTodo()} placeholder={`Add task${selectedFolder ? ' to ' + folders.find(f => f.id === selectedFolder)?.name : ''}...`} style={inputStyle} />
              <button onClick={addTodo} style={smallBtn}>Add</button>
            </div>

            {/* Todo List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filteredTodos.length === 0 && <p style={{ color: '#555' }}>No tasks here yet.</p>}
              {filteredTodos.map(todo => (
                <div key={todo.id} style={todoItem}>
                  <input type="checkbox" checked={todo.completed} onChange={() => toggleTodo(todo)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  <span style={{ flex: 1, textDecoration: todo.completed ? 'line-through' : 'none', color: todo.completed ? '#555' : 'white' }}>{todo.title}</span>
                  <button onClick={() => deleteTodo(todo.id)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NOTES TAB */}
        {tab === 'notes' && (
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNote()} placeholder="Add a note..." style={inputStyle} />
              <button onClick={addNote} style={smallBtn}>Add</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {notes.length === 0 && <p style={{ color: '#555' }}>No notes yet.</p>}
              {notes.map(note => (
                <div key={note.id} style={noteItem}>
                  <p style={{ flex: 1, margin: 0 }}>{note.content}</p>
                  <button onClick={() => deleteNote(note.id)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MEDIA TAB */}
        {tab === 'media' && (
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <select value={newMediaType} onChange={e => setNewMediaType(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
                <option value="link">🔗 Link</option>
                <option value="image">🖼️ Image URL</option>
                <option value="pdf">📄 PDF URL</option>
              </select>
              <input value={newMediaTitle} onChange={e => setNewMediaTitle(e.target.value)} placeholder="Title (optional)" style={{ ...inputStyle, flex: 1 }} />
              <input value={newMediaUrl} onChange={e => setNewMediaUrl(e.target.value)} placeholder="URL..." style={{ ...inputStyle, flex: 2 }} />
              <button onClick={addMedia} style={smallBtn}>Add</button>
            </div>
            <div style={gridStyle}>
              {media.length === 0 && <p style={{ color: '#555' }}>No media yet.</p>}
              {media.map(m => (
                <div key={m.id} style={mediaCard}>
                  <div style={{ fontSize: '1.5rem' }}>{m.type === 'image' ? '🖼️' : m.type === 'pdf' ? '📄' : '🔗'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{m.title || 'Untitled'}</div>
                    <a href={m.url} target="_blank" rel="noreferrer" style={{ color: '#7c6fcd', fontSize: '0.8rem', wordBreak: 'break-all' }}>{m.url}</a>
                  </div>
                  <button onClick={() => deleteMedia(m.id)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const pageStyle = { minHeight: '100vh', background: '#0f0f0f', color: 'white', fontFamily: 'sans-serif' }
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', borderBottom: '1px solid #222', position: 'sticky', top: 0, background: '#0f0f0f', zIndex: 10 }
const contentStyle = { padding: '2rem', maxWidth: '900px', margin: '0 auto' }
const backBtn = { color: '#888', textDecoration: 'none' }
const tabBtn = { background: 'none', border: 'none', color: '#666', padding: '1rem 1.5rem', cursor: 'pointer', fontSize: '0.9rem', borderBottom: '2px solid transparent' }
const activeTab = { color: '#7c6fcd', borderBottom: '2px solid #7c6fcd' }
const inputStyle = { flex: 1, padding: '0.65rem 1rem', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: 'white', fontSize: '0.95rem' }
const smallBtn = { padding: '0.65rem 1.2rem', background: '#7c6fcd', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }
const todoItem = { display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#1a1a1a', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #2a2a2a' }
const noteItem = { display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: '#1a1a1a', padding: '1rem', borderRadius: '8px', border: '1px solid #2a2a2a' }
const mediaCard = { display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: '#1a1a1a', padding: '1rem', borderRadius: '8px', border: '1px solid #2a2a2a' }
const gridStyle = { display: 'flex', flexDirection: 'column', gap: '0.75rem' }
const folderBtn = { background: '#1a1a1a', border: '1px solid #333', color: '#888', padding: '0.3rem 0.8rem', borderRadius: '999px', cursor: 'pointer', fontSize: '0.85rem' }
const activeFolder = { background: '#7c6fcd', color: 'white', border: '1px solid #7c6fcd' }
const loadingStyle = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f0f', color: 'white', fontFamily: 'sans-serif' }