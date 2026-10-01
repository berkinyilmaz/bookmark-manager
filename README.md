# Bookmark Manager
Save your favorite links, tag them, and find any one of them in a second — all stored in your browser.

---

## Live Demo
https://bookmark-manager-lake.vercel.app/

---

## Features
- **Save any link** — paste a URL, the protocol and title are filled in for you
- **Tags** — comma-separated, auto-normalized, max 8 per bookmark
- **Instant search** — matches title, URL and tags as you type (`⌘K` / `Ctrl+K` to focus)
- **Tag filter bar** — one tap to narrow the list, with live counts per tag
- **Star favorites** — flag the links you reach for daily, filter down to just those
- **Sort** — by Recent, Title or Domain
- **Inline edit** — rename a bookmark or retag it without leaving the card
- **One-tap copy** — copy any link to the clipboard
- **Demo data** — one tap fills the app with 8 sample bookmarks so you can look around
- **Reset** — wipe everything with a two-step confirm, no accidental clears
- **Import / Export JSON** — back up your list or move it to another browser, duplicates skipped
- **Duplicate guard** — the same URL can't be saved twice
- Fully responsive (2-column grid → single column on mobile)
- Full keyboard accessibility (focus rings, `aria-*` labels, `Esc` to cancel)
- No authentication
- No tracking
- No ads

---

## Tech Stack
- React 19 (Vite 5)
- CSS custom properties (Apple-inspired dark UI, no framework)
- `localStorage` for persistence
- Inline SVG icons — no icon library
- Vercel-ready static deploy

---

## How It Works
1. Paste a link into the URL field — `example.com` becomes `https://example.com` automatically
2. Add a title and tags if you want (otherwise the domain becomes the title)
3. Hit **Save** — the bookmark lands at the top of the grid
4. Search with `⌘K`, or tap a tag chip to filter
5. Star the links you use most, edit or delete anything inline
6. Use **Export** to download a JSON backup, **Import** to merge one back in
7. Hit **Demo** to try it with sample data, **Reset** to clear the slate

> Everything runs entirely in your browser. No data leaves your machine.

---

## Keyboard Shortcuts
| Shortcut | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Focus search |
| `Esc` | Clear search / cancel inline edit or reset |
| `Enter` | Save the add form or an inline edit |

---

## Data Format
Bookmarks are stored under the `bookmark-manager-v1` key:

```json
[
  {
    "id": "a1b2c3…",
    "url": "https://react.dev",
    "title": "React Docs",
    "tags": ["dev", "docs", "frontend"],
    "favorite": false,
    "createdAt": 1727740800000
  }
]
```

The export file uses the exact same shape, so backups are portable.

---

## Installation
```bash
git clone https://github.com/berkinyilmaz/bookmark-manager.git
cd bookmark-manager
npm install
npm run dev
```

---

## Privacy
Everything runs **locally in your browser**.
Bookmarks are stored in `localStorage`. Nothing is sent anywhere.
# bookmark-manager
