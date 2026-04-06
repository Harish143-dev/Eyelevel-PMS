# SaaS Platform v2.0 — Phase-by-Phase Build Plan
> **For AI / Developer Reference**
> Stack: React + TypeScript + Node.js + PostgreSQL
> Architecture: Multi-tenant SaaS (company_id isolation on every table)
> Base: Existing working app with Projects, Tasks, HRM, Attendance, Payroll, Telegram (global), Auth, Basic Roles

---

## GOLDEN RULES — Never Break These

```
1. NEVER overwrite existing modules — extend only
2. EVERY new table must have company_id (multi-tenant isolation)
3. Feature flags checked on BOTH frontend (hide UI) AND backend (block API)
4. Telegram already exists globally — make configurable, do NOT rebuild
5. Custom fields use EAV pattern — never add columns to main tables
6. Soft delete = set deleted_at — never hard delete going forward
7. Audit log every destructive/admin action
8. checkPermission() middleware must be added to ALL existing API routes
9. PF + ESI payroll logic already correct — do NOT touch formula logic
10. Employee monitoring consent notice must be shown to employees (legal)
```

---

## What Is Already Built — DO NOT Rebuild

| Module | Status | Notes |
|--------|--------|-------|
| Project Management | ✅ DONE | Create/edit/delete, assign members, track status |
| Task Management | ✅ DONE | Kanban, assignment, priority, subtasks, dependencies |
| HR Management | ✅ DONE | Employee records, org hierarchy, leave management |
| Attendance Tracking | ✅ DONE | Clock-in/out, attendance records |
| Payroll & Compliance | ✅ DONE | PDF payslips, PF + ESI calculations |
| Telegram Bot | ⚠️ PARTIAL | Works globally — needs per-company config |
| Authentication | ✅ DONE | Login, register, session management |
| User Roles | ⚠️ PARTIAL | Admin/HR/Manager/Employee exist — RBAC not complete |

---

## Overview — All 4 Phases

| Phase | Name | Duration | Goal |
|-------|------|----------|------|
| Phase 1 | Foundation | ~3 weeks | Feature toggles, onboarding wizard, full RBAC |
| Phase 2 | Control Layer | ~2 weeks | Settings, notifications, security, HR config |
| Phase 3 | Power Features | ~2 weeks | Monitoring, workflow config, soft delete |
| Phase 4 | Growth Features | ~3 weeks | Branding, custom fields, data export, wizard polish |

---

---

# PHASE 1 — Foundation
> Build this before anything else. Everything in Phase 2–4 depends on these.

---

## Phase 1 — Task 1: Feature Toggle System

### What It Is
A system that lets the Super Admin (you) turn entire modules ON/OFF per company.
When a feature is OFF: menu item hidden, route blocked, API returns 403.
This is the foundation for future paid plans.

### Database Changes

```sql
-- Add to existing companies table:
ALTER TABLE companies ADD COLUMN features JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Default features object seeded on new company creation:
{
  "projectManagement": true,
  "taskManagement": true,
  "hrManagement": true,
  "attendanceTracking": true,
  "payroll": true,
  "leaveManagement": true,
  "employeeMonitoring": false,
  "customFields": false,
  "dataExport": false
}
-- Note: rbac, notifications, securitySettings are always ON — not toggleable
```

### Feature Toggle Reference Table

| Feature Key | Module | Toggleable | Default |
|-------------|--------|------------|---------|
| projectManagement | Project Management | YES | ON |
| taskManagement | Task Management | YES | ON |
| hrManagement | HR Management | YES | ON |
| attendanceTracking | Attendance Tracking | YES | ON |
| payroll | Payroll & Compliance | YES | ON |
| leaveManagement | Leave Management | YES | ON |
| employeeMonitoring | Employee Monitoring | YES | OFF |
| customFields | Custom Fields | YES | OFF |
| dataExport | Data Export/Backup | YES | OFF |
| rbac | Roles & Permissions | NO — Always ON | ON |
| notifications | Notifications | NO — Always ON | ON |
| securitySettings | Security Settings | NO — Always ON | ON |

### Backend — Middleware

```typescript
// NEW FILE: middleware/checkFeature.ts
export const checkFeature = (featureKey: string) => {
  return async (req, res, next) => {
    const company = await Company.findById(req.user.companyId);
    if (!company.features[featureKey]) {
      return res.status(403).json({ error: 'Feature not enabled for your account' });
    }
    next();
  };
};

// Apply to ALL module routes:
router.get('/attendance', checkFeature('attendanceTracking'), attendanceController.list);
router.get('/payroll', checkFeature('payroll'), payrollController.list);
router.get('/monitoring', checkFeature('employeeMonitoring'), monitoringController.list);
// Add checkFeature to every module router
```

### Backend — Super Admin API Endpoints

```
GET  /api/super-admin/companies                    → List all companies + feature flags
GET  /api/super-admin/companies/:id/features       → Get feature flags for one company
PUT  /api/super-admin/companies/:id/features       → Update feature flags (toggle on/off)
GET  /api/super-admin/companies/:id/login          → Impersonate company (read-only debug)
```

