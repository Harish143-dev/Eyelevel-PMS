import axios from 'axios';

async function testMe(token: string) {
  try {
    const res = await axios.get('http://localhost:5000/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('SUCCESS Response:', JSON.stringify(res.data, null, 2));
  } catch (err: any) {
    if (err.response) {
      console.error('ERROR Response Status:', err.response.status);
      console.error('ERROR Response Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Request Error:', err.message);
    }
  }
}

const token = process.argv[2];
if (!token) {
  console.error('Please provide a token');
  process.exit(1);
}

testMe(token);
