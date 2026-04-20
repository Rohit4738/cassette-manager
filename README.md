# 📼 Cassette Manager

Your personal study tool. Subjects, tasks, deadlines and notes — all in one place.

🔗 [cassette-manager.vercel.app](https://cassette-manager.vercel.app)

---

## What it does

- **Subjects** — create a subject per course, add notes, files and tasks
- **To-Do Lists** — folders, checkboxes, live progress bar per subject  
- **Event Calendar** — deadlines, events, reminders 7 and 5 days before due
- **Notes** — quick points per subject, convertible to tasks
- **10 Themes** — colour themes inspired by iconic characters, saved to your account

## Tech

Next.js · Supabase · Google OAuth · Vercel

## Run locally

```bash
git clone https://github.com/Rohit4738/cassette-manager.git
cd cassette-manager
npm install
```

Add `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

```bash
npm run dev
```

---

Built by [Rohit4738](https://github.com/Rohit4738)