### Frontend — FeatureContext (React)

```typescript
// NEW FILE: context/FeatureContext.tsx
const FeatureContext = createContext({});

export const FeatureProvider = ({ children }) => {
  const { data: features } = useQuery('features', fetchCompanyFeatures);
  return <FeatureContext.Provider value={features}>{children}</FeatureContext.Provider>;
};

export const useFeature = (key: string): boolean => {
  const features = useContext(FeatureContext);
  return features[key] === true;
};
```

### Frontend — Feature-Gated Sidebar Navigation

```typescript
// EDIT FILE: config/navigation.ts
export const NAV_ITEMS = [
  { label: 'Projects',   path: '/projects',   feature: 'projectManagement',  icon: 'folder' },
  { label: 'Tasks',      path: '/tasks',       feature: 'taskManagement',     icon: 'check' },
  { label: 'HR',         path: '/hr',          feature: 'hrManagement',       icon: 'users' },
  { label: 'Attendance', path: '/attendance',  feature: 'attendanceTracking', icon: 'clock' },
  { label: 'Payroll',    path: '/payroll',     feature: 'payroll',            icon: 'dollar' },
  { label: 'Monitoring', path: '/monitoring',  feature: 'employeeMonitoring', icon: 'eye' },
];

// In Sidebar component — only render enabled features:
NAV_ITEMS.filter(item => useFeature(item.feature)).map(item => <NavItem {...item} />)
```

### Super Admin Panel — UI Pages

```
/super-admin                          → Dashboard (list of all companies)
/super-admin/companies                → Table: Company Name | Plan | Status | Features count
/super-admin/companies/:id/features  → Toggle switches per feature for that company
/super-admin/companies/:id/login     → Impersonate (read-only)
```

Feature Manager page shows:
```
[Company Name] — Feature Manager
─────────────────────────────────────────
[ON]  Project Management      [toggle]
[ON]  Task Management         [toggle]
[ON]  HR Management           [toggle]
[ON]  Attendance Tracking     [toggle]
[ON]  Payroll                 [toggle]
[OFF] Employee Monitoring     [toggle]
[OFF] Custom Fields           [toggle]
[OFF] Data Export             [toggle]
─────────────────────────────────────────
[Save Changes]
```

### Checklist
- [ ] Add `features` JSONB column to companies table
- [ ] Seed default features object on company creation
- [ ] Create `checkFeature()` middleware
- [ ] Apply `checkFeature()` to all module routers
- [ ] Create Super Admin panel pages (company list + feature manager)
- [ ] Create Super Admin API endpoints (GET/PUT features)
- [ ] Create `FeatureContext.tsx` + `useFeature()` hook
- [ ] Update NAV_ITEMS config with feature keys
- [ ] Filter sidebar navigation using useFeature()
- [ ] Wrap FeatureProvider at app root (App.tsx)

---

## Phase 1 — Task 2: Onboarding Setup Wizard

### What It Is
First-time setup flow shown to every new company before they reach the dashboard.
Shows only when `company.setup_completed = false`.
After wizard done → `setup_completed = true`. Never shows again.
Re-accessible from Settings > Company Setup if needed.

### Database Changes

```sql
-- Add to existing companies table:
ALTER TABLE companies ADD COLUMN setup_completed BOOLEAN DEFAULT false;
ALTER TABLE companies ADD COLUMN setup_step INTEGER DEFAULT 1;

-- New table:
CREATE TABLE company_settings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID REFERENCES companies(id) ON DELETE CASCADE,
  name                VARCHAR(255),
  logo_url            TEXT,
  website             VARCHAR(255),
  address_line1       VARCHAR(255),
  city                VARCHAR(100),
  state               VARCHAR(100),
  country             VARCHAR(100),
  currency            VARCHAR(10)  DEFAULT 'INR',
  timezone            VARCHAR(50)  DEFAULT 'Asia/Kolkata',
  date_format         VARCHAR(20)  DEFAULT 'DD/MM/YYYY',
  time_format         VARCHAR(10)  DEFAULT '12h',
  work_start_time     TIME         DEFAULT '09:00',
  work_end_time       TIME         DEFAULT '18:00',
  working_days        JSONB        DEFAULT '["Mon","Tue","Wed","Thu","Fri"]',
  late_grace_minutes  INTEGER      DEFAULT 15,
  created_at          TIMESTAMP    DEFAULT NOW(),
  updated_at          TIMESTAMP    DEFAULT NOW()
);
```

### Wizard Flow

```
/onboarding/step-1  → Company Profile    (name, logo, address, website)          REQUIRED
/onboarding/step-2  → Localization       (timezone, currency, date format)        REQUIRED
/onboarding/step-3  → Work Schedule      (working days, start/end time, grace)    REQUIRED
/onboarding/step-4  → Invite Team        (emails + roles → send invite emails)    OPTIONAL
/onboarding/done    → Summary + Go to Dashboard button
```

Progress bar: Step 1=20%, Step 2=40%, Step 3=60%, Step 4=80%, Done=100%

### API Endpoints

