import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function testSessionLogin() {
  const payload = {
    id: '10ff5610-329f-4513-951a-f7a444a3f1a9', // Existing user ID
    email: 'akmal@eyelevelstudio.in',
    role: 'admin',
    name: 'Akmal'
  };

  const token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, { expiresIn: '1h' });

  try {
    console.log('Hitting /api/session/login...');
    const res = await axios.post('http://localhost:5000/api/session/login', {
      deviceId: 'test-device',
      tabId: 'test-tab'
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('SUCCESS:', res.data);
  } catch (err: any) {
    if (err.response) {
      console.error('ERROR status:', err.response.status);
      console.error('ERROR data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('REQUEST ERROR:', err.message);
    }
  }
}

testSessionLogin();
