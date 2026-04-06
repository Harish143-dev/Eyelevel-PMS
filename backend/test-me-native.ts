import http from 'http';

function testMe(token: string) {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/me',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log('BODY:', data);
    });
  });

  req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
  });

  req.end();
}

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFmZjVlNTRkLTg1ZTMtNDExMC05MDdmLTdkMDM2MDBjNGEyNCIsImVtYWlsIjoiaGFyaXNoLnNAZXllbGV2ZWxzdHVkaW8uaW4iLCJyb2xlIjoiZW1wbG95ZWUiLCJuYW1lIjoiSGFyaXNoIiwiaWF0IjoxNzc1MTkzMDE5LCJleHAiOjE3NzUxOTY2MTl9.VgOC_kvBhPIWSGlO_GqjwLtfLdi';
testMe(token);