```
GET  /api/onboarding/status    → { setupCompleted: bool, currentStep: number }
POST /api/onboarding/step-1    → Save company profile to company_settings
POST /api/onboarding/step-2    → Save localization settings
POST /api/onboarding/step-3    → Save work schedule
POST /api/onboarding/step-4    → Send invite emails to team members
POST /api/onboarding/complete  → Set setup_completed = true on company
```

### Frontend Redirect Logic

```typescript
// EDIT FILE: App.tsx or ProtectedRoute component
const { data: onboarding } = useQuery('onboarding', fetchOnboardingStatus);

if (!onboarding.setupCompleted) {
  return <Redirect to={`/onboarding/step-${onboarding.currentStep}`} />;
}
// Otherwise: render normal dashboard
```

### Checklist
- [ ] Add `setup_completed` and `setup_step` columns to companies
- [ ] Create `company_settings` table
- [ ] Create all 5 onboarding API endpoints
- [ ] Build Step 1 UI — company profile form + logo upload
- [ ] Build Step 2 UI — localization dropdowns
- [ ] Build Step 3 UI — working days checkboxes + time pickers
- [ ] Build Step 4 UI — invite team form (email + role selector)
- [ ] Build Done screen with dashboard redirect
- [ ] Add redirect logic in App.tsx / ProtectedRoute
- [ ] Add progress bar component
- [ ] Allow re-access from Settings > Company Setup

---

## Phase 1 — Task 3: Full RBAC System

### What It Is
Extends existing basic roles (Admin/HR/Manager/Employee) to a full permission-based system.
Do NOT remove existing roles — add permissions matrix on top.
Every API route must get `checkPermission()` middleware.

### Database Changes

```sql
CREATE TABLE roles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID REFERENCES companies(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  permissions     JSONB NOT NULL DEFAULT '[]',
  is_system_role  BOOLEAN DEFAULT false,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Permissions stored as array of strings:
-- ["project:create", "project:edit", "task:create", "task:assign", "report:view"]

-- Add role reference to users:
ALTER TABLE users ADD COLUMN role_id UUID REFERENCES roles(id);
```

### Permissions Reference

| Permission Key | Module | What It Allows |
|----------------|--------|----------------|
| project:create | Projects | Create new projects |
| project:edit | Projects | Edit existing projects |
| project:delete | Projects | Delete projects |
| project:view | Projects | View projects |
| task:create | Tasks | Create tasks |
| task:edit | Tasks | Edit tasks |
| task:delete | Tasks | Delete tasks |
| task:assign | Tasks | Assign tasks to others |
| hr:view | HR | View employee records |
| hr:edit | HR | Edit employee records |
| payroll:process | Payroll | Run payroll |
| payroll:view | Payroll | View payslips |
| attendance:manage | Attendance | Edit attendance records |
| report:view | Reports | View analytics/reports |
| settings:manage | Settings | Access company settings |
| user:manage | Users | Invite/remove team members |

### Default Permissions Per Role

| Permission | Admin | HR | Manager | Employee |
|------------|-------|----|---------|---------|
| project:create/edit/delete | ✅ | ❌ | ✅ | ❌ |
| task:create/edit/assign | ✅ | ❌ | ✅ | ❌ |
| task:delete | ✅ | ❌ | ✅ | ❌ |
| hr:view/edit | ✅ | ✅ | ❌ | ❌ |
| payroll:process | ✅ | ✅ | ❌ | ❌ |
| payroll:view (own only) | ✅ | ✅ | ✅ | ✅ |
| attendance:manage | ✅ | ✅ | ❌ | ❌ |
| report:view | ✅ | ✅ | ✅ | ❌ |
| settings:manage | ✅ | ❌ | ❌ | ❌ |
| user:manage | ✅ | ❌ | ❌ | ❌ |

### Backend — Middleware

```typescript
// NEW FILE: middleware/checkPermission.ts
export const checkPermission = (permission: string) => {
  return async (req, res, next) => {
    const user = await User.findById(req.user.id).populate('role');
    if (!user.role.permissions.includes(permission)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    next();
  };
};

// Add to ALL existing and new routes:
router.delete('/projects/:id',  checkPermission('project:delete'),  projectController.delete);
router.post('/payroll/run',     checkPermission('payroll:process'), payrollController.run);
router.get('/reports',          checkPermission('report:view'),     reportsController.index);
router.post('/users/invite',    checkPermission('user:manage'),     userController.invite);
```

### API Endpoints

```
GET  /api/roles          → List all roles for the company
POST /api/roles          → Create a new custom role
PUT  /api/roles/:id      → Update role permissions
DELETE /api/roles/:id    → Delete a custom role (not system roles)
```

### UI Pages

```
/settings/roles               → List all roles (system + custom)
/settings/roles/create        → Create new role + permissions matrix
/settings/roles/:id/edit      → Edit existing role permissions
```

Permissions Matrix UI: Table with modules as rows, actions (create/read/update/delete) as columns. Each cell is a toggle.

