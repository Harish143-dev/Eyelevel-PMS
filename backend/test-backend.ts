import { Request, Response } from 'express';
import { getMe } from './src/controllers/auth.controller';
import { createSession } from './src/controllers/session.controller';
import prisma from './src/config/db';

async function test() {
  try {
    // 1. Get a valid user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('No user found');
      return;
    }
    console.log('Testing with user:', user.email);

    // Mock Response
    const res = {
      statusCode: 200,
      status: function (this: any, s: number) { this.statusCode = s; return this; },
      json: function (this: any, data: any) { console.log('JSON RESPONSE:', JSON.stringify(data, null, 2)); return this; },
    } as unknown as Response;

    // Mock Request
    const req = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      headers: {},
      ip: '127.0.0.1',
      body: {
        deviceId: 'test-device',
        tabId: 'test-tab'
      }
    } as unknown as Request;

    console.log('\n--- TESTING GET /api/auth/me ---');
    try {
      await getMe(req as any, res);
    } catch (e) {
      console.error('getMe ERROR:', e);
    }

    console.log('\n--- TESTING POST /api/session/login ---');
    try {
      await createSession(req as any, res);
    } catch (e) {
      console.error('createSession ERROR:', e);
    }

  } catch (e) {
    console.error('Global Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

test().then(() => console.log('Done')).catch(console.error);
