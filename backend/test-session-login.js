const http = require('http');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const payload = {
  id: '10ff5610-329f-4513-951a-f7a444a3f1a9', // REAL USER
  email: 'eyelevel.admin@eyelevelstudio.in',
  role: 'admin',
  name: 'Admin'
};

const token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/session/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log('BODY:', data);
  });
});

req.on('error', (e) => {
  console.error(`ERROR: ${e.message}`);
});

req.write(JSON.stringify({
  deviceId: 'test-device',
  tabId: 'test-tab'
}));
req.end();