### Checklist
- [ ] Create `roles` table
- [ ] Add `role_id` to users table
- [ ] Seed default system roles with correct permissions on company creation
- [ ] Create `checkPermission()` middleware
- [ ] Add `checkPermission()` to ALL existing API routes (audit every route file)
- [ ] Create roles API endpoints (CRUD)
- [ ] Build roles list page
- [ ] Build permissions matrix UI (table with toggles)
- [ ] Build role create/edit pages
- [ ] Prevent deletion of system roles (is_system_role = true)

---

---

# PHASE 2 — Control Layer
> Depends on Phase 1 being complete. All settings + controls.

---

## Phase 2 — Task 1: Company Settings Module

### UI Pages to Build

```
/settings/company/profile      → Name, logo upload, website, address
/settings/company/localization → Currency, timezone, date format, time format
/settings/company/schedule     → Working days, start/end time, late grace period, half-day threshold
/settings/branding             → Primary color picker, navbar logo, email footer text
```

### API Endpoints

```
GET  /api/settings/company     → Fetch full company_settings record
PUT  /api/settings/company     → Update company settings
POST /api/settings/company/logo → Upload logo → store in S3/Cloudinary → save URL
```

### Logo Upload Rules
- Upload to: Cloudinary or AWS S3
- Max file size: 2MB
- Accepted formats: PNG, JPG, SVG
- Show preview before saving
- Store URL in `company_settings.logo_url`

### Branding — CSS Variable Injection

```typescript
// EDIT FILE: App.tsx — on app load, inject company brand colors
const { data: branding } = useQuery('branding', fetchCompanyBranding);

useEffect(() => {
  if (branding?.primaryColor) {
    document.documentElement.style.setProperty('--primary', branding.primaryColor);
  }
  if (branding?.logoUrl) {
    // Update navbar logo img src
  }
}, [branding]);
```

### Database Changes
All fields already in `company_settings` table created in Phase 1.
Add these additional columns for branding:

```sql
ALTER TABLE company_settings ADD COLUMN primary_color  VARCHAR(7) DEFAULT '#1E40AF';
ALTER TABLE company_settings ADD COLUMN email_footer_text TEXT;
```

### Checklist
- [ ] Build company profile settings page
- [ ] Build localization settings page
- [ ] Build work schedule settings page
- [ ] Build branding page with color picker
- [ ] Build logo upload component with preview
- [ ] Wire up GET/PUT /api/settings/company
- [ ] Implement logo upload to cloud storage
- [ ] Implement CSS variable injection on app load
- [ ] Add `primary_color` and `email_footer_text` columns

---

## Phase 2 — Task 2: Notification Settings

### Settings Structure (stored as JSONB in company_settings)

```json
{
  "notifications": {
    "taskAssigned":     { "email": true,  "inApp": true,  "telegram": true  },
    "taskDeadline":     { "email": true,  "inApp": true,  "telegram": false },
    "commentMention":   { "email": false, "inApp": true,  "telegram": false },
    "leaveApproved":    { "email": true,  "inApp": true,  "telegram": true  },
    "leaveRejected":    { "email": true,  "inApp": true,  "telegram": false },
    "payslipGenerated": { "email": true,  "inApp": true,  "telegram": false },
    "attendanceAlert":  { "email": false, "inApp": true,  "telegram": true  },
    "digestMode":       "instant",
    "quietHoursStart":  "22:00",
    "quietHoursEnd":    "08:00"
  }
}
```

### Telegram — Make Per-Company Configurable

```sql
-- EXTEND existing company_settings table (do NOT rebuild Telegram):
ALTER TABLE company_settings ADD COLUMN telegram_bot_token TEXT;
ALTER TABLE company_settings ADD COLUMN telegram_chat_id   TEXT;
ALTER TABLE company_settings ADD COLUMN telegram_enabled   BOOLEAN DEFAULT false;
```

```
EDIT FILE: notifications/channels/telegram.js
→ Read bot token + chat ID from company_settings instead of global config
→ Check telegram_enabled before sending
→ Fall back gracefully if not configured
```

### UI Pages

```
/settings/notifications         → Grid: event rows × channel columns (email/inApp/telegram toggles)
/settings/notifications/timing  → Digest mode selector, quiet hours start/end time pickers
/settings/integrations/telegram → Bot Token input, Chat ID input, Test Connection button, Enable toggle
```

### API Endpoints

```
GET  /api/settings/notifications        → Fetch notification preferences
PUT  /api/settings/notifications        → Update preferences
POST /api/settings/integrations/telegram/test → Test Telegram connection
```

### Notification Service Logic

```typescript
// EDIT: notification service — before sending any notification:
const prefs = company.settings.notifications;
const eventPrefs = prefs[eventType]; // e.g. prefs['taskAssigned']

if (eventPrefs.email)    sendEmail(user, payload);
if (eventPrefs.inApp)    createInAppNotification(user, payload);
if (eventPrefs.telegram && company.settings.telegramEnabled) {
  sendTelegram(company.settings.telegramBotToken, company.settings.telegramChatId, payload);
}
```

### Checklist
- [ ] Add notification prefs JSONB to company_settings
- [ ] Add telegram config columns to company_settings
- [ ] Build notification settings page (grid of toggles)
- [ ] Build notification timing page
- [ ] Build Telegram config page with Test Connection
- [ ] Update notification service to read per-company config
- [ ] Update Telegram channel to use per-company token/chatId
- [ ] Wire up GET/PUT notification settings API

