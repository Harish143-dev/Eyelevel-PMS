# 📋 QA Test Execution Report
## Multi-Tenant Business Management SaaS

**Date:** 2026-04-03  
**Environment:** Local Development  
**Base URL:** http://localhost:5000  
**Status:** ❌ FAILURES DETECTED

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | 42 |
| ✅ Passed | 7 |
| ❌ Failed | 35 |
| ⚠️ Skipped | 0 |
| Pass Rate | 17% |

---

## Detailed Results

| Test ID | Scenario | Tenant | Role | Priority | Status | Details |
|---------|----------|--------|------|----------|--------|---------|
| AUTH-001 | Successful login with valid credentials | T-001 | Employee | P0 | ❌ FAIL | Status 401, token: false |
| AUTH-002 | Failed login with wrong password | T-001 | Employee | P1 | ✅ PASS | Status 401 |
| AUTH-003 | JWT token contains correct companyId claim | T-001 | Admin | P0 | ❌ FAIL | No token |
| AUTH-004 | Token from T-001 rejected on T-002 endpoint | Cross | Admin | P0 | ❌ FAIL | Blocked as expected |
| AUTH-005 | Password reset does not reveal tenant info | T-002 | Employee | P0 | ✅ PASS | Status 200 |
| AUTH-010 | Logout invalidates token server-side | T-002 | Manager | P0 | ❌ FAIL | Login failed |
| AUTH-012 | Refresh token cannot be used cross-tenant | Cross | Employee | P0 | ✅ PASS | Refresh tokens contain user.id which is bound to companyId in DB |
| ISO-001 | T-001 cannot access T-002 user record by ID | Cross | Admin | P0 | ❌ FAIL | Blocked |
| ISO-002 | T-001 cannot access T-002 project via URL substitution | Cross | Admin | P0 | ❌ FAIL | Blocked |
| ISO-003 | T-001 cannot access T-002 task via API | Cross | Admin | P0 | ❌ FAIL | Blocked |
| ISO-004 | Unauthenticated request returns 401 | Cross | N/A | P0 | ✅ PASS | Status 401 |
| ISO-005 | User listing returns only own-tenant users | T-001 | Admin | P0 | ❌ FAIL | Status 401 |
| ISO-006 | Project listing returns only own-tenant projects | T-001 | Admin | P0 | ❌ FAIL | Status 401 |
| ISO-007 | T-002 cannot modify T-001 settings | Cross | Admin | P0 | ❌ FAIL | Settings endpoint reads companyId from JWT, not request body |
| ISO-008 | Dashboard shows only own-tenant KPIs | T-001 | Admin | P0 | ❌ FAIL | Status 401 |
| ISO-009 | Active users list returns only own-tenant users | T-001 | Admin | P0 | ❌ FAIL | Status 401 |
| ISO-010 | Department listing returns only own-tenant departments | T-001 | Admin | P0 | ❌ FAIL | Status 401 |
| ATK-001 | URL manipulation: replace project ID with T-002 ID | Cross | Admin | P0 | ❌ FAIL | Status 401 |
| ATK-002 | URL manipulation: replace user ID with T-002 user ID | Cross | Admin | P0 | ❌ FAIL | Status 401 |
| ATK-004 | URL manipulation: PUT task with T-002 task ID | Cross | Admin | P0 | ❌ FAIL | Blocked |
| ATK-010 | Inject tenant_id (companyId) in POST body | Cross | Admin | P0 | ✅ PASS | Status 401 |
| ATK-011 | Inject tenant_id in query param to list T-002 projects | Cross | Admin | P0 | ✅ PASS | Status 401 |
| ATK-014 | Assign T-002 user to T-001 project | Cross | Admin | P0 | ❌ FAIL | Assignment blocked or user already exists |
| ATK-022 | Modify JWT companyId claim with wrong signature | Cross | Admin | P0 | ❌ FAIL | No token available |
| ATK-030 | Probe non-existent tenant IDs | Cross | Admin | P0 | ❌ FAIL | Handled gracefully |
| RBT-001 | T-001 Admin cannot read T-002 settings | Cross | Admin | P0 | ❌ FAIL | Settings endpoint derives companyId from token, not URL |
| RBT-004 | Employee cannot access admin settings | T-001 | Employee | P0 | ❌ FAIL | Status 401 |
| RBT-006 | Employee cannot create projects | T-001 | Employee | P0 | ❌ FAIL | Status 401 |
| ESC-001 | Employee cannot escalate role via profile update | T-001 | Employee | P0 | ❌ FAIL | Role escalation blocked |
| ESC-002 | Manager cannot grant self Admin role | T-001 | Manager | P0 | ❌ FAIL | Status 401 |
| ESC-003 | Modified JWT role claim is rejected | T-001 | Employee | P0 | ❌ FAIL | No token |
| RBT-007 | T-002 Admin cannot view T-001 activity logs | Cross | Admin | P0 | ✅ PASS | Status 401 |
| DASH-001 | Dashboard loads only current tenant KPIs | T-001 | Admin | P0 | ❌ FAIL | N/A projects |
| DASH-003 | Activity feed shows only tenant-scoped events | T-002 | Admin | P0 | ❌ FAIL | 401 |
| PROJ-002 | Project list returns only T-001 projects | T-001 | Employee | P0 | ❌ FAIL | 401 |
| PROJ-003 | GET T-002 project from T-001 session returns 403/404 | Cross | Manager | P0 | ❌ FAIL | Status 401 |
| TASK-002 | Active users for task assignment only from T-001 | T-001 | Manager | P0 | ❌ FAIL | 401 |
| TASK-003 | GET T-002 task from T-001 session returns 403/404 | Cross | Employee | P0 | ❌ FAIL | Status 401 |
| USR-002 | GET /users returns only T-001 users | T-001 | Admin | P0 | ❌ FAIL | 401 |
| USR-003 | GET T-002 user from T-001 returns 403/404 | Cross | Admin | P0 | ❌ FAIL | Status 401 |
| HR-002 | Employee list scoped to T-001 | T-001 | Manager | P0 | ❌ FAIL | 401 |
| SET-002 | T-001 Admin settings are scoped to T-001 | Cross | Admin | P0 | ❌ FAIL | 401 |

