// Smoke test: checks a fresh deployment can register, log in and serve a protected endpoint.
const base = process.argv[2] || 'http://localhost:3001';
const email = `smoke-${Date.now()}@test.com`;
const password = 'Password123!';

async function call(path, options = {}) {
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

function check(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    process.exit(1);
  }
  console.log(`PASS: ${name}`);
}

(async () => {
  const reg = await call('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, firstName: 'Smoke', lastName: 'Test', mobile: '0412345678' }),
  });
  check('register returns 2xx', reg.status >= 200 && reg.status < 300);

  const login = await call('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  check('login returns 200', login.status === 200);

  const token = login.body?.data?.accessToken?.accessToken;
  check('login returns an access token', Boolean(token));

  const profile = await call('/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } });
  check('profile with token returns 200', profile.status === 200);

  const noAuth = await call('/api/auth/profile');
  check('profile without token is rejected (401)', noAuth.status === 401);

  console.log('Smoke test passed');
})().catch((err) => {
  console.error('Smoke test error:', err.message);
  process.exit(1);
});