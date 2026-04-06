/// <reference types="node" />
/**
 * QA Test Suite — Setup & Utilities
 * 
 * Shared test infrastructure for the multi-tenant SaaS QA test execution.
 * Provides API client, authentication helpers, and assertion utilities.
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TestUser {
  id: string;
  email: string;
  password: string;
  role: string;
  name: string;
  companyId?: string;
  token?: string;
}

export interface TestResult {
  testId: string;
  scenario: string;
  tenant: string;
  role: string;
  priority: string;
  status: 'PASS' | 'FAIL' | 'SKIP' | 'ERROR';
  expected: string;
  actual: string;
  details?: string;
  duration?: number;
}

// ─── API Client ─────────────────────────────────────────────────────────────

export async function apiRequest(
  method: string,
  path: string,
  options: {
    token?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<{ status: number; data: any; headers: Headers }> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data: any;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { status: response.status, data, headers: response.headers };
}

// ─── Auth Helpers ───────────────────────────────────────────────────────────

export async function loginUser(email: string, password: string): Promise<{ token: string; user: any } | null> {
  const result = await apiRequest('POST', '/api/auth/login', {
    body: { email, password },
  });

  if (result.status === 200 && result.data?.accessToken) {
    return { token: result.data.accessToken, user: result.data.user };
  }
  return null;
}

export async function loginTestUser(user: TestUser): Promise<TestUser> {
  const result = await loginUser(user.email, user.password);
  if (result) {
    user.token = result.token;
    user.id = result.user.id;
    user.companyId = result.user.companyId;
  }
  return user;
}

// ─── Assertion Helpers ──────────────────────────────────────────────────────

export function expectStatus(actual: number, expected: number, testId: string): boolean {
  if (actual !== expected) {
    console.log(`  ❌ ${testId}: Expected status ${expected}, got ${actual}`);
    return false;
  }
  console.log(`  ✅ ${testId}: Status ${actual} as expected`);
  return true;
}

export function expectStatusIn(actual: number, expected: number[], testId: string): boolean {
  if (!expected.includes(actual)) {
    console.log(`  ❌ ${testId}: Expected status in [${expected.join(',')}], got ${actual}`);
    return false;
  }
  console.log(`  ✅ ${testId}: Status ${actual} as expected (in [${expected.join(',')}])`);
  return true;
}

export function expectNoData(data: any, foreignEntityName: string, testId: string): boolean {
  if (data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)) {
    console.log(`  ❌ ${testId}: Found ${foreignEntityName} data when none expected`);
    return false;
  }
  console.log(`  ✅ ${testId}: No ${foreignEntityName} data leaked`);
  return true;
}

export function expectFieldEquals(obj: any, field: string, expected: any, testId: string): boolean {
  const actual = obj?.[field];
  if (actual !== expected) {
    console.log(`  ❌ ${testId}: Expected ${field}=${expected}, got ${field}=${actual}`);
    return false;
  }
  console.log(`  ✅ ${testId}: ${field}=${actual} as expected`);
  return true;
}

// ─── Test Runner ────────────────────────────────────────────────────────────

const allResults: TestResult[] = [];

export function recordResult(result: TestResult) {
  allResults.push(result);
}

export function getResults(): TestResult[] {
  return allResults;
}

export function printSummary() {
  const pass = allResults.filter(r => r.status === 'PASS').length;
  const fail = allResults.filter(r => r.status === 'FAIL').length;
  const skip = allResults.filter(r => r.status === 'SKIP').length;
  const error = allResults.filter(r => r.status === 'ERROR').length;

  console.log('\n' + '═'.repeat(60));
  console.log('📊 TEST EXECUTION SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  ✅ PASS:  ${pass}`);
  console.log(`  ❌ FAIL:  ${fail}`);
  console.log(`  ⚠️  SKIP:  ${skip}`);
  console.log(`  💥 ERROR: ${error}`);
  console.log(`  📋 TOTAL: ${allResults.length}`);
  console.log(`  📈 Pass Rate: ${allResults.length > 0 ? Math.round((pass / allResults.length) * 100) : 0}%`);
  console.log('═'.repeat(60));

  if (fail > 0) {
    console.log('\n🔴 FAILED TESTS:');
    allResults.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  ${r.testId}: ${r.scenario}`);
      console.log(`    Expected: ${r.expected}`);
      console.log(`    Actual:   ${r.actual}`);
    });
  }
}

export function generateReport(): string {
  const pass = allResults.filter(r => r.status === 'PASS').length;
  const fail = allResults.filter(r => r.status === 'FAIL').length;
  const skip = allResults.filter(r => r.status === 'SKIP').length;
  const total = allResults.length;
  const passRate = total > 0 ? Math.round((pass / total) * 100) : 0;

  let report = `# 📋 QA Test Execution Report
## Multi-Tenant Business Management SaaS

**Date:** ${new Date().toISOString().split('T')[0]}  
**Environment:** Local Development  
**Base URL:** ${BASE_URL}  
**Status:** ${fail === 0 ? '✅ ALL TESTS PASSED' : '❌ FAILURES DETECTED'}

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${total} |
| ✅ Passed | ${pass} |
| ❌ Failed | ${fail} |
| ⚠️ Skipped | ${skip} |
| Pass Rate | ${passRate}% |

---

## Detailed Results

| Test ID | Scenario | Tenant | Role | Priority | Status | Details |
|---------|----------|--------|------|----------|--------|---------|
`;

  for (const r of allResults) {
    const statusIcon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : r.status === 'SKIP' ? '⚠️' : '💥';
    report += `| ${r.testId} | ${r.scenario} | ${r.tenant} | ${r.role} | ${r.priority} | ${statusIcon} ${r.status} | ${r.details || r.actual} |\n`;
  }

  if (fail > 0) {
    report += `\n---\n\n## 🔴 Failed Tests — Detail\n\n`;
    for (const r of allResults.filter(r => r.status === 'FAIL')) {
      report += `### ${r.testId}: ${r.scenario}\n`;
      report += `- **Expected:** ${r.expected}\n`;
      report += `- **Actual:** ${r.actual}\n`;
      report += `- **Tenant:** ${r.tenant} | **Role:** ${r.role}\n\n`;
    }
  }

  report += `\n---\n\n*Report generated at ${new Date().toISOString()}*\n`;

  return report;
}