---

## Phase 2 — Task 3: Security Settings

### UI Pages

```
/settings/security/password      → Password policy rules
/settings/security/2fa           → Enable/disable 2FA app-wide
/settings/security/sessions      → Session timeout, max concurrent sessions
/settings/security/activity-log  → Searchable + filterable audit log table
```

### Password Policy Settings (stored in company_settings)

```json
{
  "passwordPolicy": {
    "minLength": 8,
    "requireUppercase": true,
    "requireNumbers": true,
    "requireSymbols": false,
    "expiryDays": 90
  }
}
```

### Activity Log — Database Schema

```sql
CREATE TABLE activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id),
  user_name   VARCHAR(255),
  action      VARCHAR(100) NOT NULL,
  target      VARCHAR(255),
  target_id   UUID,
  ip_address  INET,
  user_agent  TEXT,
  metadata    JSONB,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_company ON activity_logs(company_id, created_at DESC);
```

### Actions to Log (implement logging hooks for all of these)

```
login, logout
create_project, update_project, delete_project
create_task, delete_task
invite_user, remove_user, change_role
update_settings
run_payroll, approve_leave, reject_leave
export_data
```

### API Endpoints

```
GET  /api/settings/security           → Get security settings
PUT  /api/settings/security           → Update security settings
GET  /api/activity-logs               → Paginated list (filter by user, action, date range)
```

### Checklist
- [ ] Create `activity_logs` table + indexes
- [ ] Add password policy JSONB to company_settings
- [ ] Build password policy settings page
- [ ] Build 2FA settings page
- [ ] Build session timeout settings page
- [ ] Build activity log table page with search + date filter
- [ ] Add logging hooks to: auth service, project service, task service, user service, payroll service, leave service, settings service
- [ ] Wire up security settings GET/PUT API
- [ ] Wire up activity log GET API

---

## Phase 2 — Task 4: HR Policy Configuration (Extend Existing)

### What to Add to Existing Attendance Module

```
/settings/hr/attendance    → Work hours, late policy, half-day rules, overtime
/settings/hr/leave         → Leave types, leave balance rules, approval workflow
```

### Settings to Add (in company_settings table)

```sql
ALTER TABLE company_settings ADD COLUMN half_day_threshold TIME DEFAULT '13:00';
ALTER TABLE company_settings ADD COLUMN overtime_threshold_hours DECIMAL(4,2) DEFAULT 9.0;
```

Leave types configuration stored as JSONB:
```json
{
  "leaveTypes": [
    { "id": "casual",  "name": "Casual Leave",  "daysPerYear": 12, "carryForward": false },
    { "id": "sick",    "name": "Sick Leave",     "daysPerYear": 10, "carryForward": false },
    { "id": "earned",  "name": "Earned Leave",   "daysPerYear": 15, "carryForward": true  }
  ]
}
```

### Checklist
- [ ] Build attendance policy settings page
- [ ] Build leave types configuration page
- [ ] Add `half_day_threshold` and `overtime_threshold_hours` columns
- [ ] Store leave types as JSONB in company_settings
- [ ] Wire up attendance + leave settings to existing HRM module logic

---

---

# PHASE 3 — Power Features
> Depends on Phase 1 + 2. Adds monitoring, workflow config, and data safety.

---

## Phase 3 — Task 1: Employee Monitoring

### Scope — Login/Logout Times Only
Passive tracking — records automatically on login/logout.
Separate from Attendance (which is manual clock-in/out).
Feature is OFF by default — Super Admin enables per company.
**Must show consent notice to employees when this feature is enabled.**

### Database Schema

```sql
CREATE TABLE employee_monitoring (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  first_login_at  TIMESTAMP,
  last_logout_at  TIMESTAMP,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_monitoring_company_date ON employee_monitoring(company_id, date);
CREATE INDEX idx_monitoring_user_date    ON employee_monitoring(user_id, date);
```

### What Gets Tracked

| Data Point | Captured When | Stored In |
|------------|---------------|-----------|
| First login time (daily) | On /auth/login success | employee_monitoring.first_login_at |
| Last logout time | On /auth/logout or session expiry | employee_monitoring.last_logout_at |
| Total session duration | Calculated: last_logout - first_login | Computed on query |
| Login IP address | From request headers | employee_monitoring.ip_address |
| Login device/browser | From User-Agent header | employee_monitoring.user_agent |

### Backend — Hook Into Auth Service

```typescript
// EDIT FILE: services/auth.service.ts
// On login success — upsert monitoring record:
async onLoginSuccess(userId, companyId, ip, userAgent) {
  const today = new Date().toISOString().split('T')[0];
  await db.query(`
    INSERT INTO employee_monitoring (company_id, user_id, date, first_login_at, ip_address, user_agent)
    VALUES ($1, $2, $3, NOW(), $4, $5)
    ON CONFLICT (user_id, date)
    DO UPDATE SET last_logout_at = NOW()
    WHERE employee_monitoring.first_login_at IS NOT NULL
  `, [companyId, userId, today, ip, userAgent]);
}

// On logout — update last_logout_at:
async onLogout(userId, companyId) {
  const today = new Date().toISOString().split('T')[0];
  await db.query(`
    UPDATE employee_monitoring SET last_logout_at = NOW()
    WHERE user_id = $1 AND company_id = $2 AND date = $3
  `, [userId, companyId, today]);
}
```

