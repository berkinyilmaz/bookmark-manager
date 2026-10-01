import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import './styles.css'

const STORAGE_KEY = 'bookmark-manager-v1'

const SORTS = [
  { id: 'recent', label: 'Recent' },
  { id: 'title', label: 'Title' },
  { id: 'domain', label: 'Domain' },
]

const HOUR = 3600000

/* Sample set for trying the app out — loaded by the "Demo" button. */
const DEMO_BOOKMARKS = [
  { url: 'https://react.dev/learn',                 title: 'React — Learn',        tags: ['dev', 'docs', 'frontend'], favorite: true,  age: 2 },
  { url: 'https://vite.dev/guide/',                 title: 'Vite Guide',           tags: ['dev', 'tooling'],          favorite: false, age: 9 },
  { url: 'https://developer.mozilla.org/en-US/docs/Web/CSS', title: 'MDN — CSS Reference', tags: ['docs', 'css'],     favorite: true,  age: 26 },
  { url: 'https://www.figma.com/community',         title: 'Figma Community',      tags: ['design', 'inspiration'],   favorite: false, age: 48 },
  { url: 'https://dribbble.com/shots',              title: 'Dribbble Shots',       tags: ['design', 'inspiration'],   favorite: false, age: 72 },
  { url: 'https://fonts.google.com',                title: 'Google Fonts',         tags: ['design', 'typography'],    favorite: false, age: 120 },
  { url: 'https://caniuse.com',                     title: 'Can I Use',            tags: ['dev', 'reference'],        favorite: true,  age: 168 },
  { url: 'https://news.ycombinator.com',            title: 'Hacker News',          tags: ['reading'],                 favorite: false, age: 340 },
]

/* ─── Helpers ───────────────────────────────────── */

function loadBookmarks() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

function normalizeUrl(input) {
  const trimmed = input.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0]
  }
}

function isValidUrl(url) {
  try {
    const parsed = new URL(url)
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.includes('.')
  } catch {
    return false
  }
}

