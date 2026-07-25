// RSVP API 서버 — 라즈베리파이용
// 실행: node rsvp-server.js  (Node 18+)
// 의존성: npm install express better-sqlite3 cors

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const PORT = 49201;                 // 내부 포트 (Caddy가 외부 HTTPS를 이 포트로 프록시)
const ADMIN_KEY = 'CHANGE_ME';      // 목록 조회용 키 — 반드시 변경할 것
const ALLOWED_ORIGIN = 'https://kka-na.github.io'; // GitHub Pages 주소로 변경

const db = new Database(path.join(__dirname, 'rsvp.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS rsvp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    side TEXT NOT NULL CHECK(side IN ('groom','bride')),
    attend TEXT NOT NULL CHECK(attend IN ('yes','no')),
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )
`);

const app = express();
app.use(express.json({ limit: '2kb' }));
app.use(cors({ origin: ALLOWED_ORIGIN }));

// 참석 의사 등록
app.post('/api/rsvp', (req, res) => {
  const { side, attend, name } = req.body || {};
  if (!['groom', 'bride'].includes(side)) return res.status(400).json({ error: 'invalid side' });
  if (!['yes', 'no'].includes(attend)) return res.status(400).json({ error: 'invalid attend' });
  if (typeof name !== 'string' || !name.trim() || name.length > 20)
    return res.status(400).json({ error: 'invalid name' });

  db.prepare('INSERT INTO rsvp (side, attend, name) VALUES (?, ?, ?)')
    .run(side, attend, name.trim());
  res.json({ ok: true });
});

// 목록 조회 (본인 확인용): GET /api/rsvp/list?key=ADMIN_KEY
app.get('/api/rsvp/list', (req, res) => {
  if (req.query.key !== ADMIN_KEY) return res.status(403).json({ error: 'forbidden' });
  const rows = db.prepare('SELECT * FROM rsvp ORDER BY id DESC').all();
  const summary = {
    total: rows.length,
    groom_yes: rows.filter(r => r.side === 'groom' && r.attend === 'yes').length,
    groom_no:  rows.filter(r => r.side === 'groom' && r.attend === 'no').length,
    bride_yes: rows.filter(r => r.side === 'bride' && r.attend === 'yes').length,
    bride_no:  rows.filter(r => r.side === 'bride' && r.attend === 'no').length,
  };
  res.json({ summary, rows });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`RSVP server listening on 127.0.0.1:${PORT}`);
});