### API Endpoints

```
GET /api/monitoring/daily                → All employees login summary for today
GET /api/monitoring/employee/:id         → Login history for one employee (date range)
GET /api/monitoring/report?from=&to=     → Full report (CSV exportable if dataExport ON)
```

Access control: Admin, HR, Manager can view. Employees cannot.

### UI Page

```
/monitoring/dashboard
→ Table: Employee | Date | First Login | Last Logout | Duration | IP | Device
→ Filter: date range, department, individual employee
→ Status badge: 🟢 Logged In Today | 🔴 Not Logged In | ⚫ No Data
→ Export to CSV button (only visible if dataExport feature toggle is ON)
```

### Consent Notice
When `employeeMonitoring` feature is turned ON for a company, every employee must see a banner on their next login:
```
"Your employer has enabled login activity monitoring.
Your login times, IP address, and device information are being recorded."
[I Understand]
```
Store `monitoring_consent_shown: true` per user after they dismiss.

### Checklist
- [ ] Create `employee_monitoring` table + indexes
- [ ] Add `monitoring_consent_shown` boolean to users table
- [ ] Hook login/logout into auth service
- [ ] Build monitoring dashboard UI
- [ ] Build monitoring report page with date range filter
- [ ] Wire up all 3 API endpoints
- [ ] Add checkFeature('employeeMonitoring') middleware to all monitoring routes
- [ ] Build consent notice banner (show on login if monitoring ON and not yet shown)
- [ ] Export to CSV (check dataExport feature toggle before showing button)

---

## Phase 3 — Task 2: Workflow Settings (Custom Statuses & Priorities)

### Database Schema

```sql
CREATE TABLE task_statuses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID REFERENCES companies(id) ON DELETE CASCADE,
  name         VARCHAR(100) NOT NULL,
  color        VARCHAR(7)   NOT NULL,
  order_index  INTEGER      NOT NULL,
  is_default   BOOLEAN      DEFAULT false
);

-- Seed on company creation:
INSERT INTO task_statuses (company_id, name, color, order_index, is_default) VALUES
  ($companyId, 'Backlog',     '#6B7280', 1, true),
  ($companyId, 'To Do',       '#3B82F6', 2, true),
  ($companyId, 'In Progress', '#F59E0B', 3, true),
  ($companyId, 'QA',          '#8B5CF6', 4, true),
  ($companyId, 'Done',        '#10B981', 5, true);

CREATE TABLE task_priorities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID REFERENCES companies(id) ON DELETE CASCADE,
  name         VARCHAR(50)  NOT NULL,
  color        VARCHAR(7)   NOT NULL,
  icon         VARCHAR(50),
  order_index  INTEGER      NOT NULL
);
```

### UI Pages

```
/settings/workflow/statuses    → Cards showing each status + color dot. Add/edit/delete/drag-reorder.
/settings/workflow/priorities  → List of priority levels + color + icon. Add/edit/delete.
/settings/workflow/defaults    → Default due date offset (e.g. 7 days), auto-assign rules
```

### API Endpoints

```
GET    /api/settings/workflow/statuses     → List statuses for company
POST   /api/settings/workflow/statuses     → Create new status
PUT    /api/settings/workflow/statuses/:id → Edit status (name, color)
DELETE /api/settings/workflow/statuses/:id → Delete (only if no tasks use it)
PUT    /api/settings/workflow/statuses/reorder → Update order_index for all
```

### Checklist
- [ ] Create `task_statuses` table
- [ ] Create `task_priorities` table
- [ ] Seed default statuses and priorities on company creation
- [ ] Build status management UI (cards with color picker + drag-to-reorder)
- [ ] Build priority management UI
- [ ] Wire up CRUD + reorder API endpoints
- [ ] Update task creation/edit forms to use company's custom statuses
- [ ] Update Kanban board to use company's custom statuses as columns

---

## Phase 3 — Task 3: Soft Delete — Apply Everywhere

### What to Do
Every `DELETE` operation across ALL tables must set `deleted_at` instead of removing the record.
All SELECT queries must add `WHERE deleted_at IS NULL`.

### Database Migrations

```sql
-- Apply to ALL main tables:
ALTER TABLE projects    ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE tasks       ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE users       ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE employees   ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE leave_requests ADD COLUMN deleted_at TIMESTAMP NULL;

-- Add indexes for performance:
CREATE INDEX idx_projects_deleted ON projects(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_deleted    ON tasks(deleted_at)    WHERE deleted_at IS NULL;
```

### Implementation Strategy

```typescript
// Option A: Use TypeORM @DeleteDateColumn decorator on all entities
// Option B: Add global Knex middleware that intercepts DELETE and converts to UPDATE

// IMPORTANT: Update ALL existing queries to add WHERE deleted_at IS NULL
// Use a base repository class or query scope to enforce this automatically
```

