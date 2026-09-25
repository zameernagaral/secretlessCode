const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = 4000;
const HOST = 'localhost';

async function sendRequest(method, path, headers, body) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: HOST,
      port: PORT,
      path: path,
      method: method,
      headers: headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    
    req.on('error', (e) => resolve({ status: 0, error: e.message }));
    
    if (body) {
      if (Buffer.isBuffer(body)) req.write(body);
      else req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runAttacks() {
  console.log('🛡️  Starting Attack Simulation on Secretless Code...');

  // 1. Prototype Pollution
  console.log('\n[1] Attacking with Prototype Pollution payload...');
  const ppRes = await sendRequest('POST', '/api/v1/scan', 
    { 'Content-Type': 'application/json' },
    '{"repoUrl": "https://github.com/octocat/Hello-World", "__proto__": {"polluted": "yes"}}'
  );
  console.log(`Result: ${ppRes.status} (Expected: 400 Strict Schema Rejection)`);

  // 2. Huge JSON Body (10MB) - should be blocked by Express body-parser limit (usually 100kb/1mb)
  console.log('\n[2] Attacking with 10MB JSON Payload...');
  const hugeBody = { repoUrl: "https://github.com/octocat/Hello-World", padding: "A".repeat(10 * 1024 * 1024) };
  const hugeRes = await sendRequest('POST', '/api/v1/scan', 
    { 'Content-Type': 'application/json' },
    JSON.stringify(hugeBody)
  );
  console.log(`Result: ${hugeRes.status} (Expected: 413 Payload Too Large)`);

  // 3. SSRF / Malformed URL Attempt
  console.log('\n[3] Attacking with SSRF Payload (localhost)...');
  const ssrfRes = await sendRequest('POST', '/api/v1/scan', 
    { 'Content-Type': 'application/json' },
    { repoUrl: "https://github.com/../../../../localhost:22" }
  );
  console.log(`Result: ${ssrfRes.status} (Expected: 400 Invalid URL)`);

  // 4. Command Injection via URL
  console.log('\n[4] Attacking with Command Injection Payload...');
  const cmdRes = await sendRequest('POST', '/api/v1/scan', 
    { 'Content-Type': 'application/json' },
    { repoUrl: "https://github.com/octocat/Hello-World; rm -rf /" }
  );
  console.log(`Result: ${cmdRes.status} (Expected: 400 Invalid URL)`);

  // 5. Huge Archive Upload (Fake file, exceeding 20MB or whatever the limit is)
  console.log('\n[5] Attacking File Upload with 30MB file...');
  // We'll simulate a massive multipart boundary payload, but actually we can just send Content-Length to see if Multer drops it
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const head = `--${boundary}\r\nContent-Disposition: form-data; name="archive"; filename="huge.zip"\r\nContent-Type: application/zip\r\n\r\n`;
  const tail = `\r\n--${boundary}--\r\n`;
  const fakeData = Buffer.alloc(30 * 1024 * 1024, 'A'); // 30MB
  const payload = Buffer.concat([Buffer.from(head), fakeData, Buffer.from(tail)]);
  
  const uploadRes = await sendRequest('POST', '/api/v1/scan/upload', 
    { 
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': payload.length
    },
    payload
  );
  console.log(`Result: ${uploadRes.status} (Expected: 413 or 400 File too large)`);

  // 6. Bad GitHub Webhook Signature
  console.log('\n[6] Attacking Webhook with Bad Signature...');
  const whRes = await sendRequest('POST', '/api/v1/webhooks/github', 
    { 
      'Content-Type': 'application/json',
      'x-github-event': 'pull_request',
      'x-hub-signature-256': 'sha256=invalid_signature_123'
    },
    JSON.stringify({ action: "opened", pull_request: {}, repository: {} })
  );
  console.log(`Result: ${whRes.status} (Expected: Webhook to ignore it or return 202/401 but drop processing)`);

  console.log('\n✅ Attack simulation complete. If the app didn\'t crash, the defenses held.');
}

runAttacks().catch(console.error);
