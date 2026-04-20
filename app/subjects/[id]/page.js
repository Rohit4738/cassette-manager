'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, CheckSquare, Square, FolderPlus, Folder, FileText, Image, Film, File, Link as LinkIcon, X, Upload, Edit2 } from 'lucide-react'

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

  // media edit state (THE IMPORTANT PART YOU KEPT BREAKING)
  const [editingMedia, setEditingMedia] = useState(null)
  const [editMediaName, setEditMediaName] = useState('')
  const [editMediaDesc, setEditMediaDesc] = useState('')

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

      const [{ data: sub }, { data: md }, { data: mf }] = await Promise.all([
        supabase.from('subjects').select('*').eq('id', id).single(),
        supabase.from('media').select('*').eq('subject_id', id).order('created_at'),
        supabase.from('media_folders').select('*').eq('subject_id', id),
      ])

      setSubject(sub)
      setMedia(md || [])
      setMediaFolders(mf || [])
      setLoading(false)
    }
    load()
  }, [id])

  const handleFileUpload = async (files) => {
    if (!files?.length) return
    setUploading(true)

    for (const file of files) {
      const path = `${userId}/${id}/${Date.now()}_${file.name}`

      const { error } = await supabase.storage.from('media').upload(path, file)
      if (error) continue

      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)

      let type = 'file'
      if (file.type.startsWith('image/')) type = 'image'
      else if (file.type.startsWith('video/')) type = 'video'
      else if (file.type === 'application/pdf') type = 'pdf'

      const { data } = await supabase.from('media').insert({
        subject_id: id,
        user_id: userId,
        type,
        url: publicUrl,
        title: file.name,
        display_name: '',
        description: '',
        folder_id: selectedMediaFolder
      }).select().single()

      setMedia(prev => [...prev, data])
    }

    setUploading(false)
  }

  const saveMediaEdit = async () => {
    await supabase.from('media')
      .update({
        display_name: editMediaName,
        description: editMediaDesc
      })
      .eq('id', editingMedia.id)

    setMedia(media.map(m =>
      m.id === editingMedia.id
        ? { ...m, display_name: editMediaName, description: editMediaDesc }
        : m
    ))

    setEditingMedia(null)
  }

  const deleteMedia = async (item) => {
    await supabase.from('media').delete().eq('id', item.id)
    setMedia(media.filter(m => m.id !== item.id))
  }

  if (loading) return <div>Loading...</div>

  const filteredMedia = selectedMediaFolder
    ? media.filter(m => m.folder_id === selectedMediaFolder)
    : media.filter(m => !m.folder_id)

  return (
    <div style={{ padding: '2rem' }}>

      {/* Upload */}
      <div onClick={() => fileInputRef.current?.click()}
        style={{ border: '2px dashed gray', padding: '2rem', cursor: 'pointer' }}>
        <input ref={fileInputRef} type="file" multiple hidden
          onChange={e => handleFileUpload(e.target.files)} />
        {uploading ? uploadProgress : 'Click to upload'}
      </div>

      {/* Media Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,200px)', gap: '1rem', marginTop: '2rem' }}>
        {filteredMedia.map(item => (
          <div key={item.id} style={{ border: '1px solid #ccc', borderRadius: '10px' }}>
            {item.type === 'image' &&
              <img src={item.url} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
            }

            <div style={{ padding: '.5rem' }}>
              <a href={item.url} target="_blank">
                {item.display_name || item.title}
              </a>

              {item.description && (
                <p style={{ fontSize: '.8rem', color: 'gray' }}>
                  {item.description}
                </p>
              )}

              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => {
                  setEditingMedia(item)
                  setEditMediaName(item.display_name || item.title)
                  setEditMediaDesc(item.description || '')
                }}>
                  <Edit2 size={14} />
                </button>

                <button onClick={() => deleteMedia(item)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT MODAL */}
      {editingMedia && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '300px' }}>
            <h3>Edit File</h3>

            <input
              value={editMediaName}
              onChange={e => setEditMediaName(e.target.value)}
              placeholder="Name"
              style={{ width: '100%', marginBottom: '10px' }}
            />

            <textarea
              value={editMediaDesc}
              onChange={e => setEditMediaDesc(e.target.value)}
              placeholder="Description"
              style={{ width: '100%' }}
            />

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={saveMediaEdit}>Save</button>
              <button onClick={() => setEditingMedia(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}