### Trash Page

```
/settings/data/trash
→ Shows items deleted in last 30 days (where deleted_at > NOW() - 30 days)
→ Table: Item Name | Type | Deleted By | Deleted At
→ Actions: Restore (set deleted_at = NULL) | Permanently Delete
```

### Checklist
- [ ] Add `deleted_at` column to all main tables
- [ ] Add partial indexes on deleted_at
- [ ] Update all DELETE endpoints to soft delete
- [ ] Update all SELECT queries to filter `WHERE deleted_at IS NULL`
- [ ] Build trash page UI
- [ ] Build restore endpoint (set deleted_at = NULL)
- [ ] Build permanent delete endpoint (actual removal after confirmation)
- [ ] Auto-purge: permanently delete records where deleted_at > 30 days (cron job)

---

---

# PHASE 4 — Growth Features
> Adds polish, power-user features, and data tooling.

---

## Phase 4 — Task 1: Custom Fields (EAV Pattern)

### What It Is
Allows companies to add custom fields to Tasks, Projects, or Employees.
Uses Entity-Attribute-Value (EAV) pattern — do NOT add columns to main tables.

### Database Schema

```sql
CREATE TABLE custom_field_definitions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID REFERENCES companies(id) ON DELETE CASCADE,
  module        VARCHAR(50)  NOT NULL,  -- 'task' | 'project' | 'employee'
  field_name    VARCHAR(100) NOT NULL,
  field_type    VARCHAR(20)  NOT NULL,  -- 'text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'url'
  options       JSONB,                  -- for dropdown: ["Option A", "Option B"]
  is_required   BOOLEAN DEFAULT false,
  show_in_list  BOOLEAN DEFAULT false,
  order_index   INTEGER DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE custom_field_values (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID REFERENCES companies(id) ON DELETE CASCADE,
  field_def_id      UUID REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
  entity_id         UUID NOT NULL,   -- task_id or project_id or employee_id
  value_text        TEXT,
  value_number      DECIMAL(15,4),
  value_date        DATE,
  value_boolean     BOOLEAN,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);
```

### UI Pages

```
/settings/custom-fields              → List all custom fields grouped by module
/settings/custom-fields/create       → Field builder form

Field Builder Form fields:
  - Module: [Tasks | Projects | Employees]  (select)
  - Field Name: [text input]
  - Field Type: [Text | Number | Date | Dropdown | Checkbox | URL]  (select)
  - Options: [add options — shown only if type = Dropdown]
  - Required: [toggle]
  - Show in list view: [toggle]
```

### API Endpoints

```
GET    /api/custom-fields?module=task     → List field definitions for a module
POST   /api/custom-fields                 → Create field definition
PUT    /api/custom-fields/:id             → Update field definition
DELETE /api/custom-fields/:id             → Delete field + all its values

GET    /api/custom-fields/values/:entityId  → Get custom field values for entity
POST   /api/custom-fields/values            → Save/update custom field values
```

### Frontend Integration
Custom fields must render dynamically in:
- Task create/edit form
- Project create/edit form
- Employee profile form

```typescript
// Fetch field definitions for the module, render each field based on field_type
const { data: fields } = useQuery(['custom-fields', 'task'], () => fetchCustomFields('task'));

fields.map(field => {
  switch(field.fieldType) {
    case 'text':     return <TextInput key={field.id} label={field.fieldName} />;
    case 'number':   return <NumberInput key={field.id} label={field.fieldName} />;
    case 'date':     return <DatePicker key={field.id} label={field.fieldName} />;
    case 'dropdown': return <Select key={field.id} label={field.fieldName} options={field.options} />;
    case 'checkbox': return <Checkbox key={field.id} label={field.fieldName} />;
    case 'url':      return <UrlInput key={field.id} label={field.fieldName} />;
  }
});
```

### Checklist
- [ ] Create `custom_field_definitions` table
- [ ] Create `custom_field_values` table
- [ ] Build custom fields list page (grouped by module)
- [ ] Build field builder form
- [ ] Wire up field definition CRUD API
- [ ] Wire up field values GET/POST API
- [ ] Inject custom fields dynamically into task create/edit form
- [ ] Inject custom fields dynamically into project create/edit form
- [ ] Inject custom fields dynamically into employee profile form
- [ ] Show custom field columns in list views (if show_in_list = true)

---

## Phase 4 — Task 2: Data Export, Import & Backup

### Export Options

| Export | Format | Columns |
|--------|--------|---------|
| Tasks | CSV / Excel | ID, Title, Status, Priority, Assigned To, Due Date, Project |
| Projects | CSV | ID, Name, Client, Status, Start Date, End Date, Manager |
| Employees | CSV / Excel | ID, Name, Email, Role, Department, Join Date |
| Attendance Report | Excel | Employee, Date, Clock In, Clock Out, Hours, Status |
| Payroll Report | Excel | Employee, Month, Gross, Deductions, Net Pay, Status |

### UI Pages