function titleFromUrl(url) {
  const domain = getDomain(url)
  const name = domain.split('.')[0]
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function parseTags(input) {
  return [...new Set(
    input
      .split(/[,\n]/)
      .map(t => t.trim().toLowerCase().replace(/^#/, ''))
      .filter(Boolean)
      .slice(0, 8)
  )]
}

function formatRelative(ts) {
  const diff = Date.now() - ts
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/* ─── Icons (thin-line, stroke 1.6) ─────────────── */

const svg = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }

const IconSearch = () => <svg {...svg}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
const IconX = () => <svg {...svg}><path d="M18 6L6 18M6 6l12 12" /></svg>
const IconPlus = () => <svg {...svg}><path d="M12 5v14M5 12h14" /></svg>
const IconStar = ({ filled }) => <svg {...svg} fill={filled ? 'currentColor' : 'none'}><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z" /></svg>
const IconCopy = () => <svg {...svg}><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15V6.5A2.5 2.5 0 017.5 4H15" /></svg>
const IconCheck = () => <svg {...svg}><path d="M4 12.5l5 5L20 6.5" /></svg>
const IconTrash = () => <svg {...svg}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
const IconEdit = () => <svg {...svg}><path d="M4 20h4l10-10-4-4L4 16v4zM14 6l4 4" /></svg>
const IconExternal = () => <svg {...svg}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" /></svg>
const IconBookmark = () => <svg {...svg}><path d="M6 4h12v17l-6-4.5L6 21V4z" /></svg>
const IconDownload = () => <svg {...svg}><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M4 19h16" /></svg>
const IconUpload = () => <svg {...svg}><path d="M12 16V5M7.5 9.5L12 5l4.5 4.5M4 19h16" /></svg>
const IconSparkle = () => <svg {...svg}><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z" /></svg>
const IconReset = () => <svg {...svg}><path d="M4 11a8 8 0 1113.3 6M4 11V5M4 11h6" /></svg>

/* ─── App ───────────────────────────────────────── */

export default function App() {
  const [bookmarks, setBookmarks] = useState(loadBookmarks)
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState('all')
  const [sort, setSort] = useState('recent')
  const [favOnly, setFavOnly] = useState(false)

  const [formUrl, setFormUrl] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formTags, setFormTags] = useState('')
  const [formError, setFormError] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editTags, setEditTags] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const searchRef = useRef(null)
  const urlRef = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
  }, [bookmarks])

  useEffect(() => {
    const onKey = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'Escape') {
        if (document.activeElement === searchRef.current) setQuery('')
        setEditingId(null)
        setConfirmReset(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* ─── Derived ─── */

  const tags = useMemo(() => {
    const counts = new Map()
    bookmarks.forEach(b => b.tags.forEach(t => counts.set(t, (counts.get(t) ?? 0) + 1)))
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  }, [bookmarks])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = bookmarks.filter(b => {
      if (favOnly && !b.favorite) return false
      if (activeTag !== 'all' && !b.tags.includes(activeTag)) return false
      if (!q) return true
      return (
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q) ||
        b.tags.some(t => t.includes(q))
      )
    })
    list = [...list]
    if (sort === 'title') list.sort((a, b) => a.title.localeCompare(b.title))
    else if (sort === 'domain') list.sort((a, b) => getDomain(a.url).localeCompare(getDomain(b.url)) || a.title.localeCompare(b.title))
    else list.sort((a, b) => b.createdAt - a.createdAt)
    return list
  }, [bookmarks, query, activeTag, sort, favOnly])

  const favCount = useMemo(() => bookmarks.filter(b => b.favorite).length, [bookmarks])

  /* ─── Actions ─── */

  const addBookmark = useCallback(e => {
    e.preventDefault()
    const url = normalizeUrl(formUrl)
    if (!url) {
      setFormError('Enter a URL to save.')
      urlRef.current?.focus()
      return
    }
    if (!isValidUrl(url)) {
      setFormError('That does not look like a valid URL.')
      urlRef.current?.focus()
      return
    }
    if (bookmarks.some(b => b.url === url)) {
      setFormError('This link is already saved.')
      return
    }
    setBookmarks(prev => [{
      id: crypto.randomUUID(),
      url,
      title: formTitle.trim() || titleFromUrl(url),
      tags: parseTags(formTags),
      favorite: false,
      createdAt: Date.now(),
    }, ...prev])
    setFormUrl('')
    setFormTitle('')
    setFormTags('')
    setFormError('')
    urlRef.current?.focus()
  }, [formUrl, formTitle, formTags, bookmarks])

  const removeBookmark = useCallback(id => {
    setBookmarks(prev => prev.filter(b => b.id !== id))
    setEditingId(cur => (cur === id ? null : cur))
  }, [])

  const toggleFavorite = useCallback(id => {
    setBookmarks(prev => prev.map(b => (b.id === id ? { ...b, favorite: !b.favorite } : b)))
  }, [])

  const copyUrl = useCallback(async bookmark => {
    try {
      await navigator.clipboard.writeText(bookmark.url)
      setCopiedId(bookmark.id)
      setTimeout(() => setCopiedId(cur => (cur === bookmark.id ? null : cur)), 1400)
    } catch {
      /* clipboard unavailable */
    }
  }, [])

  const startEdit = useCallback(bookmark => {
    setEditingId(bookmark.id)
    setEditTitle(bookmark.title)
    setEditTags(bookmark.tags.join(', '))
  }, [])

  const saveEdit = useCallback(e => {
    e.preventDefault()
    setBookmarks(prev => prev.map(b => (
      b.id === editingId
        ? { ...b, title: editTitle.trim() || b.title, tags: parseTags(editTags) }
        : b
    )))
    setEditingId(null)
  }, [editingId, editTitle, editTags])

  const loadDemo = useCallback(() => {
    const now = Date.now()
    setBookmarks(prev => {
      const seen = new Set(prev.map(b => b.url))
      const fresh = DEMO_BOOKMARKS
        .filter(b => !seen.has(b.url))
        .map(b => ({
          id: crypto.randomUUID(),
          url: b.url,
          title: b.title,
          tags: b.tags,
          favorite: b.favorite,
          createdAt: now - b.age * HOUR,
        }))
      return [...prev, ...fresh]
    })
    setQuery('')
    setActiveTag('all')
    setFavOnly(false)
    setFormError('')
    setConfirmReset(false)
  }, [])

  const resetAll = useCallback(() => {
    setBookmarks([])
    setQuery('')
    setActiveTag('all')
    setFavOnly(false)
    setEditingId(null)
    setFormError('')
    setConfirmReset(false)
  }, [])

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(bookmarks, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookmarks-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [bookmarks])

  const importJson = useCallback(event => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        if (!Array.isArray(parsed)) throw new Error('bad shape')
        const cleaned = parsed
          .filter(b => b && typeof b.url === 'string' && isValidUrl(b.url))
          .map(b => ({
            id: crypto.randomUUID(),
            url: b.url,
            title: typeof b.title === 'string' && b.title.trim() ? b.title.trim() : titleFromUrl(b.url),
            tags: Array.isArray(b.tags) ? parseTags(b.tags.join(',')) : [],
            favorite: Boolean(b.favorite),
            createdAt: Number(b.createdAt) || Date.now(),
          }))
        setBookmarks(prev => {
          const seen = new Set(prev.map(b => b.url))
          return [...prev, ...cleaned.filter(b => !seen.has(b.url))]
        })
      } catch {
        setFormError('Import failed — expected a bookmarks JSON file.')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }, [])

  /* ─── Render ─── */

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="header-left">
            <div>
              <h1 className="header-title">Bookmark Manager</h1>
              <p className="header-sub">Save, tag & find your links</p>
            </div>
          </div>
          <div className="header-right">
            <div className="search-wrap">
              <span className="search-icon"><IconSearch /></span>
              <input
                ref={searchRef}
                type="search"
                className="search-input"
                placeholder="Search… ⌘K"
                value={query}
                onChange={e => setQuery(e.target.value)}
                aria-label="Search bookmarks"
              />
              {query && (
                <button type="button" className="search-clear" onClick={() => setQuery('')} aria-label="Clear search">
                  <IconX />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        {/* Add form */}
        <form className="add-card" onSubmit={addBookmark}>
          <div className="section-label">Add a bookmark</div>
          <div className="add-row">
            <input
              ref={urlRef}
              type="text"
              className="field field-url"
              placeholder="https://example.com"
              value={formUrl}
              onChange={e => { setFormUrl(e.target.value); setFormError('') }}
              aria-label="Bookmark URL"
              spellCheck="false"
            />
            <button type="submit" className="btn-primary add-btn" aria-label="Save bookmark">
              <IconPlus />
              Save
            </button>
          </div>
          <div className="add-row add-row-meta">
            <input
              type="text"
              className="field"
              placeholder="Title (optional)"
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              aria-label="Bookmark title"
            />
            <input
              type="text"
              className="field"
              placeholder="Tags — comma separated"
              value={formTags}
              onChange={e => setFormTags(e.target.value)}
              aria-label="Bookmark tags"
            />
          </div>
          {formError && <p className="error-text" role="alert">{formError}</p>}
        </form>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat">
            <span className="stat-value">{bookmarks.length}</span>
            <span className="stat-label">Saved</span>
          </div>
          <div className="stat">
            <span className="stat-value">{tags.length}</span>
            <span className="stat-label">Tags</span>
          </div>
          <div className="stat">
            <span className="stat-value">{favCount}</span>
            <span className="stat-label">Starred</span>
          </div>
          <div className="stats-actions">
            <button type="button" className="btn-ghost" onClick={loadDemo} aria-label="Load demo bookmarks">
              <IconSparkle />
              Demo
            </button>
            <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()} aria-label="Import bookmarks from JSON">
              <IconUpload />
              Import
            </button>
            <button type="button" className="btn-ghost" onClick={exportJson} disabled={!bookmarks.length} aria-label="Export bookmarks as JSON">
              <IconDownload />
              Export
            </button>
            {confirmReset ? (
              <span className="confirm-group" role="group" aria-label="Confirm reset">
                <button type="button" className="btn-ghost danger" onClick={resetAll} aria-label="Confirm — delete all bookmarks">
                  Delete all
                </button>
                <button type="button" className="btn-ghost" onClick={() => setConfirmReset(false)}>
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setConfirmReset(true)}
                disabled={!bookmarks.length}
                aria-label="Reset — delete all bookmarks"
              >
                <IconReset />
                Reset
              </button>
            )}
            <input ref={fileRef} type="file" accept="application/json" className="file-hidden" onChange={importJson} tabIndex={-1} aria-hidden="true" />
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <div className="tag-scroll" role="group" aria-label="Filter by tag">
            <button
              type="button"
              className={`tag-chip${activeTag === 'all' ? ' active' : ''}`}
              onClick={() => setActiveTag('all')}
              aria-pressed={activeTag === 'all'}
            >
              All
              <span className="tag-count">{bookmarks.length}</span>
            </button>
            {tags.map(([tag, count]) => (
              <button
                key={tag}
                type="button"
                className={`tag-chip${activeTag === tag ? ' active' : ''}`}
                onClick={() => setActiveTag(cur => (cur === tag ? 'all' : tag))}
                aria-pressed={activeTag === tag}
              >
                #{tag}
                <span className="tag-count">{count}</span>
              </button>
            ))}
          </div>

          <div className="filter-right">
            <button
              type="button"
              className={`star-filter${favOnly ? ' active' : ''}`}
              onClick={() => setFavOnly(v => !v)}
              aria-pressed={favOnly}
              aria-label="Show starred only"
            >
              <IconStar filled={favOnly} />
            </button>
            <div className="segment" role="group" aria-label="Sort bookmarks">
              {SORTS.map(option => (
                <button
                  key={option.id}
                  type="button"
                  className={`segment-btn${sort === option.id ? ' active' : ''}`}
                  onClick={() => setSort(option.id)}
                  aria-pressed={sort === option.id}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List */}
        {visible.length === 0 ? (
          <div className="empty">
            <span className="empty-icon"><IconBookmark /></span>
            <p className="empty-title">
              {bookmarks.length === 0 ? 'No bookmarks yet' : 'Nothing matches that filter'}
            </p>
            <p className="empty-sub">
              {bookmarks.length === 0
                ? 'Paste a link above, or load a demo set to look around.'
                : 'Try a different tag or clear the search.'}
            </p>
            {bookmarks.length === 0 && (
              <button type="button" className="btn-ghost empty-cta" onClick={loadDemo}>
                <IconSparkle />
                Load demo data
              </button>
            )}
          </div>
        ) : (
          <ul className="bookmark-grid">
            {visible.map(bookmark => {
              const domain = getDomain(bookmark.url)
              const editing = editingId === bookmark.id
              return (
                <li key={bookmark.id} className={`bookmark-card${editing ? ' editing' : ''}`}>
                  {editing ? (
                    <form className="edit-form" onSubmit={saveEdit}>
                      <input
                        type="text"
                        className="field"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        aria-label="Edit title"
                        autoFocus
                      />
                      <input
                        type="text"
                        className="field"
                        value={editTags}
                        onChange={e => setEditTags(e.target.value)}
                        placeholder="Tags — comma separated"
                        aria-label="Edit tags"
                      />
                      <div className="edit-actions">
                        <button type="button" className="btn-ghost" onClick={() => setEditingId(null)}>Cancel</button>
                        <button type="submit" className="btn-primary">Save</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="card-head">
                        <span className="favicon" aria-hidden="true">{domain.charAt(0).toUpperCase()}</span>
                        <div className="card-titles">
                          <a
                            className="card-title"
                            href={bookmark.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={bookmark.title}
                          >
                            {bookmark.title}
                            <span className="card-title-icon"><IconExternal /></span>
                          </a>
                          <span className="card-domain" title={bookmark.url}>{domain}</span>
                        </div>
                        <button
                          type="button"
                          className={`icon-btn star${bookmark.favorite ? ' active' : ''}`}
                          onClick={() => toggleFavorite(bookmark.id)}
                          aria-pressed={bookmark.favorite}
                          aria-label={bookmark.favorite ? `Unstar ${bookmark.title}` : `Star ${bookmark.title}`}
                        >
                          <IconStar filled={bookmark.favorite} />
                        </button>
                      </div>

                      {bookmark.tags.length > 0 && (
                        <div className="card-tags">
                          {bookmark.tags.map(tag => (
                            <button
                              key={tag}
                              type="button"
                              className="card-tag"
                              onClick={() => setActiveTag(tag)}
                              aria-label={`Filter by tag ${tag}`}
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="card-foot">
                        <span className="card-date">{formatRelative(bookmark.createdAt)}</span>
                        <div className="card-actions">
                          <button
                            type="button"
                            className={`icon-btn${copiedId === bookmark.id ? ' copied' : ''}`}
                            onClick={() => copyUrl(bookmark)}
                            aria-label={`Copy link for ${bookmark.title}`}
                          >
                            {copiedId === bookmark.id ? <IconCheck /> : <IconCopy />}
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => startEdit(bookmark)}
                            aria-label={`Edit ${bookmark.title}`}
                          >
                            <IconEdit />
                          </button>
                          <button
                            type="button"
                            className="icon-btn danger"
                            onClick={() => removeBookmark(bookmark.id)}
                            aria-label={`Delete ${bookmark.title}`}
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </main>

      <footer className="credit">
        Coded by{' '}
        <a href="https://instagram.com/berkindev" target="_blank" rel="noopener noreferrer" className="credit-link">
          berkindev
        </a>
      </footer>
    </div>
  )
}
