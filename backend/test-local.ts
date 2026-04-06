import { Request, Response } from 'express';
import { getCompanySettings } from './src/controllers/settings.controller';
import { getRoles } from './src/controllers/role.controller';
import { getCustomFields } from './src/controllers/customField.controller';

// Mock Response
const res = {
  statusCode: 200,
  status: function (this: any, s: number) { this.statusCode = s; return this; },
  json: function (this: any, data: any) { console.log('JSON RESPONSE:', JSON.stringify(data, null, 2)); return this; },
} as unknown as Response;

// Mock Request for Admin
const req = {
  user: {
    id: '10ff5610-329f-4513-951a-f7a444a3f1a9', // Akmal
    role: 'admin',
    companyId: '95d86f8c-c327-4124-b7c3-39f51410aeab2' // Wait, the ID might be slightly different. Let's just not pass companyId since getRoles uses prisma.user.findUnique.
  }
} as unknown as Request;

async function runTests() {
  console.log('--- COMPANY SETTINGS ---');
  try {
    await getCompanySettings(req as any, res as any);
  } catch (e) {
    console.error('getCompanySettings Error:', e);
  }

  console.log('\n--- ROLES ---');
  try {
    await getRoles(req as any, res as any);
  } catch (e) {
    console.error('getRoles Error:', e);
  }

  console.log('\n--- CUSTOM FIELDS ---');
  try {
    await getCustomFields(req as any, res as any);
  } catch (e) {
    console.error('getCustomFields Error:', e);
  }
}

runTests().then(() => process.exit(0));