```
/settings/data/export  → Download buttons per module (CSV/Excel)
/settings/data/import  → Upload CSV with column mapping + validation preview
/settings/data/trash   → View/restore/permanently delete soft-deleted items
```

### API Endpoints

```
GET  /api/data/export/tasks       → Returns CSV/Excel file
GET  /api/data/export/projects    → Returns CSV file
GET  /api/data/export/employees   → Returns CSV/Excel file
GET  /api/data/export/attendance  → Returns Excel file
GET  /api/data/export/payroll     → Returns Excel file

POST /api/data/import/employees   → Upload CSV → validate → insert
GET  /api/data/trash              → Items deleted in last 30 days
POST /api/data/trash/:id/restore  → Restore a soft-deleted item
DELETE /api/data/trash/:id        → Permanently delete
```

### Checklist
- [ ] Build export service (CSV + Excel using xlsx or exceljs library)
- [ ] Build export page UI with download buttons per module
- [ ] Build import CSV page with column mapping UI + row validation
- [ ] Build trash page (list + restore + permanent delete)
- [ ] Wire up all export API endpoints
- [ ] Wire up import API endpoint
- [ ] Wire up trash/restore/permanent delete API
- [ ] Add checkFeature('dataExport') to all export/import routes

---

## Phase 4 — Task 3: System Preferences

### UI Page

```
/settings/preferences
→ Theme: [Light | Dark | System]  (toggle)
→ Language: [English]  (more to be added later)
→ Default dashboard view: [Overview | Tasks | Projects]
→ Items per page: [10 | 25 | 50 | 100]
```

### Storage
User-level preferences (not company-level). Store in users table or separate user_preferences table.

```sql
ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{
  "theme": "light",
  "language": "en",
  "defaultDashboardView": "overview",
  "itemsPerPage": 25
}'::jsonb;
```

### Checklist
- [ ] Add `preferences` JSONB to users table
- [ ] Build preferences page UI
- [ ] Implement dark/light/system theme toggle (CSS variables + localStorage for instant toggle)
- [ ] Implement items-per-page setting used in all paginated tables
- [ ] Wire up GET/PUT preferences API

---

---

# MASTER CHECKLIST — Phase Completion Gates

## Before Starting Phase 2 — Verify:
- [ ] Feature Toggle System is working (can toggle features on/off per company via Super Admin panel)
- [ ] FeatureContext is in app, useFeature() hook works, sidebar filters correctly
- [ ] checkFeature() middleware blocks disabled features at API level
- [ ] Onboarding wizard shows for new companies, completes, never shows again
- [ ] RBAC roles table created, checkPermission() added to ALL routes
- [ ] Default system roles seeded with correct permissions

## Before Starting Phase 3 — Verify:
- [ ] Company settings page saves correctly
- [ ] Branding color injection works in browser
- [ ] Notification settings save and notification service reads them
- [ ] Telegram is per-company (not global)
- [ ] Activity log is recording all required actions
- [ ] Password policy is being enforced on user creation/password change

## Before Starting Phase 4 — Verify:
- [ ] Employee monitoring hooks into auth login/logout
- [ ] Consent banner shows when monitoring is enabled
- [ ] Custom task statuses load in Kanban columns
- [ ] Soft delete applied to projects, tasks, users tables
- [ ] Trash page shows and restore works

## Phase 4 Complete — Final Checks:
- [ ] Custom fields render in all 3 modules (tasks, projects, employees)
- [ ] All export endpoints return correct data files
- [ ] Import validates CSV and shows errors before inserting
- [ ] System preferences persist across sessions
- [ ] All checkFeature() guards in place for Phase 3+4 features

---

# DATABASE MIGRATION ORDER

Run migrations in this exact order to avoid foreign key errors:

```
Migration 01 — companies: add features, setup_completed, setup_step
Migration 02 — company_settings: create table
Migration 03 — roles: create table
Migration 04 — users: add role_id, preferences, monitoring_consent_shown
Migration 05 — activity_logs: create table
Migration 06 — employee_monitoring: create table
Migration 07 — task_statuses: create table + seed defaults
Migration 08 — task_priorities: create table + seed defaults
Migration 09 — projects, tasks, users, employees: add deleted_at columns
Migration 10 — company_settings: add branding columns, telegram columns, policy columns
Migration 11 — custom_field_definitions: create table
Migration 12 — custom_field_values: create table
```

---

# SEED DATA — On New Company Creation

Run this seed script every time a new company registers:

```typescript
async function seedNewCompany(companyId: string) {
  // 1. Default features
  await db.query(`UPDATE companies SET features = $1 WHERE id = $2`, [DEFAULT_FEATURES, companyId]);

  // 2. Company settings record
  await db.query(`INSERT INTO company_settings (company_id) VALUES ($1)`, [companyId]);

  // 3. System roles with default permissions
  await seedSystemRoles(companyId);

  // 4. Default task statuses
  await seedTaskStatuses(companyId);

  // 5. Default task priorities
  await seedTaskPriorities(companyId);
}
```

---

*Document Version: 2.0 | Stack: React + TypeScript + Node.js + PostgreSQL | April 2026*
*This file is optimized for AI and developer reference. Every task is self-contained and independently actionable.*
