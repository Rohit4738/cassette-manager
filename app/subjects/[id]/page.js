'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, CheckSquare, Square, FolderPlus, Folder, FileText, Image, Film, File, Link as LinkIcon, X, Upload } from 'lucide-react'

export default function SubjectPage() {
  const router = useRouter()
  const { id } = useParams()
  const [subject, setSubject] = useState(null)
  const [tab, setTab] = useState('todos')
  const [todos, setTodos] = useState([])
  const [folders, setFolders] = useState([])
  const [notes, setNotes] = useState([])
  const [media, setMedia] = useState([])
  const [mediaFolders, setMediaFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)

  // Todo state
  const [newTodo, setNewTodo] = useState('')
  const [newFolder, setNewFolder] = useState('')
  const [selectedFolder, setSelectedFolder] = useState(null)

  // Notes state
  const [newNote, setNewNote] = useState('')
  const [editingNote, setEditingNote] = useState(null)
  const [editNoteContent, setEditNoteContent] = useState('')

  // Media state
  const [selectedMediaFolder, setSelectedMediaFolder] = useState(null)
  const [newMediaFolder, setNewMediaFolder] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      setUserId(session.user.id)

      const { data: prof } = await supabase.from('profiles').select('theme').eq('id', session.user.id).maybeSingle()
      document.documentElement.setAttribute('data-theme', prof?.theme || 'clean-white')

      const [{ data: sub }, { data: td }, { data: fl }, { data: nt }, { data: md }, { data: mf }] = await Promise.all([
        supabase.from('subjects').select('*').eq('id', id).single(),
        supabase.from('todos').select('*').eq('subject_id', id).order('created_at'),
        supabase.from('todo_folders').select('*').eq('subject_id', id),
        supabase.from('notes').select('*').eq('subject_id', id).order('created_at'),
        supabase.from('media').select('*').eq('subject_id', id).order('created_at'),
        supabase.from('media_folders').select('*').eq('subject_id', id),
      ])

      setSubject(sub)
      setTodos(td || [])
      setFolders(fl || [])
      setNotes(nt || [])
      setMedia(md || [])
      setMediaFolders(mf || [])
      setLoading(false)
    }
    load()
  }, [id])

  // ── PROGRESS ──────────────────────────────────
  const totalTodos = todos.length
  const completedTodos = todos.filter(t => t.completed).length
  const progress = totalTodos === 0 ? 0 : Math.round((completedTodos / totalTodos) * 100)

  // ── TODOS ─────────────────────────────────────
  const addTodo = async () => {
    if (!newTodo.trim()) return
    const { data } = await supabase.from('todos').insert({ title: newTodo, subject_id: id, user_id: userId, folder_id: selectedFolder }).select().single()
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
    const { data } = await supabase.from('todo_folders').insert({ name: newFolder, subject_id: id, user_id: userId }).select().single()
    setFolders([...folders, data])
    setNewFolder('')
  }

  const deleteFolder = async (folderId) => {
    if (!confirm('Delete this folder and all its tasks?')) return
    await supabase.from('todo_folders').delete().eq('id', folderId)
    setFolders(folders.filter(f => f.id !== folderId))
    setTodos(todos.filter(t => t.folder_id !== folderId))
    if (selectedFolder === folderId) setSelectedFolder(null)
  }

  // ── NOTES ─────────────────────────────────────
  const addNote = async () => {
    if (!newNote.trim()) return
    const { data } = await supabase.from('notes').insert({ content: newNote, subject_id: id, user_id: userId }).select().single()
    setNotes([...notes, data])
    setNewNote('')
  }

  const saveNote = async (noteId) => {
    await supabase.from('notes').update({ content: editNoteContent }).eq('id', noteId)
    setNotes(notes.map(n => n.id === noteId ? { ...n, content: editNoteContent } : n))
    setEditingNote(null)
  }

  const deleteNote = async (noteId) => {
    await supabase.from('notes').delete().eq('id', noteId)
    setNotes(notes.filter(n => n.id !== noteId))
  }

  // ── MEDIA ─────────────────────────────────────
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return
    setUploading(true)

    for (const file of files) {
      setUploadProgress(`Uploading ${file.name}...`)
      const ext = file.name.split('.').pop()
      const path = `${userId}/${id}/${Date.now()}_${file.name}`

      const { data: uploadData, error } = await supabase.storage.from('media').upload(path, file)
      if (error) { console.error(error); continue }

      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)

      let type = 'file'
      if (file.type.startsWith('image/')) type = 'image'
      else if (file.type.startsWith('video/')) type = 'video'
      else if (file.type === 'application/pdf') type = 'pdf'
      else if (file.type.includes('document') || file.type.includes('word')) type = 'doc'

      const { data } = await supabase.from('media').insert({
        subject_id: id, user_id: userId,
        type, url: publicUrl, title: file.name,
        folder_id: selectedMediaFolder
      }).select().single()

      setMedia(prev => [...prev, data])
    }

    setUploading(false)
    setUploadProgress('')
  }

  const addMediaFolder = async () => {
    if (!newMediaFolder.trim()) return
    const { data } = await supabase.from('media_folders').insert({ name: newMediaFolder, subject_id: id, user_id: userId }).select().single()
    setMediaFolders([...mediaFolders, data])
    setNewMediaFolder('')
  }

  const deleteMedia = async (item) => {
    // Delete from storage if it's an uploaded file
    if (item.url.includes('supabase')) {
      const path = item.url.split('/media/')[1]
      if (path) await supabase.storage.from('media').remove([path])
    }
    await supabase.from('media').delete().eq('id', item.id)
    setMedia(media.filter(m => m.id !== item.id))
  }

  const deleteMediaFolder = async (folderId) => {
    if (!confirm('Delete this folder? Files inside will be moved to root.')) return
    await supabase.from('media_folders').delete().eq('id', folderId)
    setMediaFolders(mediaFolders.filter(f => f.id !== folderId))
    setMedia(media.map(m => m.folder_id === folderId ? { ...m, folder_id: null } : m))
    if (selectedMediaFolder === folderId) setSelectedMediaFolder(null)
  }

  const getMediaIcon = (type) => {
    if (type === 'image') return <Image size={18} color="var(--accent)" />
    if (type === 'video') return <Film size={18} color="#7c3aed" />
    if (type === 'pdf') return <FileText size={18} color="#dc2626" />
    if (type === 'doc') return <File size={18} color="#2563eb" />
    return <LinkIcon size={18} color="var(--muted)" />
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif' }}>
      <p style={{ color: 'var(--muted)', fontWeight: 600 }}>Loading...</p>
    </div>
  )

  const filteredTodos = selectedFolder
    ? todos.filter(t => t.folder_id === selectedFolder)
    : todos.filter(t => !t.folder_id)

  const filteredMedia = selectedMediaFolder
    ? media.filter(m => m.folder_id === selectedMediaFolder)
    : media.filter(m => !m.folder_id)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Nunito, sans-serif', color: 'var(--text)' }}>

      {/* Nav */}
      <nav style={{ background: 'var(--surface)', borderBottom: '2px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <Link href="/subjects" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', color: 'var(--muted)', fontWeight: 700, fontSize: '.88rem' }}>
            <ArrowLeft size={16} /> Subjects
          </Link>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: '1rem' }}>{subject?.name}</div>
            {subject?.professor && <div style={{ color: 'var(--muted)', fontSize: '.75rem', fontWeight: 600 }}>Prof. {subject.professor}</div>}
          </div>
          <div style={{ width: '80px' }} />
        </div>
      </nav>

      {/* Progress bar */}
      <div style={{ background: 'var(--surface)', borderBottom: '2px solid var(--border)', padding: '1rem 1.5rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.4rem' }}>
            <span style={{ color: 'var(--muted)', fontSize: '.82rem', fontWeight: 700 }}>Progress</span>
            <span style={{ fontWeight: 900, fontSize: '.82rem', color: 'var(--accent)' }}>{progress}% · {completedTodos}/{totalTodos} tasks</span>
          </div>
          <div className="progress-track" style={{ height: '8px' }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'var(--surface)', borderBottom: '2px solid var(--border)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', gap: '.25rem' }}>
          {[
            { key: 'todos', label: 'To-Do' },
            { key: 'notes', label: 'Notes' },
            { key: 'media', label: 'Media' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '.85rem 1.2rem', background: 'none', border: 'none', fontWeight: 800, fontSize: '.88rem', cursor: 'pointer', color: tab === t.key ? 'var(--accent)' : 'var(--muted)', borderBottom: `2px solid ${tab === t.key ? 'var(--accent)' : 'transparent'}`, marginBottom: '-2px', transition: 'color .15s' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* ── TODOS TAB ── */}
        {tab === 'todos' && (
          <div>
            {/* Folder tabs */}
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
              <button onClick={() => setSelectedFolder(null)} style={{ display: 'flex', alignItems: 'center', gap: '.3rem', padding: '.4rem .9rem', borderRadius: '99px', border: '2px solid', borderColor: selectedFolder === null ? 'var(--accent)' : 'var(--border)', background: selectedFolder === null ? 'var(--accent-light)' : 'var(--surface)', color: selectedFolder === null ? 'var(--accent)' : 'var(--text2)', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer' }}>
                All tasks
              </button>
              {folders.map(f => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '.2rem' }}>
                  <button onClick={() => setSelectedFolder(f.id)} style={{ display: 'flex', alignItems: 'center', gap: '.3rem', padding: '.4rem .9rem', borderRadius: '99px', border: '2px solid', borderColor: selectedFolder === f.id ? 'var(--accent)' : 'var(--border)', background: selectedFolder === f.id ? 'var(--accent-light)' : 'var(--surface)', color: selectedFolder === f.id ? 'var(--accent)' : 'var(--text2)', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer' }}>
                    <Folder size={13} /> {f.name}
                  </button>
                  <button onClick={() => deleteFolder(f.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '.2rem', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
                    <X size={13} />
                  </button>
                </div>
              ))}

              {/* Add folder inline */}
              <div style={{ display: 'flex', gap: '.4rem' }}>
                <input value={newFolder} onChange={e => setNewFolder(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFolder()} placeholder="New folder..." style={{ padding: '.4rem .8rem', border: '2px solid var(--border)', borderRadius: '99px', background: 'var(--surface2)', color: 'var(--text)', fontSize: '.82rem', outline: 'none', width: '130px' }} />
                <button onClick={addFolder} style={{ display: 'flex', alignItems: 'center', gap: '.3rem', padding: '.4rem .8rem', borderRadius: '99px', background: 'var(--surface)', border: '2px solid var(--border)', color: 'var(--text2)', fontWeight: 700, fontSize: '.78rem', cursor: 'pointer' }}>
                  <FolderPlus size={13} /> Add
                </button>
              </div>
            </div>

            {/* Add todo */}
            <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1.5rem' }}>
              <input value={newTodo} onChange={e => setNewTodo(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTodo()} placeholder={selectedFolder ? `Add task to "${folders.find(f => f.id === selectedFolder)?.name}"...` : 'Add a task...'} className="input-field" />
              <button onClick={addTodo} className="btn-primary" style={{ padding: '.7rem 1.2rem', borderRadius: '12px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                <Plus size={16} /> Add
              </button>
            </div>

            {/* Todo list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
              {filteredTodos.length === 0 && (
                <div style={{ border: '2px dashed var(--border2)', borderRadius: '16px', padding: '2.5rem', textAlign: 'center', color: 'var(--muted)', fontWeight: 600 }}>
                  No tasks yet. Add one above!
                </div>
              )}
              {filteredTodos.map(todo => (
                <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '.9rem', background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: '14px', padding: '.8rem 1.1rem', transition: 'border-color .15s' }}>
                  <button onClick={() => toggleTodo(todo)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: todo.completed ? 'var(--accent)' : 'var(--border2)', display: 'flex', flexShrink: 0 }}>
                    {todo.completed ? <CheckSquare size={20} /> : <Square size={20} />}
                  </button>
                  <span style={{ flex: 1, fontWeight: 600, textDecoration: todo.completed ? 'line-through' : 'none', color: todo.completed ? 'var(--muted)' : 'var(--text)' }}>{todo.title}</span>
                  <button onClick={() => deleteTodo(todo.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: '.2rem', borderRadius: '6px' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#c0392b'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── NOTES TAB ── */}
        {tab === 'notes' && (
          <div>
            <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1.5rem' }}>
              <input value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNote()} placeholder="Add a note..." className="input-field" />
              <button onClick={addNote} className="btn-primary" style={{ padding: '.7rem 1.2rem', borderRadius: '12px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                <Plus size={16} /> Add
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {notes.length === 0 && (
                <div style={{ border: '2px dashed var(--border2)', borderRadius: '16px', padding: '2.5rem', textAlign: 'center', color: 'var(--muted)', fontWeight: 600 }}>
                  No notes yet. Add one above!
                </div>
              )}
              {notes.map(note => (
                <div key={note.id} style={{ background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: '14px', padding: '1rem 1.2rem' }}>
                  {editingNote === note.id ? (
                    <div style={{ display: 'flex', gap: '.6rem', flexDirection: 'column' }}>
                      <textarea value={editNoteContent} onChange={e => setEditNoteContent(e.target.value)} style={{ width: '100%', minHeight: '80px', padding: '.7rem', border: '2px solid var(--accent)', borderRadius: '10px', background: 'var(--surface2)', color: 'var(--text)', fontSize: '.9rem', resize: 'vertical', outline: 'none', fontFamily: 'Nunito, sans-serif' }} />
                      <div style={{ display: 'flex', gap: '.5rem' }}>
                        <button onClick={() => saveNote(note.id)} className="btn-primary" style={{ padding: '.45rem 1rem', borderRadius: '8px', fontSize: '.82rem' }}>Save</button>
                        <button onClick={() => setEditingNote(null)} style={{ padding: '.45rem 1rem', borderRadius: '8px', border: '2px solid var(--border)', background: 'var(--surface)', color: 'var(--text2)', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.9rem' }}>
                      <p style={{ flex: 1, fontWeight: 600, lineHeight: 1.6, margin: 0 }}>{note.content}</p>
                      <div style={{ display: 'flex', gap: '.3rem', flexShrink: 0 }}>
                        <button onClick={() => { setEditingNote(note.id); setEditNoteContent(note.content) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '.2rem', borderRadius: '6px', display: 'flex' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
                        >
                          <FileText size={15} />
                        </button>
                        <button onClick={() => deleteNote(note.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '.2rem', borderRadius: '6px', display: 'flex' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#c0392b'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MEDIA TAB ── */}
        {tab === 'media' && (
          <div>
            {/* Media folder tabs */}
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
              <button onClick={() => setSelectedMediaFolder(null)} style={{ padding: '.4rem .9rem', borderRadius: '99px', border: '2px solid', borderColor: selectedMediaFolder === null ? 'var(--accent)' : 'var(--border)', background: selectedMediaFolder === null ? 'var(--accent-light)' : 'var(--surface)', color: selectedMediaFolder === null ? 'var(--accent)' : 'var(--text2)', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer' }}>
                All files
              </button>
              {mediaFolders.map(f => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '.2rem' }}>
                  <button onClick={() => setSelectedMediaFolder(f.id)} style={{ display: 'flex', alignItems: 'center', gap: '.3rem', padding: '.4rem .9rem', borderRadius: '99px', border: '2px solid', borderColor: selectedMediaFolder === f.id ? 'var(--accent)' : 'var(--border)', background: selectedMediaFolder === f.id ? 'var(--accent-light)' : 'var(--surface)', color: selectedMediaFolder === f.id ? 'var(--accent)' : 'var(--text2)', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer' }}>
                    <Folder size={13} /> {f.name}
                  </button>
                  <button onClick={() => deleteMediaFolder(f.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '.2rem', borderRadius: '6px', display: 'flex' }}>
                    <X size={13} />
                  </button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '.4rem' }}>
                <input value={newMediaFolder} onChange={e => setNewMediaFolder(e.target.value)} onKeyDown={e => e.key === 'Enter' && addMediaFolder()} placeholder="New folder..." style={{ padding: '.4rem .8rem', border: '2px solid var(--border)', borderRadius: '99px', background: 'var(--surface2)', color: 'var(--text)', fontSize: '.82rem', outline: 'none', width: '130px' }} />
                <button onClick={addMediaFolder} style={{ display: 'flex', alignItems: 'center', gap: '.3rem', padding: '.4rem .8rem', borderRadius: '99px', background: 'var(--surface)', border: '2px solid var(--border)', color: 'var(--text2)', fontWeight: 700, fontSize: '.78rem', cursor: 'pointer' }}>
                  <FolderPlus size={13} /> Add
                </button>
              </div>
            </div>

            {/* Upload area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent)' }}
              onDragLeave={e => e.currentTarget.style.borderColor = 'var(--border2)'}
              onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--border2)'; handleFileUpload(e.dataTransfer.files) }}
              style={{ border: '2.5px dashed var(--border2)', borderRadius: '18px', padding: '2.5rem', textAlign: 'center', cursor: 'pointer', marginBottom: '1.5rem', transition: 'border-color .2s, background .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-light)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'transparent' }}
            >
              <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => handleFileUpload(e.target.files)} />
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '.75rem' }}>
                <Upload size={28} color="var(--muted)" />
              </div>
              {uploading ? (
                <p style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '.9rem' }}>{uploadProgress}</p>
              ) : (
                <>
                  <p style={{ fontWeight: 700, color: 'var(--text2)', marginBottom: '.25rem' }}>Click to upload or drag and drop</p>
                  <p style={{ color: 'var(--muted)', fontSize: '.82rem', fontWeight: 600 }}>Images, Videos, PDFs, Word documents</p>
                </>
              )}
            </div>

            {/* Media grid */}
            {filteredMedia.length === 0 ? (
              <div style={{ border: '2px dashed var(--border2)', borderRadius: '16px', padding: '2.5rem', textAlign: 'center', color: 'var(--muted)', fontWeight: 600 }}>
                No files here yet. Upload something above!
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {filteredMedia.map(item => (
                  <div key={item.id} style={{ background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: '16px', overflow: 'hidden', transition: 'border-color .2s, transform .2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    {/* Preview */}
                    {item.type === 'image' ? (
                      <img src={item.url} alt={item.title} style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block' }} />
                    ) : item.type === 'video' ? (
                      <video src={item.url} style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block' }} controls />
                    ) : (
                      <div style={{ height: '130px', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {getMediaIcon(item.type)}
                      </div>
                    )}
                    <div style={{ padding: '.75rem' }}>
                      <a href={item.url} target="_blank" rel="noreferrer" style={{ fontWeight: 700, fontSize: '.82rem', color: 'var(--text)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '.4rem' }}>
                        {item.title || 'Untitled'}
                      </a>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '.72rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>{item.type}</span>
                        <button onClick={() => deleteMedia(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: '.2rem' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#c0392b'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}