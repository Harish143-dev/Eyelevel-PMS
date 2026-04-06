# 🧪 QA Master Test Plan
## Multi-Tenant Business Management SaaS Application

---

**Document Version:** 1.0.0  
**Status:** Active  
**Classification:** Confidential – QA Internal  
**Prepared By:** Senior QA Engineer / SaaS Test Architect  
**Date:** 2025-06-01  
**Review Cycle:** Per Sprint / Release Candidate  

---

## 📋 Table of Contents

1. [Document Purpose & Scope](#1-document-purpose--scope)
2. [Application Overview](#2-application-overview)
3. [Tenant Architecture & Model](#3-tenant-architecture--model)
4. [Testing Objectives](#4-testing-objectives)
5. [Testing Scope](#5-testing-scope)
6. [Module Definitions](#6-module-definitions)
7. [Test Strategies](#7-test-strategies)
8. [Test Scenarios Per Module](#8-test-scenarios-per-module)
9. [Tenant Isolation Test Design](#9-tenant-isolation-test-design)
10. [Cross-Tenant Attack Simulations](#10-cross-tenant-attack-simulations)
11. [Role × Tenant Matrix Testing](#11-role--tenant-matrix-testing)
12. [Edge Cases & Special Scenarios](#12-edge-cases--special-scenarios)
13. [Test Data Strategy](#13-test-data-strategy)
14. [Entry & Exit Criteria](#14-entry--exit-criteria)
15. [Risk Register](#15-risk-register)
16. [Tools & Environment](#16-tools--environment)
17. [Defect Classification Model](#17-defect-classification-model)
18. [QA Execution Phases](#18-qa-execution-phases)
19. [Sign-Off & Approvals](#19-sign-off--approvals)

---

## 1. Document Purpose & Scope

### 1.1 Purpose

This document defines the complete QA strategy, test design, and execution plan for a **multi-tenant Business Management SaaS application**. The primary goal is to guarantee that:

- Every tenant's data is **completely isolated** from every other tenant
- **Role-based access control (RBAC)** is correctly enforced within and across tenants
- No unauthorized **cross-tenant data leakage** exists in any layer (API, DB, cache, file storage)
- The platform is **production-ready** for onboarding multiple companies simultaneously

### 1.2 Guiding Principles

| Principle | Description |
|---|---|
| 🔒 Isolation First | Tenant isolation is never assumed — it must be actively proved |
| ☠️ Adversarial Mindset | Every test simulates a user trying to access data they shouldn't |
| 🔁 Repeatability | All tests must be reproducible in CI/CD pipelines |
| 📍 Context Always | Every test case carries an explicit Tenant ID and Role |
| 🚨 Zero Tolerance | Any cross-tenant data exposure = Critical severity, immediate escalation |

---

## 2. Application Overview

### 2.1 Platform Summary

A cloud-hosted, multi-tenant Business Management SaaS where multiple independent companies (tenants) share the same infrastructure but operate in fully isolated data environments.

### 2.2 Core Modules

| # | Module | Description |
|---|---|---|
| 1 | **Authentication (Auth)** | Login, logout, MFA, SSO, session management, JWT issuance |
| 2 | **Dashboard** | Tenant-scoped summary: KPIs, widgets, activity feed |
| 3 | **Human Resources (HR)** | Employee management, departments, payroll, leave, org charts |
| 4 | **Projects** | Project lifecycle: creation, milestones, assignments, status |
| 5 | **Tasks** | Task CRUD, assignments, priorities, deadlines, sub-tasks |
| 6 | **To-Do** | Personal task lists, reminders, completion tracking |
| 7 | **Settings** | Tenant config, billing, integrations, branding, notifications |
| 8 | **User Management** | User CRUD, role assignment, invitations, deactivation |
| 9 | **Reporting & Analytics** | Tenant-scoped reports, exports, dashboards |
| 10 | **Notifications** | In-app + email alerts scoped to tenant and user |
| 11 | **File Management** | Document uploads, sharing, permissions, storage isolation |
| 12 | **Billing** | Subscription plans, invoices, payment methods per tenant |
| 13 | **Audit Logs** | Immutable activity trail per tenant |
| 14 | **API / Integrations** | Public API, webhooks, third-party integrations |

### 2.3 Supported User Roles (Per Tenant)

| Role | Access Level |
|---|---|
| **Super Admin** | Platform-level (internal staff only) – manages all tenants |
| **Tenant Admin** | Full admin within their own tenant only |
| **Manager** | Manages teams, projects, tasks within their tenant |
| **Employee** | Standard user; limited write access in their tenant |
| **Read-Only** | View-only access within their tenant |
| **Guest** | Restricted external collaborator within their tenant |

---

## 3. Tenant Architecture & Model

### 3.1 Tenant Model Overview

```
Platform
├── Tenant A (Company: Acme Corp)      [tenant_id: T-001]
│   ├── Users: admin@acme.com, emp1@acme.com
│   ├── Data: HR records, Projects, Tasks, Files
│   └── Config: Branding, Billing, Permissions
│
├── Tenant B (Company: Beta Ltd)       [tenant_id: T-002]
│   ├── Users: admin@beta.com, emp1@beta.com
│   ├── Data: HR records, Projects, Tasks, Files
│   └── Config: Branding, Billing, Permissions
│
└── Tenant C (Company: Gamma Inc)      [tenant_id: T-003]
    ├── Users: admin@gamma.com
    └── Data: (Independent, no overlap with A or B)
```

### 3.2 Tenant Creation Flow

| Step | Action | Validation Points |
|---|---|---|
| 1 | Super Admin creates tenant | Unique `tenant_id` generated; no collision |
| 2 | Initial Admin account provisioned | Bound to `tenant_id`; cannot access other tenants |
| 3 | Tenant configuration initialized | Default roles, permissions, storage bucket created |
| 4 | Tenant Admin invites users | All invited users inherit `tenant_id` binding |
| 5 | Data operations begin | All writes tagged with `tenant_id` at DB level |

### 3.3 Tenant Isolation Rules (Non-Negotiable)

| Rule | Description |
|---|---|
| **R-01** | Every database record must carry a `tenant_id` foreign key |
| **R-02** | All API endpoints must validate `tenant_id` from token, never from request body |
| **R-03** | File storage paths must be namespaced: `/tenants/{tenant_id}/...` |
| **R-04** | Cache keys must be prefixed with `tenant_id` |
| **R-05** | Search indexes must filter by `tenant_id` |
| **R-06** | Background jobs must carry tenant context and not bleed across queues |
| **R-07** | Audit logs must be scoped per tenant |
| **R-08** | Email/notification delivery must verify recipient tenant |

### 3.4 User ↔ Tenant Association

```
User {
  user_id:    UUID (globally unique)
  tenant_id:  FK → Tenant (required, immutable after creation)
  role:       ENUM (scoped within tenant)
  email:      unique within tenant (NOT globally)
  status:     active | inactive | invited
}
```

> ⚠️ **Critical Rule:** A user's `tenant_id` is set at registration and must NEVER be modifiable via user-facing API. Any endpoint accepting `tenant_id` in request body must be treated as a vulnerability.

---

## 4. Testing Objectives

| Priority | Objective |
|---|---|
| 🔴 P0 | Zero cross-tenant data leakage in any module or API |
| 🔴 P0 | JWT / session tokens cannot be reused to access foreign tenants |
| 🔴 P0 | URL/ID manipulation cannot expose other tenants' resources |
| 🟠 P1 | Role permissions are correctly enforced within each tenant |
| 🟠 P1 | Super Admin cannot accidentally expose data across tenants |
| 🟡 P2 | All CRUD operations function correctly per module |
| 🟡 P2 | Business logic rules are enforced consistently |
| 🟢 P3 | UI renders correct tenant-scoped data at all times |
| 🟢 P3 | Performance is acceptable under multi-tenant load |

---

## 5. Testing Scope

### 5.1 In Scope

| Category | Coverage |
|---|---|
| **Functional Testing** | All modules: CRUD, workflows, validations |
| **Tenant Isolation Testing** | Data, API, Storage, Cache, Sessions |
| **Role-Based Access Control (RBAC)** | Per-role permissions within and across tenants |
| **Cross-Tenant Attack Simulation** | URL manipulation, token reuse, API injection |
| **API Security Testing** | Header validation, token scoping, parameter tampering |
| **Business Logic Testing** | Rules enforcement per module and tenant context |
| **Integration Testing** | Module-to-module flows within tenant boundary |
| **Regression Testing** | Post-fix validation of all critical paths |
| **Edge Case Testing** | Multi-tenant specific boundary conditions |

### 5.2 Out of Scope

| Category | Reason |
|---|---|
| Infrastructure / DevOps | Handled by platform team separately |
| Load / Stress Testing | Covered in a separate performance test plan |
| Third-Party Service Internals | Only integration points tested |
| Mobile App (if separate) | Covered in mobile QA plan |

---

## 6. Module Definitions

### 6.1 Module: Authentication (AUTH)

**Purpose:** Manages user identity, session lifecycle, and token issuance.

**Critical Test Areas:**
- Login with valid/invalid credentials per tenant
- Token must carry `tenant_id` claim (JWT payload validation)
- Session expiry and renewal behavior
- MFA enforcement per tenant configuration
- SSO flows (if enabled) — tenant binding post-SSO
- Logout invalidates session globally
- Concurrent session handling

**Tenant-Specific Risks:**
- Token issued for Tenant A must not authenticate on Tenant B endpoints
- Password reset links must be tenant-scoped
- Account lockout must not affect same email in a different tenant

---

### 6.2 Module: Dashboard

**Purpose:** Central hub showing tenant-specific KPIs, widgets, and recent activity.

**Critical Test Areas:**
- Dashboard widgets only aggregate data from the active tenant
- Activity feed shows only actions within the tenant
- KPI metrics match underlying tenant data
- Widgets do not cache data across tenant sessions

---

### 6.3 Module: Human Resources (HR)

**Purpose:** Employee records, departments, leave management, payroll.

**Critical Test Areas:**
- Employee records are strictly per-tenant
- Department hierarchies isolated to tenant
- Leave requests and approvals within tenant only
- Payroll data never exposed to other tenants
- Org chart renders only tenant employees

---

### 6.4 Module: Projects

**Purpose:** Full project lifecycle management within a tenant.

**Critical Test Areas:**
- Projects are only visible to their owning tenant
- Project members can only be users from the same tenant
- Project IDs cannot be used cross-tenant via API
- Status changes, milestones, and comments scoped to tenant

---

### 6.5 Module: Tasks

**Purpose:** Task tracking linked to projects or standalone.

**Critical Test Areas:**
- Tasks inherit tenant scope from parent project
- Assignment only to users within same tenant
- Subtask hierarchy does not cross tenant boundaries
- Task notifications sent only to correct tenant users

---

### 6.6 Module: To-Do

**Purpose:** Personal task lists for individual users.

**Critical Test Areas:**
- To-Do items private to user AND tenant
- Cannot see another user's to-do even within same tenant (unless explicitly shared)
- Shared to-do items restricted to same-tenant users

---

### 6.7 Module: Settings

**Purpose:** Tenant-level and user-level configuration.

**Critical Test Areas:**
- Tenant Admin can only modify settings for their own tenant
- Billing information strictly tenant-isolated
- Notification preferences do not bleed across tenants
- Custom branding/theme only applies within tenant context

---

### 6.8 Module: User Management

**Purpose:** CRUD operations on users within a tenant.

**Critical Test Areas:**
- User invitation only sends to users within tenant domain (if domain-locked)
- Role assignment/modification restricted to tenant scope
- Deactivating a user in Tenant A does not affect same email in Tenant B
- User listing API never returns users from other tenants

---

### 6.9 Module: Reporting & Analytics

**Purpose:** Data aggregation and export within tenant.

**Critical Test Areas:**
- All reports are tenant-scoped; no cross-tenant data in aggregations
- Export files (CSV/PDF) contain only current tenant data
- Scheduled reports sent only to current tenant users
- Report filters cannot reference IDs from other tenants

---

### 6.10 Module: File Management

**Purpose:** Upload, storage, and sharing of documents within tenant.

**Critical Test Areas:**
- File storage paths namespaced by tenant_id
- Direct file URLs must be authenticated and tenant-validated
- Sharing files restricted to same-tenant users
- File metadata (names, sizes, owners) not exposed cross-tenant

---

### 6.11 Module: Audit Logs

**Purpose:** Immutable activity trail for compliance and debugging.

**Critical Test Areas:**
- Audit log entries carry tenant_id and cannot be viewed cross-tenant
- Super Admin audit view must not expose one tenant's logs to another tenant admin
- Log entries accurately reflect all actions with correct tenant context

---

## 7. Test Strategies

### 7.1 End-to-End Flow Testing

Complete user journeys tested within a single tenant boundary:

| Flow | Description |
|---|---|
| **E2E-01** | Tenant onboarding → Admin setup → User invite → First login |
| **E2E-02** | Project creation → Task assignment → Completion → Report generation |
| **E2E-03** | HR: Employee onboarding → Leave request → Manager approval → Payroll |
| **E2E-04** | Settings change → Effect validation → Audit log verification |
| **E2E-05** | User role change → Permission re-validation → Access confirmation |

### 7.2 Module-Level Testing

Each module tested in isolation with its full CRUD lifecycle and edge cases.

**Standard module test pattern:**
```
CREATE → READ → UPDATE → DELETE → Verify Audit Log
```
All steps performed with Tenant ID context explicit in every request.

### 7.3 Role-Based Testing

Each module tested by each role:

| Module | Super Admin | Tenant Admin | Manager | Employee | Read-Only | Guest |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Auth | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| HR | ✅ | ✅ | ⚠️ | ⚠️ | 📖 | ❌ |
| Projects | ✅ | ✅ | ✅ | ⚠️ | 📖 | ⚠️ |
| Tasks | ✅ | ✅ | ✅ | ✅ | 📖 | ⚠️ |
| Settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| User Mgmt | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| Billing | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Audit Logs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

> ✅ Full Access | ⚠️ Partial/Conditional | 📖 Read-Only | ❌ No Access

### 7.4 Tenant Isolation Testing

Deliberate attempts to cross tenant boundaries across all vectors:

| Vector | Test Approach |
|---|---|
| **API** | Send authenticated Tenant A token to Tenant B resource endpoints |
| **URL** | Replace resource IDs in URLs with IDs from Tenant B |
| **Database** | Verify all queries include `WHERE tenant_id = ?` |
| **Cache** | Check cache key namespacing; flush one tenant's cache and verify isolation |
| **File Storage** | Attempt to access Tenant B file paths while authenticated as Tenant A |
| **Reports** | Trigger reports with cross-tenant resource IDs in parameters |
| **Exports** | Verify exported data contains only current tenant records |

### 7.5 Cross-Tenant Security Testing

See Section 10 for full attack simulation scenarios.

---

## 8. Test Scenarios Per Module

### 8.1 Authentication Scenarios

| Test ID | Scenario | Tenant | Role | Priority |
|---|---|---|---|---|
| AUTH-001 | Successful login with valid credentials | T-001 | Employee | P0 |
| AUTH-002 | Failed login with wrong password | T-001 | Employee | P1 |
| AUTH-003 | JWT token contains correct `tenant_id` claim | T-001 | Admin | P0 |
| AUTH-004 | Token from T-001 rejected on T-002 endpoint | Cross | Admin | P0 |
| AUTH-005 | Password reset link is tenant-scoped | T-002 | Employee | P0 |
| AUTH-006 | Session expiry forces re-authentication | T-001 | Manager | P1 |
| AUTH-007 | MFA enforcement respected per tenant config | T-003 | Admin | P1 |
| AUTH-008 | Account lockout after N failed attempts | T-001 | Employee | P1 |
| AUTH-009 | Concurrent sessions for same user | T-001 | Employee | P2 |
| AUTH-010 | Logout invalidates token server-side | T-002 | Manager | P0 |
| AUTH-011 | SSO login binds user to correct tenant | T-001 | Employee | P0 |
| AUTH-012 | Refresh token cannot be used in different tenant | Cross | Employee | P0 |

### 8.2 Dashboard Scenarios

| Test ID | Scenario | Tenant | Role | Priority |
|---|---|---|---|---|
| DASH-001 | Dashboard loads only current tenant's KPIs | T-001 | Admin | P0 |
| DASH-002 | Widget data matches source module data (projects count) | T-001 | Manager | P1 |
| DASH-003 | Activity feed shows only tenant-scoped events | T-002 | Employee | P0 |
| DASH-004 | Dashboard is blank for new tenant (no data) | T-003 | Admin | P2 |
| DASH-005 | Switching user role updates dashboard widgets | T-001 | Manager | P2 |
| DASH-006 | Caching: T-001 data not served from T-002 session cache | Cross | Admin | P0 |

### 8.3 HR Module Scenarios

| Test ID | Scenario | Tenant | Role | Priority |
|---|---|---|---|---|
| HR-001 | Create employee record in Tenant A | T-001 | Admin | P1 |
| HR-002 | Employee list returns only T-001 employees | T-001 | Manager | P0 |
| HR-003 | Read T-002 employee by ID while authenticated as T-001 | Cross | Admin | P0 |
| HR-004 | Update employee record across tenant boundary via API | Cross | Admin | P0 |
| HR-005 | Delete employee – verify cascade within tenant only | T-001 | Admin | P1 |
| HR-006 | Leave request workflow within tenant | T-002 | Employee | P1 |
| HR-007 | Manager approval restricted to own tenant employees | T-001 | Manager | P0 |
| HR-008 | Payroll data not exposed in GET /employees response | T-001 | Manager | P1 |
| HR-009 | Department list filtered to tenant | T-001 | Admin | P0 |
| HR-010 | Employee cannot view another employee's personal data | T-001 | Employee | P1 |

### 8.4 Projects Scenarios

| Test ID | Scenario | Tenant | Role | Priority |
|---|---|---|---|---|
| PROJ-001 | Create project in T-001 | T-001 | Manager | P1 |
| PROJ-002 | Project list returns only T-001 projects | T-001 | Employee | P0 |
| PROJ-003 | GET /projects/{T002_project_id} returns 403/404 from T-001 session | Cross | Manager | P0 |
| PROJ-004 | Assign T-002 user to T-001 project via API | Cross | Admin | P0 |
| PROJ-005 | Project milestones scoped to tenant | T-001 | Manager | P1 |
| PROJ-006 | Project completion triggers notification to correct tenant users | T-002 | Manager | P1 |
| PROJ-007 | Archive project does not affect other tenants | T-001 | Admin | P2 |
| PROJ-008 | Project search returns only tenant-scoped results | T-001 | Employee | P0 |

### 8.5 Tasks Scenarios

| Test ID | Scenario | Tenant | Role | Priority |
|---|---|---|---|---|
| TASK-001 | Create task under T-001 project | T-001 | Employee | P1 |
| TASK-002 | Task assignment only offers T-001 users in dropdown | T-001 | Manager | P0 |
| TASK-003 | GET /tasks/{T002_task_id} rejected from T-001 session | Cross | Employee | P0 |
| TASK-004 | Task status update by non-owner within tenant | T-001 | Employee | P1 |
| TASK-005 | Subtask creation stays within tenant boundary | T-001 | Manager | P1 |
| TASK-006 | Task comment notifications to correct tenant users only | T-002 | Employee | P1 |
| TASK-007 | Task due date reminder delivered to correct tenant user | T-001 | Employee | P2 |

### 8.6 Settings Scenarios

| Test ID | Scenario | Tenant | Role | Priority |
|---|---|---|---|---|
| SET-001 | Tenant Admin updates branding for own tenant | T-001 | Admin | P1 |
| SET-002 | Tenant Admin cannot access T-002 settings via API | Cross | Admin | P0 |
| SET-003 | Billing update scoped to tenant | T-002 | Admin | P0 |
| SET-004 | Employee cannot access Settings module | T-001 | Employee | P0 |
| SET-005 | Notification preferences saved per tenant | T-001 | Admin | P2 |
| SET-006 | Integration webhook URL change scoped to tenant | T-001 | Admin | P1 |

### 8.7 User Management Scenarios

| Test ID | Scenario | Tenant | Role | Priority |
|---|---|---|---|---|
| USR-001 | Admin invites new user to T-001 | T-001 | Admin | P1 |
| USR-002 | GET /users returns only T-001 users | T-001 | Admin | P0 |
| USR-003 | GET /users/{T002_user_id} from T-001 session returns 403 | Cross | Admin | P0 |
| USR-004 | Role escalation attempt via API body injection | T-001 | Employee | P0 |
| USR-005 | Deactivate user in T-001; same email in T-002 unaffected | Cross | Admin | P0 |
| USR-006 | Manager cannot promote user to Admin | T-001 | Manager | P0 |
| USR-007 | User list pagination does not bleed into next tenant | Cross | Admin | P0 |

### 8.8 Reporting Scenarios

| Test ID | Scenario | Tenant | Role | Priority |
|---|---|---|---|---|
| RPT-001 | Generate project report for T-001 | T-001 | Manager | P1 |
| RPT-002 | Report does not contain T-002 records | Cross | Manager | P0 |
| RPT-003 | CSV export contains only T-001 data | T-001 | Admin | P0 |
| RPT-004 | Pass T-002 project IDs in T-001 report filter | Cross | Admin | P0 |
| RPT-005 | Scheduled report delivered to correct tenant users | T-002 | Admin | P1 |

### 8.9 File Management Scenarios

| Test ID | Scenario | Tenant | Role | Priority |
|---|---|---|---|---|
| FILE-001 | Upload file in T-001, verify path is `/tenants/T-001/...` | T-001 | Employee | P0 |
| FILE-002 | Access T-002 file URL while authenticated as T-001 | Cross | Employee | P0 |
| FILE-003 | Share file only with T-001 users | T-001 | Employee | P0 |
| FILE-004 | List files returns only T-001 files | T-001 | Admin | P0 |
| FILE-005 | Delete file in T-001 does not remove T-002 file | Cross | Admin | P1 |

### 8.10 Audit Log Scenarios

| Test ID | Scenario | Tenant | Role | Priority |
|---|---|---|---|---|
| AUD-001 | All CRUD actions generate audit entries with tenant_id | T-001 | Admin | P1 |
| AUD-002 | T-001 Admin cannot view T-002 audit logs | Cross | Admin | P0 |
| AUD-003 | Audit log entries are immutable | T-001 | Admin | P0 |
| AUD-004 | Super Admin views T-001 logs without exposing T-002 | T-001 | SuperAdmin | P0 |

---

## 9. Tenant Isolation Test Design

### 9.1 Data Isolation Matrix

For every test in this section, the tester must:

1. Authenticate as a user of **Tenant A (T-001)**
2. Attempt to access/modify a resource belonging to **Tenant B (T-002)**
3. **Expected result** for all: `HTTP 403 Forbidden` or `HTTP 404 Not Found` — never `200 OK` with foreign data

| Test ID | Resource Targeted | Attack Method | Expected |
|---|---|---|---|
| ISO-001 | T-002 Employee record | Direct GET by ID | 403/404 |
| ISO-002 | T-002 Project | URL ID substitution | 403/404 |
| ISO-003 | T-002 Tasks | API parameter injection | 403/404 |
| ISO-004 | T-002 User list | Unauthenticated GET | 401 |
| ISO-005 | T-002 Files | Direct URL access | 403 |
| ISO-006 | T-002 Audit Logs | API call with T-001 token | 403 |
| ISO-007 | T-002 Settings | PUT/PATCH request | 403 |
| ISO-008 | T-002 Reports | Export trigger | 403 |
| ISO-009 | T-002 Dashboard data | Cache probe | 403/No data |
| ISO-010 | T-002 Notifications | Read attempt | 403 |

### 9.2 API Layer Isolation Validation

For each API endpoint, verify:

```
Checklist:
[ ] tenant_id is extracted from JWT token, NOT from request body or URL param
[ ] Database query includes WHERE tenant_id = :tenantFromToken
[ ] Response payload contains no tenant_id fields that could be enumerated
[ ] Error messages do not reveal existence of other tenant resources
[ ] 404 is returned (not 403) when resource doesn't exist in ANY tenant
      (Prevents tenant enumeration via error code difference)
```

### 9.3 Database Query Verification

All data-fetching functions must follow this pattern:

```sql
-- CORRECT: Tenant-scoped query
SELECT * FROM projects 
WHERE id = :requested_id 
  AND tenant_id = :tenant_id_from_jwt;

-- VULNERABLE: Missing tenant scope (must detect and fail)
SELECT * FROM projects 
WHERE id = :requested_id;
```

**Test method:** Use SQL query logging / APM tools to inspect raw queries during test execution and confirm `tenant_id` filter is always present.

### 9.4 Cache Isolation Verification

| Test ID | Scenario | Steps | Expected |
|---|---|---|---|
| CACHE-001 | T-001 loads dashboard; T-002 loads dashboard | Check if T-002 receives T-001 cached data | Separate cache entries |
| CACHE-002 | T-001 cache is cleared; T-002 session unaffected | Flush T-001 cache key | T-002 data unchanged |
| CACHE-003 | Cache key inspection | Inspect Redis/Memcached keys during test | All keys prefixed with `tenant_id` |
| CACHE-004 | Session store does not bleed | Two users same browser, different tenants | Zero cross-contamination |

### 9.5 File Storage Isolation

```
Expected storage structure:
/tenants/
  T-001/
    files/
    avatars/
    exports/
  T-002/
    files/
    avatars/
    exports/
```

**Tests:**
- Authenticated T-001 user requests signed URL for T-002 file → 403
- Unsigned T-002 file URL accessible without auth → 401/403
- T-001 export job cannot read from T-002 storage path

---

## 10. Cross-Tenant Attack Simulations

### 10.1 URL Manipulation Attacks

| Attack ID | Description | Steps | Expected |
|---|---|---|---|
| ATK-001 | Replace project ID in URL | Auth as T-001; GET `/api/projects/{T002_project_id}` | 403/404 |
| ATK-002 | Replace user ID in URL | Auth as T-001; GET `/api/users/{T002_user_id}` | 403/404 |
| ATK-003 | Replace employee ID in URL | Auth as T-001; GET `/api/hr/employees/{T002_emp_id}` | 403/404 |
| ATK-004 | Replace task ID | Auth as T-001; PUT `/api/tasks/{T002_task_id}` | 403/404 |
| ATK-005 | Traverse path to tenant root | Auth as T-001; GET `/api/tenants/T-002/` | 403 |

### 10.2 API Parameter Injection Attacks

| Attack ID | Description | Payload | Expected |
|---|---|---|---|
| ATK-010 | Inject tenant_id in POST body | `{"tenant_id": "T-002", "name": "Evil Project"}` | Ignored; record created in T-001 |
| ATK-011 | Inject tenant_id in query param | `GET /api/projects?tenant_id=T-002` | Ignored; returns T-001 data only |
| ATK-012 | Inject tenant_id in PATCH body | `{"tenant_id": "T-002"}` | Rejected; no data change |
| ATK-013 | Filter parameter with cross-tenant ID | `GET /api/tasks?project_id={T002_project_id}` | Empty result or 403 |
| ATK-014 | Assign cross-tenant user to resource | `{"assignee_id": "{T002_user_id}"}` | Validation error |

### 10.3 Token Reuse Attacks

| Attack ID | Description | Steps | Expected |
|---|---|---|---|
| ATK-020 | Reuse T-001 JWT on T-002 subdomain | Use T-001 token on `api.T-002.app.com` | 401/403 |
| ATK-021 | Replay expired token | Use token after TTL expiry | 401 |
| ATK-022 | Modify JWT tenant_id claim | Decode JWT, change `tenant_id`, re-sign with wrong key | 401 (signature invalid) |
| ATK-023 | Use T-001 refresh token for T-002 | POST `/auth/refresh` with T-001 refresh on T-002 context | 401 |
| ATK-024 | Impersonate Super Admin | Forge `role: "super_admin"` in JWT payload | 401 (signature invalid) |

### 10.4 Tenant Enumeration Attacks

| Attack ID | Description | Expected Defense |
|---|---|---|
| ATK-030 | Probe sequential tenant IDs | `GET /api/tenants/1`, `/api/tenants/2` → no enumeration |
| ATK-031 | Error code oracle | 403 vs 404 must be consistent — avoid exposing resource existence |
| ATK-032 | Timing attack via response time | Response time must not differ between "tenant exists" and "not found" |
| ATK-033 | Username enumeration across tenants | Password reset must not reveal if email exists in other tenant |

---

## 11. Role × Tenant Matrix Testing

### 11.1 Permission Boundary Tests

**Rule:** Admin of Tenant A ≠ Admin of Tenant B. Permissions are scoped within a tenant. No role, regardless of its level, grants access outside its tenant.

| Test ID | Actor | Action | Target | Expected |
|---|---|---|---|---|
| RBT-001 | T-001 Admin | Read T-002 Settings | T-002 | 403 |
| RBT-002 | T-001 Admin | Create user in T-002 | T-002 | 403 |
| RBT-003 | T-001 Admin | Delete T-002 project | T-002 | 403 |
| RBT-004 | T-001 Employee | Access T-001 Settings | T-001 | 403 (role insufficient) |
| RBT-005 | T-001 Manager | Promote T-001 user to Admin | T-001 | 403 (role insufficient) |
| RBT-006 | T-001 Read-Only | Write to any T-001 resource | T-001 | 403 |
| RBT-007 | T-002 Admin | View T-001 audit logs | T-001 | 403 |
| RBT-008 | Super Admin | View T-001 data (legitimate) | T-001 | 200 (but scoped) |
| RBT-009 | Super Admin | Write to T-001 data | T-001 | 403 (Super Admin is read-only on tenant data) |
| RBT-010 | T-001 Guest | Access HR module | T-001 | 403 |

### 11.2 Role Escalation Prevention

| Test ID | Attempt | Expected |
|---|---|---|
| ESC-001 | Employee POSTs `{"role": "admin"}` in profile update | Role field ignored |
| ESC-002 | Manager sends API call to grant themselves Admin role | 403 |
| ESC-003 | User modifies JWT role claim client-side | 401 (signature invalid) |
| ESC-004 | Guest user tries to access Manager-level endpoints | 403 |
| ESC-005 | T-001 Admin tries to grant Super Admin role to self | 403 |

---

## 12. Edge Cases & Special Scenarios

### 12.1 Multi-Tenant Edge Cases

| Edge Case ID | Scenario | Expected Behavior |
|---|---|---|
| EDGE-001 | Same email in two tenants (e.g., `john@company.com` in T-001 and T-002) | Independent accounts; login context determines tenant |
| EDGE-002 | Tenant with zero users tries to run reports | Empty result, no crash |
| EDGE-003 | Tenant is suspended mid-session | Active sessions immediately invalidated |
| EDGE-004 | User deleted while session active | Next request returns 401 |
| EDGE-005 | Tenant A deleted; orphaned records in shared tables | No data from T-001 accessible; cascade delete verified |
| EDGE-006 | Bulk operation (e.g., mass email) crosses tenant boundary | Bulk job filtered strictly to source tenant |
| EDGE-007 | Background job triggered by T-001 event; processes T-002 data | Job must carry tenant context; cross-processing is a critical bug |
| EDGE-008 | Pagination of large dataset at tenant boundary | Page N of T-001 never starts with T-002 data |
| EDGE-009 | Search feature (full-text) across tenant boundary | Search index filtered by tenant_id |
| EDGE-010 | Import/CSV upload maps IDs from foreign tenant | Validation rejects unknown IDs |
| EDGE-011 | Two tenants create identical resource names | No collision; names are tenant-local |
| EDGE-012 | API rate limiting: T-001 exhausts limits; T-002 unaffected | Rate limits are per-tenant |
| EDGE-013 | Cache stampede during tenant A data refresh | T-002 unaffected; T-001 cache rebuilt correctly |
| EDGE-014 | Timezone difference between tenant users | Data timestamps stored in UTC; rendered per user timezone |
| EDGE-015 | Super Admin performs action in T-001; audit shows correct tenant | Audit log entry carries T-001 as tenant, Super Admin as actor |

### 12.2 Data Integrity Edge Cases

| Edge Case ID | Scenario | Expected Behavior |
|---|---|---|
| DINT-001 | Concurrent updates to same record by two T-001 users | Last-write-wins or optimistic lock conflict error |
| DINT-002 | Transaction rolls back; tenant_id not persisted incorrectly | Rollback complete; no partial tenant data |
| DINT-003 | Foreign key pointing to deleted parent (within tenant) | Cascades correctly within tenant; no orphan records |

---

## 13. Test Data Strategy

### 13.1 Tenant Test Accounts

| Tenant | Tenant ID | Company Name | Admin Email |
|---|---|---|---|
| Tenant A | T-001 | Acme Corp | admin@acme-test.com |
| Tenant B | T-002 | Beta Ltd | admin@beta-test.com |
| Tenant C | T-003 | Gamma Inc | admin@gamma-test.com |

### 13.2 Test Users Per Tenant

| User | Tenant | Role | Email |
|---|---|---|---|
| Admin A | T-001 | Tenant Admin | admin@acme-test.com |
| Manager A | T-001 | Manager | manager@acme-test.com |
| Employee A1 | T-001 | Employee | emp1@acme-test.com |
| ReadOnly A | T-001 | Read-Only | readonly@acme-test.com |
| Admin B | T-002 | Tenant Admin | admin@beta-test.com |
| Employee B1 | T-002 | Employee | emp1@beta-test.com |
| Admin C | T-003 | Tenant Admin | admin@gamma-test.com |
| Super Admin | Platform | Super Admin | superadmin@platform-test.com |

### 13.3 Seeded Test Data

Each tenant (T-001 and T-002) must have pre-seeded:
- 5 Employees
- 3 Projects (with unique IDs)
- 10 Tasks (linked to projects)
- 5 Files (uploaded with known names)
- 3 Departments
- 1 complete Audit Log trail (from previous seeded operations)

> **CRITICAL:** The specific resource IDs of T-002 must be documented during seeding so they can be used explicitly in cross-tenant attack tests.

---

## 14. Entry & Exit Criteria

### 14.1 Entry Criteria (Before Testing Begins)

| Criteria | Verification |
|---|---|
| Test environment is deployed and stable | ✅ Health check passes |
| Test data is seeded for all three tenants | ✅ Seed script executed |
| All test accounts are created and accessible | ✅ Login verified |
| API documentation is available | ✅ Swagger/Postman collection ready |
| Test IDs for cross-tenant resources documented | ✅ ID registry prepared |
| Access to logs, query monitoring tools available | ✅ APM/logging confirmed |

### 14.2 Exit Criteria (Before Production Sign-Off)

| Criteria | Target |
|---|---|
| Zero P0 (Critical) bugs open | 0 critical open bugs |
| Zero cross-tenant data leakage scenarios found (or fixed) | 0 data leakage |
| All P1 (High) bugs resolved or accepted with plan | ≤ 0 unmitigated |
| Test case pass rate | ≥ 98% |
| All role-based access tests passed | 100% |
| All isolation tests passed | 100% |
| Regression suite passes post-fix | 100% of regression cases |

---

## 15. Risk Register

| Risk ID | Risk Description | Probability | Impact | Severity | Mitigation |
|---|---|---|---|---|---|
| RISK-001 | Missing tenant_id filter in a DB query | Medium | Critical | 🔴 HIGH | Query audit + automated linting |
| RISK-002 | JWT tenant_id claim is not validated server-side | Low | Critical | 🔴 HIGH | Token validation middleware review |
| RISK-003 | Shared cache serving cross-tenant data | Medium | Critical | 🔴 HIGH | Cache key audit; namespace enforcement |
| RISK-004 | File storage bucket not namespaced | Low | Critical | 🔴 HIGH | Storage path policy enforcement |
| RISK-005 | Role escalation via API body | Medium | High | 🟠 MEDIUM-HIGH | Input whitelist; role immutability enforcement |
| RISK-006 | Pagination bleeding across tenant boundaries | Medium | High | 🟠 MEDIUM-HIGH | Cursor-based pagination with tenant scope |
| RISK-007 | Background job loses tenant context | Low | Critical | 🔴 HIGH | Job queue tenant tagging |
| RISK-008 | Search index not filtered by tenant | Medium | High | 🟠 MEDIUM-HIGH | Index configuration review |
| RISK-009 | Audit logs viewable cross-tenant | Low | High | 🟠 MEDIUM-HIGH | Access control review on log endpoint |
| RISK-010 | New feature releases breaking existing isolation | Medium | High | 🟠 MEDIUM-HIGH | Regression suite on every release |

---

## 16. Tools & Environment

### 16.1 Test Environment

| Environment | Purpose | Base URL |
|---|---|---|
| **QA** | Primary test execution | `https://qa.app.example.com` |
| **Staging** | Pre-production validation | `https://staging.app.example.com` |
| **Production** | Read-only smoke tests only | `https://app.example.com` |

### 16.2 Tooling Stack

| Category | Tool |
|---|---|
| API Testing | Postman / Bruno / REST Client |
| Automation Framework | Playwright (E2E) + Jest (Unit) |
| Performance | k6 / JMeter |
| Security / Pen Testing | OWASP ZAP, Burp Suite Community |
| Query Monitoring | DataDog APM / New Relic |
| Cache Inspection | Redis CLI / RedisInsight |
| Test Management | Jira / TestRail |
| CI/CD Integration | GitHub Actions / GitLab CI |
| Bug Tracking | Jira (linked to test cases) |
| Documentation | Markdown + Confluence |

---

## 17. Defect Classification Model

### 17.1 Severity Levels

| Severity | Code | Definition | SLA |
|---|---|---|---|
| **Critical** | SEV-1 | Cross-tenant data leakage, unauthorized access, token bypass | Immediate; block release |
| **High** | SEV-2 | Role/permission violations, incorrect tenant scoping | Fix before release |
| **Medium** | SEV-3 | Functional bugs, incorrect business logic, data integrity | Fix in current sprint |
| **Low** | SEV-4 | UI issues, cosmetic bugs, minor UX problems | Scheduled backlog |

### 17.2 Cross-Tenant Bug Escalation

Any bug where:
- Data from Tenant X is returned to a Tenant Y session
- A token from Tenant X successfully authenticates against Tenant Y resources
- A file, report, or export contains records from a foreign tenant

→ **Auto-elevated to SEV-1, immediate Slack/PagerDuty alert, release blocked**

---

## 18. QA Execution Phases

| Phase | Document Output | Status |
|---|---|---|
| **Phase 1: Test Planning** | `test-plan.md` (this document) | ✅ Complete |
| **Phase 2: Test Design** | Included in this plan | ✅ Complete |
| **Phase 3: Test Execution** | `test-execution-report.md` | ⏳ Pending |
| **Phase 4: Bug Tracking** | `bug-report.md` | ⏳ Pending |
| **Phase 5: Fix Validation** | `fix-validation-report.md` | ⏳ Pending |
| **Phase 6: Regression Testing** | `regression-report.md` | ⏳ Pending |
| **Phase 7: Final Report** | `final-report.md` | ⏳ Pending |

> **Note:** Do NOT proceed to Phase 3 (Execution) until this test plan has been reviewed and approved by the QA Lead and Engineering Lead.

---

## 19. Sign-Off & Approvals

| Role | Name | Signature | Date |
|---|---|---|---|
| QA Lead | _________________ | _________________ | ________ |
| Engineering Lead | _________________ | _________________ | ________ |
| Product Manager | _________________ | _________________ | ________ |
| Security Lead | _________________ | _________________ | ________ |

---

*Document End — Multi-Tenant SaaS QA Master Test Plan v1.0.0*

---

> 🔒 **Security Notice:** This document contains attack simulation scenarios and vulnerability test patterns. Treat as confidential. Do not share outside the QA/Engineering team.
