// demo-server.mjs
//
// A tiny real web server used to validate the automation end-to-end:
//   GET  /login      -> login form
//   POST /login      -> checks credentials, sets a cookie, redirects to /dashboard
//   GET  /dashboard  -> page with a "Download CSV" button (requires cookie)
//   GET  /download   -> returns a CSV as a file attachment (requires cookie)
//
// No dependencies — uses only Node's built-in http module.

import http from 'node:http';

const PORT = process.env.DEMO_PORT ? Number(process.env.DEMO_PORT) : 4599;
const USER = 'demo-user';
const PASS = 'demo-pass';
const COOKIE = 'session=ok';

function hasSession(req) {
  return (req.headers.cookie || '').includes(COOKIE);
}

const loginPage = `<!doctype html>
<html><head><title>Demo Login</title></head><body>
  <h1>Demo Service Login</h1>
  <form method="POST" action="/login">
    <input id="username" name="username" placeholder="username" />
    <input id="password" name="password" type="password" placeholder="password" />
    <button type="submit">Log in</button>
  </form>
</body></html>`;

const dashboardPage = `<!doctype html>
<html><head><title>Dashboard</title></head><body>
  <h1>Dashboard</h1>
  <p>You are logged in.</p>
  <a id="download-csv" href="/download">Download CSV</a>
</body></html>`;

const csvContent = [
  'id,name,amount',
  '1,Alpha,100',
  '2,Bravo,250',
  '3,Charlie,375',
].join('\n');

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'GET' && url.pathname === '/login') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(loginPage);
  }

  if (req.method === 'POST' && url.pathname === '/login') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const params = new URLSearchParams(body);
      if (params.get('username') === USER && params.get('password') === PASS) {
        res.writeHead(302, { 'Set-Cookie': COOKIE, Location: '/dashboard' });
        return res.end();
      }
      res.writeHead(401, { 'Content-Type': 'text/html' });
      res.end('<p>Invalid credentials</p>');
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/dashboard') {
    if (!hasSession(req)) {
      res.writeHead(302, { Location: '/login' });
      return res.end();
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(dashboardPage);
  }

  if (req.method === 'GET' && url.pathname === '/download') {
    if (!hasSession(req)) {
      res.writeHead(302, { Location: '/login' });
      return res.end();
    }
    res.writeHead(200, {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="report.csv"',
    });
    return res.end(csvContent);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Demo server running at http://localhost:${PORT}/login`);
});
