# Project Management System — Final Build Plan

> **Stack:** React + TypeScript + Tailwind CSS | Node.js + Express + PostgreSQL + Prisma  
> **Hosting:** Hostinger VPS (Apache) · **UI:** Clean, simple, light theme  
> **File storage:** VPS server local storage · **Avatars:** Auto-generated (no image upload for profiles)

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Database Schema](#database-schema)
3. [Module 1 — Auth & Roles](#module-1--auth--roles)
4. [Module 2 — User Management](#module-2--user-management)
5. [Module 3 — Project Management](#module-3--project-management)
6. [Module 4 — Task Management](#module-4--task-management)
7. [Module 5 — Kanban Board](#module-5--kanban-board)
8. [Module 6 — Comments & File Attachments](#module-6--comments--file-attachments)
9. [Module 7 — Admin Dashboard](#module-7--admin-dashboard)
10. [Module 8 — User Dashboard](#module-8--user-dashboard)
11. [UI Design System](#ui-design-system)
12. [Avatar System](#avatar-system)
13. [File Upload Strategy](#file-upload-strategy)
14. [Folder Structure](#folder-structure)
15. [API Reference](#api-reference)
16. [Build Order](#build-order)
17. [VPS Hosting Guide](#vps-hosting-guide)

---

## Tech Stack

| Layer | Tools |
|-------|-------|
| Frontend | React 18, TypeScript, Tailwind CSS, Redux Toolkit, React Router v6, Axios |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (access 15min + refresh 7d httpOnly cookie), bcrypt |
| File Uploads | Multer → saved to VPS `/uploads/` folder |
| Real-time | Socket.io |
| Process Manager | PM2 (on VPS) |
| Web Server | Apache (reverse proxy to Node) |

---

## Database Schema

### users
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
name          VARCHAR(100) NOT NULL
email         VARCHAR(150) UNIQUE NOT NULL
password_hash VARCHAR(255) NOT NULL
role          ENUM('admin', 'user') DEFAULT 'user'
avatar_color  VARCHAR(7) DEFAULT '#6366f1'   -- used for generated avatar
is_active     BOOLEAN DEFAULT true
created_at    TIMESTAMP DEFAULT NOW()
```

### projects
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
name        VARCHAR(200) NOT NULL
description TEXT
status      ENUM('planning','in_progress','completed','on_hold') DEFAULT 'planning'
start_date  DATE
deadline    DATE
owner_id    UUID REFERENCES users(id)
created_at  TIMESTAMP DEFAULT NOW()
```

### project_members
```sql
project_id  UUID REFERENCES projects(id) ON DELETE CASCADE
user_id     UUID REFERENCES users(id) ON DELETE CASCADE
PRIMARY KEY (project_id, user_id)
```

### tasks
```sql
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
title        VARCHAR(300) NOT NULL
description  TEXT
project_id   UUID REFERENCES projects(id) ON DELETE CASCADE
created_by   UUID REFERENCES users(id)           -- who created
assigned_to  UUID REFERENCES users(id)           -- who is responsible
due_date     DATE
priority     ENUM('low','medium','high','critical') DEFAULT 'medium'
status       ENUM('pending','ongoing','in_review','completed','cancelled') DEFAULT 'pending'
position     INTEGER DEFAULT 0
created_at   TIMESTAMP DEFAULT NOW()
updated_at   TIMESTAMP DEFAULT NOW()
```

> **Task status explained:**
> - `pending` — not started yet
> - `ongoing` — actively being worked on
> - `in_review` — submitted, waiting for check
> - `completed` — done and approved
> - `cancelled` — dropped / no longer needed

### comments
```sql
id         UUID PRIMARY KEY DEFAULT gen_random_uuid()
task_id    UUID REFERENCES tasks(id) ON DELETE CASCADE
user_id    UUID REFERENCES users(id)
content    TEXT NOT NULL
is_edited  BOOLEAN DEFAULT false
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

### attachments
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
task_id     UUID REFERENCES tasks(id) ON DELETE CASCADE
uploaded_by UUID REFERENCES users(id)
file_name   VARCHAR(255)
file_path   VARCHAR(500)          -- server path e.g. /uploads/tasks/uuid/file.pdf
file_type   VARCHAR(50)
file_size   INTEGER               -- bytes
created_at  TIMESTAMP DEFAULT NOW()
```

### activity_logs
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id     UUID REFERENCES users(id)
action      VARCHAR(100)         -- e.g. CREATED_TASK, CHANGED_STATUS
entity_type VARCHAR(50)          -- task | project | user
entity_id   UUID
description TEXT                 -- human-readable log
created_at  TIMESTAMP DEFAULT NOW()
```

---

## Module 1 — Auth & Roles

### Features
- Register, Login, Logout
- JWT access token (15 min) + refresh token (7 days, httpOnly cookie)
- Forgot password → email link → reset password
- Two roles: **Admin** and **User**

### Role Permissions
| Action | Admin | User |
|--------|:-----:|:----:|
| Create / delete projects | ✅ | ❌ |
| Add members to project | ✅ | ❌ |
| Create tasks for others | ✅ | ❌ |
| Create task for themselves | ✅ | ✅ |
| Assign task to themselves | ✅ | ✅ |
| Update own task status | ✅ | ✅ |
| Comment on tasks | ✅ | ✅ |
| Upload files to tasks | ✅ | ✅ |
| Manage users | ✅ | ❌ |
| View admin dashboard | ✅ | ❌ |
| View own user dashboard | ✅ | ✅ |

### Key Files
```
backend/src/
  controllers/auth.controller.ts
  middleware/auth.middleware.ts     ← verifyJWT
  middleware/role.middleware.ts     ← requireRole('admin')
  services/auth.service.ts
  services/email.service.ts

frontend/src/
  pages/auth/LoginPage.tsx
  pages/auth/RegisterPage.tsx
  pages/auth/ForgotPasswordPage.tsx
  pages/auth/ResetPasswordPage.tsx
  store/slices/authSlice.ts
  components/ProtectedRoute.tsx
```

### API
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password/:token
GET  /api/auth/me
```

---

## Module 2 — User Management

### Features
- Admin: create, edit, deactivate users
- Admin: change user role
- Profile page (edit name, email — no avatar upload)
- Avatar is auto-generated from initials (see Avatar System)

### Key Files
```
backend/src/
  controllers/user.controller.ts
  routes/user.routes.ts

frontend/src/
  pages/admin/UsersPage.tsx
  pages/ProfilePage.tsx
  components/UserTable.tsx
  components/Avatar.tsx            ← initials + color (no image)
```

### API
```
GET    /api/users                  ← admin only
GET    /api/users/:id
POST   /api/users                  ← admin: create user
PUT    /api/users/:id
PATCH  /api/users/:id/role
PATCH  /api/users/:id/status
```

---

## Module 3 — Project Management

### Features
- Admin creates projects, sets start/deadline, assigns members
- Project statuses: Planning → In Progress → Completed / On Hold
- Users see only their assigned projects
- Progress bar = % of completed tasks

### Key Files
```
backend/src/
  controllers/project.controller.ts

frontend/src/
  pages/projects/ProjectsPage.tsx
  pages/projects/ProjectDetailPage.tsx
  components/ProjectCard.tsx
  components/ProjectProgressBar.tsx
  components/ProjectStatusBadge.tsx
```

### API
```
GET    /api/projects
GET    /api/projects/:id
POST   /api/projects              ← admin only
PUT    /api/projects/:id          ← admin only
DELETE /api/projects/:id          ← admin only
POST   /api/projects/:id/members
DELETE /api/projects/:id/members/:userId
```

---

## Module 4 — Task Management

### Key Behaviour — User Self-Assign

Users inside a project can:
1. **Create their own task** — they are automatically set as `created_by` and `assigned_to`
2. **Pick up an unassigned task** — click "Assign to me" on any unassigned task in their project
3. **Cannot assign tasks to others** — only admins can reassign

Admins can:
1. Create tasks for anyone
2. Reassign tasks to any project member
3. Change any task status

### Task Status Flow
```
Pending → Ongoing → In Review → Completed
                              → Cancelled (any stage)
```

### Task Fields
| Field | Who Sets It |
|-------|------------|
| Title | Creator |
| Description | Creator |
| Priority | Admin (user can suggest) |
| Due date | Admin |
| Assigned to | Admin OR self-assign |
| Status | Assigned user + Admin |

### Key Files
```
backend/src/
  controllers/task.controller.ts
  routes/task.routes.ts

frontend/src/
  pages/tasks/TaskDetailPage.tsx
  components/tasks/TaskCard.tsx
  components/tasks/TaskForm.tsx
  components/tasks/StatusDropdown.tsx
  components/tasks/PriorityBadge.tsx
  components/tasks/AssignToMeButton.tsx  ← key component
```

### API
```
GET    /api/projects/:id/tasks
GET    /api/tasks/:id
POST   /api/projects/:id/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id
PATCH  /api/tasks/:id/status
PATCH  /api/tasks/:id/assign         ← self-assign or admin reassign
PATCH  /api/tasks/:id/position       ← kanban drag position
```

---

## Module 5 — Kanban Board

### Columns (match task status)
```
Pending | Ongoing | In Review | Completed | Cancelled
```

### Features
- Drag tasks between columns (dnd-kit)
- Dragging a card updates its `status` + `position` via API
- Real-time: other users in same project see the move instantly (Socket.io)
- Task counter badge on each column header
- "Create task" button on Pending column (for self-assign)

### Socket Events
```
Client emits → task:move   { taskId, newStatus, position }
Server emits → task:moved  { task }   to all users in project:${projectId} room
```

### Key Files
```
frontend/src/
  pages/KanbanPage.tsx
  components/kanban/KanbanBoard.tsx      ← DndContext wrapper
  components/kanban/KanbanColumn.tsx     ← SortableContext per column
  components/kanban/KanbanCard.tsx       ← useSortable card
```

---

## Module 6 — Comments & File Attachments

### Comments
- Add, edit (own), delete (own or admin) comments on a task
- Shows name, avatar, time, edited label if modified

### File Attachments
- Upload files directly inside a task detail view
- Stored on VPS at `/var/www/pm-app/uploads/tasks/:taskId/`
- Allowed: images (jpg, png, gif), PDF, docx, xlsx, txt, zip
- Max size: 10MB per file
- Download link served through Express static or dedicated route
- Admin or uploader can delete

> **No profile image uploads.** Avatars are auto-generated only.  
> **File uploads only appear inside task detail pages** — nowhere else in the UI.

### Key Files
```
backend/src/
  controllers/comment.controller.ts
  controllers/attachment.controller.ts
  middleware/upload.middleware.ts        ← Multer: disk storage to /uploads/tasks/:taskId/

frontend/src/
  components/comments/CommentList.tsx
  components/comments/CommentEditor.tsx
  components/attachments/DropZone.tsx
  components/attachments/FileList.tsx
  components/attachments/FileItem.tsx    ← icon, name, size, download, delete
```

### API
```
GET    /api/tasks/:id/comments
POST   /api/tasks/:id/comments
PUT    /api/comments/:id
DELETE /api/comments/:id

GET    /api/tasks/:id/attachments
POST   /api/tasks/:id/attachments        ← multipart/form-data
GET    /api/attachments/:id/download
DELETE /api/attachments/:id
```

---

## Module 7 — Admin Dashboard

What admin sees when they log in:

### Stats Row (4 cards)
| Card | Data |
|------|------|
| Total Projects | count of all projects |
| Active Users | count of is_active users |
| Tasks This Month | count created in current month |
| Completed Tasks | count status = completed |

### Charts
- **Task Status Breakdown** — horizontal bar or donut chart (Pending / Ongoing / In Review / Completed / Cancelled)
- **Project Progress** — list of projects with their % completion bar

### Tables
- **Recent Activity** — last 10 activity log entries (who did what, when)
- **Overdue Tasks** — tasks past due_date and not completed (with assignee name)

### Key Files
```
backend/src/
  controllers/dashboard.controller.ts

frontend/src/
  pages/AdminDashboardPage.tsx
  components/dashboard/StatsCard.tsx
  components/dashboard/TaskStatusChart.tsx
  components/dashboard/ProjectProgressList.tsx
  components/dashboard/OverdueTasks.tsx
  components/dashboard/RecentActivity.tsx
```

### API
```
GET /api/dashboard/admin
```

Response shape:
```json
{
  "stats": {
    "totalProjects": 12,
    "activeUsers": 8,
    "tasksThisMonth": 34,
    "completedTasks": 21
  },
  "taskStatusBreakdown": {
    "pending": 5, "ongoing": 8, "in_review": 3, "completed": 21, "cancelled": 2
  },
  "projectProgress": [...],
  "recentActivity": [...],
  "overdueTasks": [...]
}
```

---

## Module 8 — User Dashboard

What a regular user sees when they log in:

### Stats Row (3 cards)
| Card | Data |
|------|------|
| My Active Tasks | my tasks not completed/cancelled |
| Due This Week | my tasks due in next 7 days |
| Completed | my completed tasks total |

### Sections
- **My Tasks** — list grouped by status (Ongoing first, then Pending, then In Review)
- **Upcoming Deadlines** — next 5 tasks by due date with priority badge
- **My Projects** — cards of projects I'm a member of with progress bars
- **Quick Action** — "Create a task for myself" button that opens task form pre-assigned to self

### Key Files
```
frontend/src/
  pages/UserDashboardPage.tsx
  components/dashboard/MyTasksList.tsx
  components/dashboard/UpcomingDeadlines.tsx
  components/dashboard/MyProjectCards.tsx
  components/dashboard/QuickCreateTask.tsx
```

### API
```
GET /api/dashboard/user
```

Response shape:
```json
{
  "stats": {
    "activeTasks": 4,
    "dueThisWeek": 2,
    "completedTotal": 17
  },
  "myTasks": [...],
  "upcomingDeadlines": [...],
  "myProjects": [...]
}
```

---

## UI Design System

### Philosophy
Clean, light, minimal. No dark backgrounds, no heavy gradients. Think Notion + Linear combined.

### Color Palette
```css
--background:    #f8fafc    /* page background — very light gray */
--surface:       #ffffff    /* cards, modals, sidebar */
--border:        #e2e8f0    /* all borders */
--primary:       #6366f1    /* indigo — buttons, active states, links */
--primary-hover: #4f46e5
--text-main:     #1e293b    /* headings */
--text-muted:    #64748b    /* labels, meta info */
--success:       #22c55e    /* completed status */
--warning:       #f59e0b    /* in review, medium priority */
--danger:        #ef4444    /* cancelled, critical priority */
--info:          #3b82f6    /* ongoing, info badges */
```

### Task Status Colors
| Status | Color | Badge Style |
|--------|-------|------------|
| Pending | Gray | bg-gray-100 text-gray-600 |
| Ongoing | Blue | bg-blue-100 text-blue-700 |
| In Review | Amber | bg-amber-100 text-amber-700 |
| Completed | Green | bg-green-100 text-green-700 |
| Cancelled | Red | bg-red-100 text-red-600 |

### Priority Colors
| Priority | Color |
|----------|-------|
| Low | bg-gray-100 text-gray-500 |
| Medium | bg-yellow-100 text-yellow-700 |
| High | bg-orange-100 text-orange-700 |
| Critical | bg-red-100 text-red-700 |

### Layout
```
┌──────────────────────────────────────────┐
│  Sidebar (240px, white, border-right)    │
│  ┌──────┐  ┌──────────────────────────┐ │
│  │ Logo │  │  Top bar (search, bell,  │ │
│  │      │  │  avatar, name)           │ │
│  │ Nav  │  ├──────────────────────────┤ │
│  │ items│  │                          │ │
│  │      │  │   Page Content           │ │
│  │      │  │   (padding 24px)         │ │
│  └──────┘  └──────────────────────────┘ │
└──────────────────────────────────────────┘
```

### Sidebar Navigation
```
Admin view:
  Dashboard
  Projects
  Users
  Activity Logs

User view:
  Dashboard
  My Projects
  My Tasks
```

### Component Rules
- Cards: `bg-white rounded-xl border border-gray-200 shadow-sm p-5`
- Buttons (primary): `bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2`
- Buttons (secondary): `border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2`
- Input fields: `border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500`
- No box shadows heavier than `shadow-sm`
- Font: Inter or system-ui

---

## Avatar System

No profile picture uploads. Instead, generate avatars from the user's initials + a color.

### How It Works
```tsx
// Avatar.tsx
function Avatar({ name, color, size = 36 }) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: color,   // stored in users.avatar_color
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 600,
        fontSize: size * 0.38,
      }}
    >
      {initials}
    </div>
  );
}
```

### Color Assignment
When a user registers, randomly assign one of these colors:
```typescript
const AVATAR_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#ef4444', // red
  '#14b8a6', // teal
];
// Pick: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
```

Users keep their color. They cannot change it (keeps it simple).

---

## File Upload Strategy

Files are only uploaded inside **task detail pages** — nowhere else.

### Backend Storage Path
```
/var/www/pm-app/
  backend/
  frontend/
  uploads/
    tasks/
      {taskId}/
        report.pdf
        screenshot.png
        notes.docx
```

### Multer Config
```typescript
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const taskId = req.params.taskId;
    const dir = path.join('/var/www/pm-app/uploads/tasks', taskId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg', 'image/png', 'image/gif',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
  ];
  cb(null, allowed.includes(file.mimetype));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
```

### Serving Files
```typescript
// In app.ts — serve uploads as static files
app.use('/uploads', express.static('/var/www/pm-app/uploads'));

// Download route (with auth check)
app.get('/api/attachments/:id/download', verifyJWT, async (req, res) => {
  const attachment = await getAttachmentById(req.params.id);
  res.download(attachment.file_path, attachment.file_name);
});
```

---

## Folder Structure

### Backend
```
backend/
├── src/
│   ├── config/
│   │   ├── db.ts            ← Prisma client instance
│   │   └── socket.ts        ← Socket.io setup
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── project.controller.ts
│   │   ├── task.controller.ts
│   │   ├── comment.controller.ts
│   │   ├── attachment.controller.ts
│   │   └── dashboard.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── role.middleware.ts
│   │   ├── upload.middleware.ts
│   │   └── rateLimit.middleware.ts
│   ├── routes/
│   ├── services/
│   ├── types/
│   └── app.ts
├── prisma/
│   └── schema.prisma
├── .env
└── package.json
```

### Frontend
```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              ← Button, Input, Modal, Badge, Card
│   │   ├── layout/          ← Sidebar, Topbar, PageLayout
│   │   ├── kanban/
│   │   ├── tasks/
│   │   ├── comments/
│   │   ├── attachments/
│   │   ├── dashboard/
│   │   └── Avatar.tsx
│   ├── pages/
│   │   ├── auth/
│   │   ├── admin/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── AdminDashboardPage.tsx
│   │   └── UserDashboardPage.tsx
│   ├── store/slices/
│   ├── hooks/
│   ├── services/api/
│   ├── types/
│   └── router/AppRouter.tsx
└── package.json
```

---

## API Reference

### Auth
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password/:token
GET  /api/auth/me
```

### Users
```
GET    /api/users
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
PATCH  /api/users/:id/role
PATCH  /api/users/:id/status
```

### Projects
```
GET    /api/projects
GET    /api/projects/:id
POST   /api/projects
PUT    /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/members
DELETE /api/projects/:id/members/:userId
```

### Tasks
```
GET    /api/projects/:id/tasks
GET    /api/tasks/:id
POST   /api/projects/:id/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id
PATCH  /api/tasks/:id/status
PATCH  /api/tasks/:id/assign
PATCH  /api/tasks/:id/position
```

### Comments
```
GET    /api/tasks/:id/comments
POST   /api/tasks/:id/comments
PUT    /api/comments/:id
DELETE /api/comments/:id
```

### Attachments
```
GET    /api/tasks/:id/attachments
POST   /api/tasks/:id/attachments
GET    /api/attachments/:id/download
DELETE /api/attachments/:id
```

### Dashboard
```
GET /api/dashboard/admin
GET /api/dashboard/user
```

---

## Build Order

| Phase | Module | Est. Time |
|-------|--------|-----------|
| 1 | Project setup + DB + Auth | Week 1 |
| 2 | Users + Projects | Week 2 |
| 3 | Tasks + Self-assign logic | Week 3 |
| 4 | Kanban Board + Socket.io | Week 4 |
| 5 | Comments + File Attachments | Week 5 |
| 6 | Admin Dashboard + User Dashboard | Week 6 |
| 7 | UI polish + VPS deploy | Week 7 |

---

## VPS Hosting Guide

> Your setup: **Hostinger VPS running Apache**  
> This is explanation only — no commands needed from Claude Code.

### Overview of What Runs on the Server

```
VPS
├── Apache (port 80/443) ← handles incoming traffic, SSL
│   └── reverse proxy → Node.js backend (port 5000)
│   └── serves React frontend (built static files)
├── Node.js + Express (port 5000, managed by PM2)
├── PostgreSQL (port 5432, local only)
└── /var/www/pm-app/uploads/  ← file storage
```

### Step 1 — Prepare the VPS

Install the required software on your Hostinger VPS via SSH:
- **Node.js** (v20 LTS) — to run the backend
- **PostgreSQL** — your database
- **PM2** — keeps your Node app running 24/7 and restarts it on crash
- **Apache** — already installed on most Hostinger VPS plans

### Step 2 — Set Up PostgreSQL

Create a database and a user for the app. Set a strong password. Note down the connection string — it goes into your backend `.env` file as `DATABASE_URL`.

### Step 3 — Upload Your Code

Two options:
- **Git** (recommended) — push code to GitHub, then `git clone` on the VPS
- **FTP/SFTP** — upload built files directly using FileZilla or Hostinger's file manager

Place everything at `/var/www/pm-app/`.

### Step 4 — Build the Frontend

On the VPS (or locally, then upload the `dist/` folder):
```
cd frontend
npm install
npm run build
```
This creates a `frontend/dist/` folder — these are the static HTML/CSS/JS files Apache will serve.

### Step 5 — Configure the Backend

```
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
```
Create a `.env` file on the VPS with your production values (real DB password, real JWT secrets, real SMTP credentials). Never commit `.env` to Git.

### Step 6 — Start Backend with PM2

PM2 keeps your Express server alive permanently:
```
pm2 start dist/app.js --name pm-backend
pm2 save
pm2 startup          ← makes it auto-start on VPS reboot
```

### Step 7 — Configure Apache

You need two Apache virtual host configurations:

**Frontend** — Apache serves the React build directly:
```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /var/www/pm-app/frontend/dist

    <Directory /var/www/pm-app/frontend/dist>
        Options -Indexes
        AllowOverride All
        Require all granted
    </Directory>

    # This is critical for React Router — all routes go to index.html
    FallbackResource /index.html
</VirtualHost>
```

**Backend API** — Apache proxies `/api` and `/uploads` to Node.js:
```apache
<VirtualHost *:80>
    ServerName api.yourdomain.com
    # OR use same domain with /api prefix:

    ProxyPass /api http://localhost:5000/api
    ProxyPassReverse /api http://localhost:5000/api

    ProxyPass /uploads http://localhost:5000/uploads
    ProxyPassReverse /uploads http://localhost:5000/uploads
</VirtualHost>
```

Enable the proxy modules first: `a2enmod proxy proxy_http`

### Step 8 — SSL (HTTPS)

Install Certbot and get a free Let's Encrypt certificate:
```
apt install certbot python3-certbot-apache
certbot --apache -d yourdomain.com
```
Certbot automatically updates your Apache config for HTTPS and sets up auto-renewal.

### Step 9 — Firewall

Allow only the ports you need:
- Port 22 — SSH
- Port 80 — HTTP (Apache)
- Port 443 — HTTPS (Apache)
- Block port 5000 externally — Node should only be accessed through Apache, not directly

### Step 10 — Upload Folder Permissions

Make sure the Node process can write to the uploads folder:
```
mkdir -p /var/www/pm-app/uploads/tasks
chown -R www-data:www-data /var/www/pm-app/uploads
chmod -R 755 /var/www/pm-app/uploads
```

### Deployment Workflow (After First Setup)

Every time you update the code:
1. Push changes to GitHub
2. SSH into VPS
3. `git pull` in `/var/www/pm-app/`
4. If backend changed: `npm run build` → `pm2 restart pm-backend`
5. If frontend changed: `npm run build` in `/frontend` (the `dist/` folder updates automatically, Apache serves it)
6. If schema changed: `npx prisma migrate deploy`

### Environment Variables on VPS

Never hardcode secrets. On the VPS, create `/var/www/pm-app/backend/.env`:
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://pmuser:strongpassword@localhost:5432/pm_db
JWT_ACCESS_SECRET=long_random_string_here
JWT_REFRESH_SECRET=different_long_random_string
CLIENT_URL=https://yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_app_password
UPLOAD_DIR=/var/www/pm-app/uploads
```

---

*8 modules · 7 weeks · Hosted on Hostinger VPS with Apache*  
*Clean light UI · Auto-generated avatars · File storage on VPS · Two dashboards*
