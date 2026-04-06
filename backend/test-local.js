const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign(
  { id: '10ff5610-329f-4513-951a-f7a444a3f1a9' },
  process.env.JWT_ACCESS_SECRET || 'your_jwt_secret',
  { expiresIn: '1d' }
);

async function test(path) {
  const res = await fetch('http://localhost:5000/api' + path, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(`\n--- ${path} ---`);
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Body:', text.substring(0, 1000));
}

async function run() {
  await test('/settings/company');
  await test('/roles');
  await test('/custom-fields');
}
run();
