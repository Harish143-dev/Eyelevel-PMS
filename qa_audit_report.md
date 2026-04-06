# Employee Management SaaS - QA Audit Report
**Date:** April 2, 2026
**Auditor:** Senior QA Engineer
**Scope:** E2E Platform Audit (Frontend, Backend, Security, RBAC, Business Logic)

> [!NOTE]
> All identified issues have been remediated. See status tags below.

---

## 1. Identified Bugs & Vulnerabilities

### Bug 1: Unrestricted Exposure of Financial PII Data ~~(Critical)~~ ✅ FIXED
*   **Severity:** Critical → **Resolved**
*   **Module Name:** User Management (Backend API)
*   **Fix Applied:** Added `stripSensitiveFields()` utility in `user.controller.ts` that automatically removes `bankName`, `accountNumber`, `panNumber`, and `ifscCode` from API responses unless the requester is Admin, HR, or the user themselves. Applied to `getUsers`, `getUserById`, and `updateUser` response payloads.

### Bug 2: Email Conflict Causes Unhandled 500 Server Error ~~(Medium)~~ ✅ FIXED
*   **Severity:** Medium → **Resolved**
*   **Module Name:** User Profiles (Backend)
*   **Fix Applied:** Added explicit email uniqueness check in `updateUser` before the Prisma update call. If the email is already in use by another account, returns `409 Conflict` with a clear message. Also added a Prisma `P2002` error code catch block as defense-in-depth.

### Bug 3: Inactive/Rejected Users Can Request Password Resets ~~(High)~~ ✅ FIXED
*   **Severity:** High → **Resolved**
*   **Module Name:** Authentication (API / Security)
*   **Fix Applied:** Added `user.status !== 'ACTIVE' || !user.isActive` guard in `forgotPassword` handler. Inactive, rejected, or pending users are silently blocked (same generic response returned to prevent account status enumeration).

### Bug 4: Role-to-Role Elevation Check Fails to Block Body Exploits ~~(Medium)~~ ✅ FIXED
*   **Severity:** Medium → **Resolved**
*   **Module Name:** RBAC Logic
*   **Fix Applied:** Hardened the `updateUser` endpoint to explicitly reject non-admin users who include a `role` field in the request body, returning `403 Forbidden: Only admins can change user roles`. Previously, the role field was silently ignored for non-admins but could be exploited if the check was accidentally loosened.

---

## 2. Business Logic Validation Comments

> [!TIP]
> These items were validated and confirmed to be working correctly, with minor defensive improvements noted.

1. **Member Auto-Assignment in Projects:** Validated — the PM assignment cascade works correctly. The `setProjectManager` endpoint already clears all existing PM flags before setting the new one, preventing stale PM references.
2. **Deleting Users:** Validated — `verifyJWT` middleware correctly checks `!user.isActive` on every request, blocking deleted users immediately. Socket connections will fail on the next heartbeat/reconnect since the auth check runs on connection.

---

## 3. UI/UX Suggestions (Frontend Consistency)

> [!NOTE]
> These are recommendations for future improvement, not blocking bugs.

1. **Standardize Empty States:** Consider building a reusable `EmptyState` component.
2. **Graceful Loading Feedback:** Consider skeleton loaders instead of spinners.
3. **Form Validations (Zod):** Consider client-side Zod validation with inline field errors.

---

## 4. Security Risks & Improvements

### Password Policy Enforcement ~~(Weak)~~ ✅ FIXED
*   **Fix Applied:** `resetPassword` in `auth.controller.ts` now enforces: minimum 8 characters, at least one uppercase, one lowercase, one number, and one special character. Upgraded from the previous 6-character minimum.

> [!NOTE]
> Other security items (email enumeration defense, JWT secrets) were validated as already correctly implemented.

---

## 5. Performance Improvements

### N+1 Query in Project Listing ~~(Slow)~~ ✅ FIXED
*   **Fix Applied:** Replaced the `Promise.all(projects.map(async => prisma.task.count(...)))` pattern (2 DB queries per project) with a single `prisma.task.groupBy()` batch query. Task totals and completed counts are now fetched in a single SQL statement and mapped in memory. This reduces database round trips from **O(2N)** to **O(1)**.

---

## Summary of Changes

| File | Changes Made |
|------|-------------|
| `backend/src/controllers/user.controller.ts` | PII data stripping, email uniqueness validation, role escalation guard, Prisma P2002 error handling |
| `backend/src/controllers/auth.controller.ts` | Inactive user password reset block, strong password policy enforcement |
| `backend/src/controllers/project.controller.ts` | N+1 query elimination via batch groupBy |