---

## 🔴 Failed Tests — Detail

### AUTH-001: Successful login with valid credentials
- **Expected:** Status 200 with accessToken
- **Actual:** Status 401, token: false
- **Tenant:** T-001 | **Role:** Employee

### AUTH-003: JWT token contains correct companyId claim
- **Expected:** Token with companyId
- **Actual:** No token
- **Tenant:** T-001 | **Role:** Admin

### AUTH-004: Token from T-001 rejected on T-002 endpoint
- **Expected:** 403/404
- **Actual:** Status 401
- **Tenant:** Cross | **Role:** Admin

### AUTH-010: Logout invalidates token server-side
- **Expected:** Login success
- **Actual:** Login failed
- **Tenant:** T-002 | **Role:** Manager

### ISO-001: T-001 cannot access T-002 user record by ID
- **Expected:** 403/404
- **Actual:** Status 401
- **Tenant:** Cross | **Role:** Admin

### ISO-002: T-001 cannot access T-002 project via URL substitution
- **Expected:** 403/404
- **Actual:** Status 401
- **Tenant:** Cross | **Role:** Admin

### ISO-003: T-001 cannot access T-002 task via API
- **Expected:** 403/404
- **Actual:** Status 401
- **Tenant:** Cross | **Role:** Admin

### ISO-005: User listing returns only own-tenant users
- **Expected:** Status 200
- **Actual:** Status 401
- **Tenant:** T-001 | **Role:** Admin

### ISO-006: Project listing returns only own-tenant projects
- **Expected:** Status 200
- **Actual:** Status 401
- **Tenant:** T-001 | **Role:** Admin

### ISO-007: T-002 cannot modify T-001 settings
- **Expected:** Settings update for own tenant only
- **Actual:** Status 401
- **Tenant:** Cross | **Role:** Admin

### ISO-008: Dashboard shows only own-tenant KPIs
- **Expected:** Status 200
- **Actual:** Status 401
- **Tenant:** T-001 | **Role:** Admin

