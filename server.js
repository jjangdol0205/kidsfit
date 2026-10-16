#!/usr/bin/env node
/**
 * MoneyFit Production Web Server (Zero-Dependency Native HTTP Server)
 *
 * Designed for Render.com (`truthofmarket.com` / `truth-of-market.onrender.com`),
 * Railway, Fly.io, or local hosting (`npm start` / `node server.js`).
 *
 * Features:
 * - Serves pre-rendered `dist/` static files and `/preset/:slug` clean URLs
 * - Serves `/sitemap.xml`, `/robots.txt`, and IndexNow verification `.txt` files
 * - Provides `/health` and `/api/status` endpoints for uptime monitors
 * - Auto-triggers SSG build on startup if `dist/index.html` is missing
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const PORT = Number(process.env.PORT) || 3000;

// Ensure dist/ is built before serving
if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  try {
    const ssgBuilder = require('./scripts/build-ssg.js');
    if (ssgBuilder && typeof ssgBuilder.build === 'function') {
      ssgBuilder.build();
    }
  } catch (e) {
    console.warn('[Server] SSG auto-build warning:', e.message);
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

function resolveFilePath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split('?')[0]).replace(/\\/g, '/');

  if (cleanPath === '/' || cleanPath === '/index.html') {
    const distIdx = path.join(DIST_DIR, 'index.html');
    return fs.existsSync(distIdx) ? distIdx : path.join(ROOT_DIR, 'index.html');
  }

  // Try exact match in dist/ then ROOT_DIR
  const candidateDist = path.normalize(path.join(DIST_DIR, cleanPath));
  if (candidateDist.startsWith(DIST_DIR) && fs.existsSync(candidateDist)) {
    const stat = fs.statSync(candidateDist);
    if (stat.isDirectory()) {
      const idx = path.join(candidateDist, 'index.html');
      if (fs.existsSync(idx)) return idx;
    } else {
      return candidateDist;
    }
  }

  // Try /preset/{slug}.html or /preset/{slug}/index.html
  const htmlDist = path.normalize(path.join(DIST_DIR, `${cleanPath}.html`));
  if (htmlDist.startsWith(DIST_DIR) && fs.existsSync(htmlDist)) {
    return htmlDist;
  }

  const candidateRoot = path.normalize(path.join(ROOT_DIR, cleanPath));
  if (candidateRoot.startsWith(ROOT_DIR) && fs.existsSync(candidateRoot)) {
    const stat = fs.statSync(candidateRoot);
    if (stat.isDirectory()) {
      const idx = path.join(candidateRoot, 'index.html');
      if (fs.existsSync(idx)) return idx;
    } else {
      return candidateRoot;
    }
  }

  return null;
}

const server = http.createServer((req, res) => {
  const reqUrl = req.url || '/';

  // Health check endpoint for Render.com / uptime monitoring
  if (reqUrl === '/health' || reqUrl === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'MoneyFit Portal (truthofmarket.com)',
        timestamp: new Date().toISOString()
      })
    );
    return;
  }

  // Automatic zero-upload ownership verification for Naver SearchAdvisor & Google Search Console
  const cleanUrlPath = decodeURIComponent(reqUrl.split('?')[0]);
  const naverMatch = cleanUrlPath.match(/^\/(naver[a-zA-Z0-9_-]+\.html)$/);
  if (naverMatch) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`naver-site-verification: ${naverMatch[1]}`);
    return;
  }
  const googleMatch = cleanUrlPath.match(/^\/(google[a-zA-Z0-9_-]+\.html)$/);
  if (googleMatch) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`google-site-verification: ${googleMatch[1]}`);
    return;
  }

  const filePath = resolveFilePath(reqUrl);
  if (!filePath) {
    // Fallback to main SPA index.html
    const fallback = fs.existsSync(path.join(DIST_DIR, 'index.html'))
      ? path.join(DIST_DIR, 'index.html')
      : path.join(ROOT_DIR, 'index.html');
    if (fs.existsSync(fallback)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(fallback).pipe(res);
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': ext === '.html' ? 'public, max-age=300' : 'public, max-age=86400'
  });
  fs.createReadStream(filePath).pipe(res);
});

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 MoneyFit Portal Live Server running on http://0.0.0.0:${PORT} (https://truthofmarket.com)`);
  });
}

module.exports = server;
