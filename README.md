<div align="center">

```text
   _____                           _   _        __  __
  / ____|                         | | | |      |  \/  |
 | |     __ _ ___ ___  ___ _ __   | |_| |_ __ _| \  / | __ _ _ __   __ _  __ _  ___ _ __
 | |    / _` / __/ __|/ _ \ '__|  | __| __/ _` | |\/| |/ _` | '_ \ / _` |/ _` |/ _ \ '__|
 | |___| (_| \__ \__ \  __/ |     | |_| || (_| | |  | | (_| | | | | (_| | (_| |  __/ |
  \_____\__,_|___/___/\___|_|      \__|\__\__,_|_|  |_|\__,_|_| |_|\__,_|\__, |\___|_|
                                                                            __/ |
                                                                           |___/
```

### 📼 Cassette Manager

A retro-inspired **student productivity platform** built with Next.js + Supabase for managing subjects, tasks, deadlines, notes, and study resources in one clean workspace.

</div>

---

## ✨ Why this project stands out

Cassette Manager combines product thinking, frontend design, and backend integration in one full-stack app:

- **Authentication flow** with Supabase Auth (signup/login)
- **Subject-centric workspace** for each course
- **Task system with folders** and completion progress tracking
- **Calendar + deadlines** with browser reminder notifications
- **Notes + media links** per subject for quick revision
- **Dashboard analytics** (subjects, events, due-soon indicators)
- **Theme customization** (dark/light + color palettes)

---

## 🧱 Tech Stack

- **Frontend:** Next.js (App Router), React
- **Backend-as-a-Service:** Supabase (Auth + Postgres)
- **Styling:** CSS + design tokens in `app/globals.css`
- **Tooling:** ESLint

---

## 🗂️ Project Structure

```text
app/
  login/              # Auth screen
  dashboard/          # Overview + analytics
  subjects/           # Subject listing + CRUD
  subjects/new/       # Create subject
  subjects/[id]/      # Subject workspace (todos, notes, media)
  calendar/           # Event + deadline planning
  settings/           # Theme preferences
lib/
  supabase.js         # Supabase client initialization
```

---

## 🚀 Getting Started

### 1) Install dependencies

```bash
npm ci
```

### 2) Set environment variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3) Start development server

```bash
npm run dev
```

Then open: `http://localhost:3000`

---

## 🧪 Available Scripts

```bash
npm run dev    # Run local development server
npm run build  # Create production build
npm run start  # Start production server
npm run lint   # Run ESLint
```

---

## 🗃️ Supabase Data Model (high level)

The app expects these core tables:

- `subjects`
- `todos`
- `todo_folders`
- `events`
- `notes`
- `media`

All user-specific data is scoped via `user_id`.

---

## 🎯 Resume-ready highlights

- Designed and shipped a **full-stack productivity SaaS prototype**
- Built **modular feature pages** using Next.js App Router
- Integrated **real-time backend services** using Supabase SDK
- Implemented **multi-entity relational data workflows** (subjects, tasks, events, notes, media)
- Crafted a **custom visual identity** with theme support and polished UI interactions

---

## 📌 Status

Actively evolving. Great base for adding:

- recurring tasks/events
- rich text notes
- attachment uploads
- collaboration features