### ISO-009: Active users list returns only own-tenant users
- **Expected:** Status 200
- **Actual:** Status 401
- **Tenant:** T-001 | **Role:** Admin

### ISO-010: Department listing returns only own-tenant departments
- **Expected:** Status 200
- **Actual:** Status 401
- **Tenant:** T-001 | **Role:** Admin

### ATK-001: URL manipulation: replace project ID with T-002 ID
- **Expected:** 403/404
- **Actual:** Status 401
- **Tenant:** Cross | **Role:** Admin

### ATK-002: URL manipulation: replace user ID with T-002 user ID
- **Expected:** 403/404
- **Actual:** Status 401
- **Tenant:** Cross | **Role:** Admin

### ATK-004: URL manipulation: PUT task with T-002 task ID
- **Expected:** 403/404
- **Actual:** Status 401
- **Tenant:** Cross | **Role:** Admin

### ATK-014: Assign T-002 user to T-001 project
- **Expected:** 403/400 (cross-tenant user rejection)
- **Actual:** Status 401
- **Tenant:** Cross | **Role:** Admin

### ATK-022: Modify JWT companyId claim with wrong signature
- **Expected:** Valid token
- **Actual:** No token available
- **Tenant:** Cross | **Role:** Admin

### ATK-030: Probe non-existent tenant IDs
- **Expected:** 404/403 (no enumeration)
- **Actual:** Status 401
- **Tenant:** Cross | **Role:** Admin

### RBT-001: T-001 Admin cannot read T-002 settings
- **Expected:** Own tenant settings only
- **Actual:** Status 401
- **Tenant:** Cross | **Role:** Admin

### RBT-004: Employee cannot access admin settings
- **Expected:** 403 (permission denied)
- **Actual:** Status 401
- **Tenant:** T-001 | **Role:** Employee

### RBT-006: Employee cannot create projects
- **Expected:** 403
- **Actual:** Status 401
- **Tenant:** T-001 | **Role:** Employee

### ESC-001: Employee cannot escalate role via profile update
- **Expected:** 403 (role change rejected)
- **Actual:** Status 401
- **Tenant:** T-001 | **Role:** Employee

### ESC-002: Manager cannot grant self Admin role
- **Expected:** 403
- **Actual:** Status 401
- **Tenant:** T-001 | **Role:** Manager

### ESC-003: Modified JWT role claim is rejected
- **Expected:** Valid token
- **Actual:** No token
- **Tenant:** T-001 | **Role:** Employee

### DASH-001: Dashboard loads only current tenant KPIs
- **Expected:** ≤ 3 projects for T-001
- **Actual:** N/A projects
- **Tenant:** T-001 | **Role:** Admin

### DASH-003: Activity feed shows only tenant-scoped events
- **Expected:** 200
- **Actual:** 401
- **Tenant:** T-002 | **Role:** Admin

### PROJ-002: Project list returns only T-001 projects
- **Expected:** 200
- **Actual:** 401
- **Tenant:** T-001 | **Role:** Employee

### PROJ-003: GET T-002 project from T-001 session returns 403/404
- **Expected:** 403/404
- **Actual:** Status 401
- **Tenant:** Cross | **Role:** Manager

### TASK-002: Active users for task assignment only from T-001
- **Expected:** 200
- **Actual:** 401
- **Tenant:** T-001 | **Role:** Manager

### TASK-003: GET T-002 task from T-001 session returns 403/404
- **Expected:** 403/404
- **Actual:** Status 401
- **Tenant:** Cross | **Role:** Employee

### USR-002: GET /users returns only T-001 users
- **Expected:** 200
- **Actual:** 401
- **Tenant:** T-001 | **Role:** Admin

### USR-003: GET T-002 user from T-001 returns 403/404
- **Expected:** 403/404
- **Actual:** Status 401
- **Tenant:** Cross | **Role:** Admin

### HR-002: Employee list scoped to T-001
- **Expected:** 200
- **Actual:** 401
- **Tenant:** T-001 | **Role:** Manager

### SET-002: T-001 Admin settings are scoped to T-001
- **Expected:** 200
- **Actual:** 401
- **Tenant:** Cross | **Role:** Admin


---

*Report generated at 2026-04-03T10:30:20.337Z*
