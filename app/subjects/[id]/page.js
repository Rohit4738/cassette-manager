'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, CheckSquare, Square, FolderPlus, Folder, FileText, Image, Film, File, Link as LinkIcon, X, Upload, Edit2, BookOpen } from 'lucide-react'

export default function SubjectPage() {
  const router = useRouter()
  const { id } = useParams()
  const fileInputRef = useRef(null)

  const [subject, setSubject] = useState(null)
  const [tab, setTab] = useState('todos')
  const [todos, setTodos] = useState([])
  const [todoFolders, setTodoFolders] = useState([])
  const [notes, setNotes] = useState([])
  const [media, setMedia] = useState([])
  const [mediaFolders, setMediaFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)

  // Todo state
  const [newTodo, setNewTodo] = useState('')
  const [newTodoFolder, setNewTodoFolder] = useState('')
  const [selectedTodoFolder, setSelectedTodoFolder] = useState(null)

  // Notes state
  const [newNote, setNewNote] = useState('')
  const [editingNote, setEditingNote] = useState(null)
  const [editNoteContent, setEditNoteContent] = useState('')

  // Media state
  const [selectedMediaFolder, setSelectedMediaFolder] = useState(null)
  const [newMediaFolder, setNewMediaFolder] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [editingMedia, setEditingMedia] = useState(null)
  const [editMediaName, setEditMediaName] = useState('')
  const [editMediaDesc, setEditMediaDesc] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      setUserId(session.user.id)

      const { data: prof } = await supabase.from('profiles').select('theme').eq('id', session.user.id).maybeSingle()
      document.documentElement.setAttribute('data-theme', prof?.theme || 'solar-dark')

      const [
        { data: sub },
        { data: td },
        { data: fl },
        { data: nt },
        { data: md },
        { data: mf },
      ] = await Promise.all([
        supabase.from('subjects').select('*').eq('id', id).single(),
        supabase.from('todos').select('*').eq('subject_id', id).order('created_at'),
        supabase.from('todo_folders').select('*').eq('subject_id', id),
        supabase.from('notes').select('*').eq('subject_id', id).order('created_at'),
        supabase.from('media').select('*').eq('subject_id', id).order('created_at'),
        supabase.from('media_folders').select('*').eq('subject_id', id),
      ])

      setSubject(sub)
      setTodos(td || [])
      setTodoFolders(fl || [])
      setNotes(nt || [])
      setMedia(md || [])
      setMediaFolders(mf || [])
      setLoading(false)
    }
    load()
  }, [id])

  // Progress
  const totalTodos = todos.length
  const completedTodos = todos.filter(t => t.completed).length
  const progress = totalTodos === 0 ? 0 : Math.round((completedTodos / totalTodos) * 100)

  // ── TODOS ─────────────────────────────────────
  const addTodo = async () => {
    if (!newTodo.trim()) return
    const { data } = await supabase.from('todos').insert({
      title: newTodo, subject_id: id,
      user_id: userId, folder_id: selectedTodoFolder
    }).select().single()
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

  const addTodoFolder = async () => {
    if (!newTodoFolder.trim()) return
    const { data } = await supabase.from('todo_folders').insert({
      name: newTodoFolder, subject_id: id, user_id: userId
    }).select().single()
    setTodoFolders([...todoFolders, data])
    setNewTodoFolder('')
  }

  const deleteTodoFolder = async (folderId) => {
    if (!confirm('Delete this folder and all its tasks?')) return
    await supabase.from('todo_folders').delete().eq('id', folderId)
    setTodoFolders(todoFolders.filter(f => f.id !== folderId))
    setTodos(todos.filter(t => t.folder_id !== folderId))
    if (selectedTodoFolder === folderId) setSelectedTodoFolder(null)
  }

  // ── NOTES ─────────────────────────────────────
  const addNote = async () => {
    if (!newNote.trim()) return
    const { data } = await supabase.from('notes').insert({
      content: newNote, subject_id: id, user_id: userId
    }).select().single()
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
    for (const file of Array.from(files)) {
      setUploadProgress(`Uploading ${file.name}...`)
      const path = `${userId}/${id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const { error: uploadError } = await supabase.storage.from('media').upload(path, file)
      if (uploadError) { console.error('Upload error:', uploadError); continue }
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
      let type = 'file'
      if (file.type.startsWith('image/')) type = 'image'
      else if (file.type.startsWith('video/')) type = 'video'
      else if (file.type === 'application/pdf') type = 'pdf'
      else if (file.type.includes('document') || file.type.includes('word')) type = 'doc'
      const { data } = await supabase.from('media').insert({
        subject_id: id, user_id: userId,
        type, url: publicUrl,
        title: file.name,
        display_name: '',
        description: '',
        folder_id: selectedMediaFolder
      }).select().single()
      if (data) setMedia(prev => [...prev, data])
    }
    setUploading(false)
    setUploadProgress('')
  }

  const addMediaFolder = async () => {
    if (!newMediaFolder.trim()) return
    const { data } = await supabase.from('media_folders').insert({
      name: newMediaFolder, subject_id: id, user_id: userId
    }).select().single()
    setMediaFolders([...mediaFolders, data])
    setNewMediaFolder('')
  }

  const deleteMediaFolder = async (folderId) => {
    if (!confirm('Delete this folder? Files inside will move to root.')) return
    await supabase.from('media_folders').delete().eq('id', folderId)
    setMediaFolders(mediaFolders.filter(f => f.id !== folderId))
    setMedia(media.map(m => m.folder_id === folderId ? { ...m, folder_id: null } : m))
    if (selectedMediaFolder === folderId) setSelectedMediaFolder(null)
  }

  const deleteMedia = async (item) => {
    if (!confirm('Delete this file?')) return
    try {
      const urlPath = new URL(item.url).pathname
      const storagePath = urlPath.split('/media/')[1]
      if (storagePath) await supabase.storage.from('media').remove([storagePath])
    } catch (e) { console.error(e) }
    await supabase.from('media').delete().eq('id', item.id)
    setMedia(media.filter(m => m.id !== item.id))
  }

  const saveMediaEdit = async () => {
    await supabase.from('media').update({
      display_name: editMediaName,
      description: editMediaDesc
    }).eq('id', editingMedia.id)
    setMedia(media.map(m => m.id === editingMedia.id
      ? { ...m, display_name: editMediaName, description: editMediaDesc }
      : m
    ))
    setEditingMedia(null)
  }

  const getMediaIcon = (type) => {
    if (type === 'image') return <Image size={20} color="var(--accent)" />
    if (type === 'video') return <Film size={20} color="#7c3aed" />
    if (type === 'pdf') return <FileText size={20} color="#dc2626" />
    if (type === 'doc') return <File size={20} color="#2563eb" />
    return <LinkIcon size={20} color="var(--muted)" />
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg,#0a0a0a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="loading-pulse" style={{ width: '52px', height: '52px', background: 'var(--accent,#f0c040)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto .75rem' }}>
          <BookOpen size={24} color="var(--accent-fg,#0a0a0a)" />
        </div>
        <p style={{ color: 'var(--muted,#555)', fontSize: '.88rem' }}>Loading subject...</p>
      </div>
    </div>
  )

  const filteredTodos = selectedTodoFolder
    ? todos.filter(t => t.folder_id === selectedTodoFolder)
    : todos.filter(t => !t.folder_id)

  const filteredMedia = selectedMediaFolder
    ? media.filter(m => m.folder_id === selectedMediaFolder)
    : media.filter(m => !m.folder_id)

  const tabStyle = (t) => ({
    padding: '.75rem 1rem',
    background: 'none',
    border: 'none',
    fontWeight: 700,
    fontSize: '.86rem',
    cursor: 'pointer',
    color: tab === t ? 'var(--accent)' : 'var(--muted)',
    borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
    marginBottom: '-1px',
    transition: 'color .15s',
    whiteSpace: 'nowrap',
  })

  const folderBtnStyle = (active) => ({
    display: 'flex', alignItems: 'center', gap: '.3rem',
    padding: '.35rem .85rem', borderRadius: '99px',
    border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border2)'}`,
    background: active ? 'var(--accent-light)' : 'var(--surface2)',
    color: active ? 'var(--accent)' : 'var(--text2)',
    fontWeight: 600, fontSize: '.78rem', cursor: 'pointer',
    whiteSpace: 'nowrap', transition: 'all .15s',
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter,sans-serif', color: 'var(--text)' }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100, background: 'var(--nav-bg)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>
          <Link href="/subjects" style={{ display: 'flex', alignItems: 'center', gap: '.45rem', color: 'var(--muted)', fontWeight: 500, fontSize: '.86rem' }}>
            <ArrowLeft size={15} /> <span className="hide-mobile">Subjects</span>
          </Link>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{subject?.name}</div>
            {subject?.professor && <div style={{ color: 'var(--muted)', fontSize: '.72rem' }}>Prof. {subject.professor}</div>}
          </div>
          <div style={{ width: '60px' }} />
        </div>
      </nav>

      {/* Progress bar */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '.9rem 1.25rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.4rem' }}>
            <span style={{ color: 'var(--muted)', fontSize: '.75rem', fontWeight: 600 }}>PROGRESS</span>
            <span style={{ fontWeight: 700, fontSize: '.75rem', color: 'var(--accent)' }}>{progress}% · {completedTodos}/{totalTodos} tasks</span>
          </div>
          <div className="progress-track" style={{ height: '6px' }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1.25rem', display: 'flex' }}>
          <button style={tabStyle('todos')} onClick={() => setTab('todos')}>To-Do</button>
          <button style={tabStyle('notes')} onClick={() => setTab('notes')}>Notes</button>
          <button style={tabStyle('media')} onClick={() => setTab('media')}>Media</button>
        </div>
      </div>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.75rem 1.25rem' }}>

        {/* ── TODOS TAB ── */}
        {tab === 'todos' && (
          <div>
            {/* Folder row */}
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
              <button style={folderBtnStyle(selectedTodoFolder === null)} onClick={() => setSelectedTodoFolder(null)}>
                All tasks
              </button>
              {todoFolders.map(f => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '.2rem' }}>
                  <button style={folderBtnStyle(selectedTodoFolder === f.id)} onClick={() => setSelectedTodoFolder(f.id)}>
                    <Folder size={12} /> {f.name}
                  </button>
                  <button onClick={() => deleteTodoFolder(f.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: '.15rem' }}>
                    <X size={12} />
                  </button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
                <input
                  value={newTodoFolder}
                  onChange={e => setNewTodoFolder(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTodoFolder()}
                  placeholder="New folder..."
                  style={{ padding: '.35rem .75rem', border: '1.5px solid var(--border2)', borderRadius: '99px', background: 'var(--surface2)', color: 'var(--text)', fontSize: '.78rem', outline: 'none', width: '120px' }}
                />
                <button onClick={addTodoFolder} style={{ display: 'flex', alignItems: 'center', gap: '.3rem', padding: '.35rem .75rem', borderRadius: '99px', background: 'var(--surface2)', border: '1.5px solid var(--border2)', color: 'var(--text2)', fontWeight: 600, fontSize: '.75rem', cursor: 'pointer' }}>
                  <FolderPlus size={12} /> Add
                </button>
              </div>
            </div>

            {/* Add todo input */}
            <div style={{ display: 'flex', gap: '.65rem', marginBottom: '1.25rem' }}>
              <input
                value={newTodo}
                onChange={e => setNewTodo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTodo()}
                placeholder={selectedTodoFolder ? `Add task to "${todoFolders.find(f => f.id === selectedTodoFolder)?.name}"...` : 'Add a task...'}
                className="input-field"
              />
              <button onClick={addTodo} className="btn-primary" style={{ padding: '.65rem 1.1rem', borderRadius: '12px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                <Plus size={15} /> Add
              </button>
            </div>

            {/* Todo list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {filteredTodos.length === 0 && (
                <div style={{ border: '1px dashed var(--border2)', borderRadius: '16px', padding: '2.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.88rem' }}>
                  No tasks here yet. Add one above!
                </div>
              )}
              {filteredTodos.map(todo => (
                <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '.85rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '.75rem 1rem', transition: 'border-color .15s' }}>
                  <button onClick={() => toggleTodo(todo)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: todo.completed ? 'var(--accent)' : 'var(--border2)', display: 'flex', flexShrink: 0 }}>
                    {todo.completed ? <CheckSquare size={19} /> : <Square size={19} />}
                  </button>
                  <span style={{ flex: 1, fontWeight: 500, fontSize: '.9rem', textDecoration: todo.completed ? 'line-through' : 'none', color: todo.completed ? 'var(--muted)' : 'var(--text)' }}>
                    {todo.title}
                  </span>
                  <button onClick={() => deleteTodo(todo.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: '.2rem', flexShrink: 0 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── NOTES TAB ── */}
        {tab === 'notes' && (
          <div>
            <div style={{ display: 'flex', gap: '.65rem', marginBottom: '1.25rem' }}>
              <input
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addNote()}
                placeholder="Add a note..."
                className="input-field"
              />
              <button onClick={addNote} className="btn-primary" style={{ padding: '.65rem 1.1rem', borderRadius: '12px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                <Plus size={15} /> Add
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
              {notes.length === 0 && (
                <div style={{ border: '1px dashed var(--border2)', borderRadius: '16px', padding: '2.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.88rem' }}>
                  No notes yet. Add one above!
                </div>
              )}
              {notes.map(note => (
                <div key={note.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1rem 1.1rem' }}>
                  {editingNote === note.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                      <textarea
                        value={editNoteContent}
                        onChange={e => setEditNoteContent(e.target.value)}
                        style={{ width: '100%', minHeight: '80px', padding: '.7rem', border: '1.5px solid var(--accent)', borderRadius: '10px', background: 'var(--surface2)', color: 'var(--text)', fontSize: '.9rem', resize: 'vertical', outline: 'none', fontFamily: 'Inter,sans-serif', boxSizing: 'border-box' }}
                      />
                      <div style={{ display: 'flex', gap: '.5rem' }}>
                        <button onClick={() => saveNote(note.id)} className="btn-primary" style={{ padding: '.45rem 1rem', borderRadius: '9px', fontSize: '.82rem' }}>Save</button>
                        <button onClick={() => setEditingNote(null)} className="btn-ghost" style={{ padding: '.45rem 1rem' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.85rem' }}>
                      <p style={{ flex: 1, fontWeight: 500, lineHeight: 1.6, margin: 0, fontSize: '.9rem' }}>{note.content}</p>
                      <div style={{ display: 'flex', gap: '.25rem', flexShrink: 0 }}>
                        <button onClick={() => { setEditingNote(note.id); setEditNoteContent(note.content) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: '.2rem' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => deleteNote(note.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: '.2rem' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
                        >
                          <Trash2 size={14} />
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
            {/* Media folder row */}
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
              <button style={folderBtnStyle(selectedMediaFolder === null)} onClick={() => setSelectedMediaFolder(null)}>
                All files
              </button>
              {mediaFolders.map(f => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '.2rem' }}>
                  <button style={folderBtnStyle(selectedMediaFolder === f.id)} onClick={() => setSelectedMediaFolder(f.id)}>
                    <Folder size={12} /> {f.name}
                  </button>
                  <button onClick={() => deleteMediaFolder(f.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: '.15rem' }}>
                    <X size={12} />
                  </button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
                <input
                  value={newMediaFolder}
                  onChange={e => setNewMediaFolder(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addMediaFolder()}
                  placeholder="New folder..."
                  style={{ padding: '.35rem .75rem', border: '1.5px solid var(--border2)', borderRadius: '99px', background: 'var(--surface2)', color: 'var(--text)', fontSize: '.78rem', outline: 'none', width: '120px' }}
                />
                <button onClick={addMediaFolder} style={{ display: 'flex', alignItems: 'center', gap: '.3rem', padding: '.35rem .75rem', borderRadius: '99px', background: 'var(--surface2)', border: '1.5px solid var(--border2)', color: 'var(--text2)', fontWeight: 600, fontSize: '.75rem', cursor: 'pointer' }}>
                  <FolderPlus size={12} /> Add
                </button>
              </div>
            </div>

            {/* Upload area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-light)' }}
              onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'transparent' }}
              onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'transparent'; handleFileUpload(e.dataTransfer.files) }}
              style={{ border: '2px dashed var(--border2)', borderRadius: '18px', padding: '2.5rem', textAlign: 'center', cursor: 'pointer', marginBottom: '1.5rem', transition: 'border-color .2s, background .2s' }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx"
                style={{ display: 'none' }}
                onChange={e => handleFileUpload(e.target.files)}
              />
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '.75rem' }}>
                <Upload size={26} color="var(--muted)" />
              </div>
              {uploading ? (
                <p style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '.9rem' }}>{uploadProgress}</p>
              ) : (
                <>
                  <p style={{ fontWeight: 600, color: 'var(--text2)', marginBottom: '.25rem', fontSize: '.9rem' }}>Click to upload or drag and drop</p>
                  <p style={{ color: 'var(--muted)', fontSize: '.8rem' }}>Images · Videos · PDFs · Word docs</p>
                </>
              )}
            </div>

            {/* Media grid */}
            {filteredMedia.length === 0 ? (
              <div style={{ border: '1px dashed var(--border2)', borderRadius: '16px', padding: '2.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.88rem' }}>
                No files here yet. Upload something above!
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '.85rem' }}>
                {filteredMedia.map(item => (
                  <div key={item.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', transition: 'border-color .2s, transform .2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    {/* Preview */}
                    {item.type === 'image' ? (
                      <a href={item.url} target="_blank" rel="noreferrer">
                        <img src={item.url} alt={item.display_name || item.title} style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
                      </a>
                    ) : item.type === 'video' ? (
                      <video src={item.url} style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} controls />
                    ) : (
                      <a href={item.url} target="_blank" rel="noreferrer" style={{ display: 'flex', height: '120px', background: 'var(--surface2)', alignItems: 'center', justifyContent: 'center' }}>
                        {getMediaIcon(item.type)}
                      </a>
                    )}

                    <div style={{ padding: '.75rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '.15rem' }}>
                        {item.display_name || item.title || 'Untitled'}
                      </div>
                      {item.description && (
                        <p style={{ fontSize: '.73rem', color: 'var(--muted)', marginBottom: '.35rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '.35rem' }}>
                        <span style={{ fontSize: '.68rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', background: 'var(--surface2)', padding: '.1rem .45rem', borderRadius: '5px' }}>
                          {item.type}
                        </span>
                        <div style={{ display: 'flex', gap: '.25rem' }}>
                          <button
                            onClick={() => { setEditingMedia(item); setEditMediaName(item.display_name || item.title || ''); setEditMediaDesc(item.description || '') }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: '.2rem' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => deleteMedia(item)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: '.2rem' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Edit media modal */}
      {editingMedia && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '1rem' }}>
          <div className="pop-in" style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '22px', padding: '2rem', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1rem' }}>Edit File Info</h3>
              <button onClick={() => setEditingMedia(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>
            <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.4rem', letterSpacing: '.07em' }}>NAME</label>
            <input className="input-field" value={editMediaName} onChange={e => setEditMediaName(e.target.value)} placeholder="Give this file a name..." style={{ marginBottom: '1rem' }} />
            <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.4rem', letterSpacing: '.07em' }}>DESCRIPTION (optional)</label>
            <textarea className="input-field" value={editMediaDesc} onChange={e => setEditMediaDesc(e.target.value)} placeholder="Add a description..." style={{ minHeight: '80px', resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: '.6rem', marginTop: '1.25rem' }}>
              <button className="btn-primary" onClick={saveMediaEdit} style={{ flex: 1, padding: '.75rem' }}>Save</button>
              <button onClick={() => setEditingMedia(null)} className="btn-ghost" style={{ flex: 1, padding: '.75rem', justifyContent: 'center' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}