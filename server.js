/**
 * server.js
 * Production HTTP Server for KidsFit Growth Studio (https://truthofmarket.com)
 * Zero external dependencies. Designed for Render / cloud Node.js web service deployment.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';
const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, 'dist');

// Ensure dist/index.html is built on startup
function ensureBuild() {
  const distIndex = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(distIndex)) {
    try {
      console.log('[Server] dist/index.html not found. Running build pipeline...');
      execSync('node scripts/build.js', { cwd: ROOT_DIR, stdio: 'inherit' });
    } catch (err) {
      console.error('[Server] Build pipeline warning:', err.message);
    }
  }
}

ensureBuild();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.pdf': 'application/pdf'
};

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store',
  'Clear-Site-Data': '"cache"'
};

function resolveSafeFile(baseDir, relPath) {
  const safeRel = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const fullPath = path.resolve(baseDir, safeRel);
  if (!fullPath.startsWith(path.resolve(baseDir))) {
    return null;
  }
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    return fullPath;
  }
  return null;
}

const server = http.createServer((req, res) => {
  try {
    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(parsedUrl.pathname);

    // 1. Health & Status Endpoints for Render
    if (pathname === '/healthz' || pathname === '/api/health' || pathname === '/api/stats') {
      const payload = JSON.stringify({
        ok: true,
        service: 'Taller Bio Labs (truthofmarket.com)',
        version: '2.4.0',
        timestamp: new Date().toISOString()
      });
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        ...NO_CACHE_HEADERS
      });
      res.end(payload);
      return;
    }

    // 1-A. User Input Cohort DB & Self-Improvement API (/api/user-cohort)
    if (pathname === '/api/user-cohort') {
      const cohortDbPath = path.join(ROOT_DIR, 'src', 'data', 'user-cohort-db.json');
      let cohortDb = { metadata: { total_records: 0, subject_mode_counts: { child: 0, self: 0 }, age_band_distribution: {}, bottleneck_habit_frequencies: {}, auto_learning_weights: {} }, records: [] };
      if (fs.existsSync(cohortDbPath)) {
        try {
          cohortDb = JSON.parse(fs.readFileSync(cohortDbPath, 'utf8'));
        } catch (_) {}
      }

      if (req.method === 'GET') {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          ...NO_CACHE_HEADERS
        });
        res.end(JSON.stringify({ ok: true, cohortDb }));
        return;
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
          if (body.length < 32768) body += chunk.toString('utf8');
        });
        req.on('end', () => {
          try {
            const incoming = JSON.parse(body || '{}');
            const ageYears = Math.max(1, Math.min(20, Number(incoming.ageYears) || 10));
            const bandKey = ageYears <= 3 ? '1-3y' : ageYears <= 6 ? '4-6y' : ageYears <= 9 ? '7-9y' : ageYears <= 12 ? '10-12y' : ageYears <= 16 ? '13-16y' : '17-20y';
            const record = {
              id: incoming.id || `USR-${Date.now().toString(36).toUpperCase()}`,
              timestamp: new Date().toISOString(),
              targetSubject: incoming.targetSubject === 'self' ? 'self' : 'child',
              gender: incoming.gender === 'girl' ? 'girl' : 'boy',
              birthDateStr: String(incoming.birthDateStr || ''),
              exactMonths: Number(incoming.exactMonths) || (ageYears * 12),
              ageYears,
              currentHeight: Number(incoming.currentHeight) || 137.0,
              currentWeight: Number(incoming.currentWeight) || 35.5,
              recentGrowth6m: Number(incoming.recentGrowth6m) || 3.2,
              fatherHeight: Number(incoming.fatherHeight) || 173.5,
              motherHeight: Number(incoming.motherHeight) || 160.5,
              tannerPhase: String(incoming.tannerPhase || 'phase_2'),
              habits: Array.isArray(incoming.habits) ? incoming.habits.slice(0, 5) : ['late_sleep'],
              cognitiveAxes: Array.isArray(incoming.cognitiveAxes) ? incoming.cognitiveAxes.slice(0, 5) : ['science_nature'],
              region: String(incoming.region || '서울 강남·서초·송파'),
              kdcaPercentile: Number(incoming.kdcaPercentile) || 50.0,
              zScore: Number(incoming.zScore) || 0.0,
              mph: Number(incoming.mph) || 173.5,
              unmanagedHeight: Number(incoming.unmanagedHeight) || 171.2,
              optimizedHeight: Number(incoming.optimizedHeight) || 180.5,
              potentialGainCm: Number(incoming.potentialGainCm) || 7.2
            };

            if (!cohortDb.metadata) cohortDb.metadata = {};
            cohortDb.metadata.last_updated_utc = record.timestamp;
            cohortDb.metadata.total_records = (Number(cohortDb.metadata.total_records) || 128) + 1;
            if (!cohortDb.metadata.subject_mode_counts) cohortDb.metadata.subject_mode_counts = { child: 89, self: 39 };
            cohortDb.metadata.subject_mode_counts[record.targetSubject] = (cohortDb.metadata.subject_mode_counts[record.targetSubject] || 0) + 1;

            if (!cohortDb.metadata.age_band_distribution) cohortDb.metadata.age_band_distribution = {};
            cohortDb.metadata.age_band_distribution[bandKey] = (cohortDb.metadata.age_band_distribution[bandKey] || 0) + 1;

            if (!cohortDb.metadata.bottleneck_habit_frequencies) cohortDb.metadata.bottleneck_habit_frequencies = {};
            record.habits.forEach((h) => {
              cohortDb.metadata.bottleneck_habit_frequencies[h] = (cohortDb.metadata.bottleneck_habit_frequencies[h] || 0) + 1;
            });

            if (!Array.isArray(cohortDb.records)) cohortDb.records = [];
            cohortDb.records.unshift(record);
            if (cohortDb.records.length > 200) cohortDb.records = cohortDb.records.slice(0, 200);

            try {
              fs.writeFileSync(cohortDbPath, JSON.stringify(cohortDb, null, 2), 'utf8');
            } catch (_) {}

            res.writeHead(200, {
              'Content-Type': 'application/json; charset=utf-8',
              ...NO_CACHE_HEADERS
            });
            res.end(JSON.stringify({ ok: true, saved: record, total_records: cohortDb.metadata.total_records }));
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: false, error: 'Invalid JSON payload' }));
          }
        });
        return;
      }
    }

    // 1-B. Coupang Partners Redirect & Search Proxy Route
    if (pathname === '/api/coupang') {
      const q = parsedUrl.searchParams.get('q') || 
                parsedUrl.searchParams.get('kw') || 
                parsedUrl.searchParams.get('keyword') || '';
      const lptag = parsedUrl.searchParams.get('lptag') || 
                    parsedUrl.searchParams.get('subId') || 
                    'AF7865143';
      const redirectUrl = q 
        ? `https://www.coupang.com/np/search?q=${encodeURIComponent(q)}&channel=user&lptag=${encodeURIComponent(lptag)}`
        : `https://www.coupang.com/?lptag=${encodeURIComponent(lptag)}`;

      const format = parsedUrl.searchParams.get('format');
      const acceptHeader = req.headers['accept'] || '';

      if (format === 'json' || acceptHeader.includes('application/json')) {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          ...NO_CACHE_HEADERS
        });
        res.end(JSON.stringify({
          ok: true,
          redirectUrl,
          query: q,
          lptag
        }));
        return;
      }

      // HTTP 302 Found Redirect
      res.writeHead(302, {
        'Location': redirectUrl,
        ...NO_CACHE_HEADERS
      });
      res.end(`Redirecting to Coupang Partners: ${redirectUrl}`);
      return;
    }

    // 2. Self-unregistering Service Worker to purge any legacy MoneyFit SW
    if (pathname === '/sw.js' || pathname === '/service-worker.js') {
      const swKillScript = [
        "self.addEventListener('install', () => self.skipWaiting());",
        "self.addEventListener('activate', (event) => {",
        "  event.waitUntil(",
        "    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))",
        "      .then(() => self.registration.unregister())",
        "  );",
        "});"
      ].join('\n');
      res.writeHead(200, {
        'Content-Type': 'application/javascript; charset=utf-8',
        ...NO_CACHE_HEADERS
      });
      res.end(swKillScript);
      return;
    }

    // 3. Normalize root & directory index paths
    if (pathname === '/' || pathname === '') {
      pathname = '/index.html';
    }

    const relPath = pathname.replace(/^\/+/, '');

    // Look up file in DIST_DIR first, then ROOT_DIR
    let filePath =
      resolveSafeFile(DIST_DIR, relPath) ||
      resolveSafeFile(ROOT_DIR, relPath) ||
      resolveSafeFile(DIST_DIR, path.join(relPath, 'index.html')) ||
      resolveSafeFile(ROOT_DIR, path.join(relPath, 'index.html'));

    // Fallback to index.html for legacy HTML routes so old MoneyFit links land cleanly on KidsFit
    const ext = path.extname(filePath || pathname).toLowerCase();
    if (!filePath && (ext === '' || ext === '.html')) {
      filePath = resolveSafeFile(DIST_DIR, 'index.html') || resolveSafeFile(ROOT_DIR, 'index.html');
    }

    if (!filePath) {
      res.writeHead(404, {
        'Content-Type': 'text/plain; charset=utf-8',
        ...NO_CACHE_HEADERS
      });
      res.end('404 Not Found');
      return;
    }

    const finalExt = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[finalExt] || 'application/octet-stream';
    const stat = fs.statSync(filePath);

    // Handle HTTP Range requests for MP4 video streaming
    if (finalExt === '.mp4' && req.headers.range) {
      const range = req.headers.range;
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = (end - start) + 1;
      const stream = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType
      });
      stream.pipe(res);
      return;
    }

    const headers = {
      'Content-Type': contentType,
      'Content-Length': stat.size
    };

    if (finalExt === '.html' || finalExt === '.css' || finalExt === '.js' || finalExt === '.json') {
      Object.assign(headers, NO_CACHE_HEADERS);
    } else {
      headers['Cache-Control'] = 'public, max-age=3600';
    }

    res.writeHead(200, headers);
    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500 Internal Server Error');
  }
});

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(`[KidsFit Growth Studio] Server listening on http://${HOST}:${PORT}`);
  });
}

module.exports = server;
