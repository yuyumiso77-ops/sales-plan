// 풋조이 잠실점 팝업 페이지를 Railway에서 보여주는 작은 서버 (외부 패키지 없음)
// 환경변수 BASIC_AUTH_USER, BASIC_AUTH_PASSWORD 를 Railway Variables에 넣어야 페이지가 열립니다.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
// 앞뒤 공백·줄바꿈과 값 전체를 감싼 따옴표는 실수로 들어가는 경우가 많아 제거
const clean = v => (v || '').trim().replace(/^(["'])(.*)\1$/, '$2');
const USER = clean(process.env.BASIC_AUTH_USER);
const PASS = clean(process.env.BASIC_AUTH_PASSWORD);
const PAGE = 'footjoy-jamsil-popup.html';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};
// 공개할 파일만 허용 (서버 코드 등은 내보내지 않음)
const allowed = rel => rel === PAGE || /^images\/(products\/)?[\w.-]+\.(jpe?g|png|webp)$/.test(rel) || /^[^/]+\.xlsx$/.test(rel);

const same = (a, b) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

function authorized(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Basic ')) return false;
  const raw = Buffer.from(h.slice(6), 'base64').toString('utf8');
  const i = raw.indexOf(':');
  if (i < 0) return false;
  return same(raw.slice(0, i).trim(), USER) && same(raw.slice(i + 1), PASS);
}

const HEAD = '<!doctype html><html lang="ko"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
  '<meta name="robots" content="noindex,nofollow">' +
  '<style>body{margin:0;font-size:14px}img{max-width:100%}[hidden]{display:none!important}</style></head><body>';

http.createServer((req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!USER || !PASS) {
    res.writeHead(503, {'Content-Type': 'text/plain; charset=utf-8'});
    return res.end('비밀번호가 설정되지 않았습니다. Railway Variables에 BASIC_AUTH_USER, BASIC_AUTH_PASSWORD를 넣어주세요.');
  }
  if (!authorized(req)) {
    res.writeHead(401, {'WWW-Authenticate': 'Basic realm="FootJoy Jamsil", charset="UTF-8"', 'Content-Type': 'text/plain; charset=utf-8'});
    return res.end('로그인이 필요합니다.');
  }
  let rel;
  try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, ''); }
  catch { res.writeHead(400); return res.end(); }
  if (rel === '' || rel === 'index.html') rel = PAGE;
  if (rel.includes('..') || !allowed(rel)) { res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'}); return res.end('없는 페이지입니다.'); }
  const file = path.join(ROOT, rel);
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'}); return res.end('없는 페이지입니다.'); }
    const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
    res.setHeader('Cache-Control', 'private, no-cache');
    res.writeHead(200, {'Content-Type': type});
    res.end(rel === PAGE ? HEAD + buf.toString('utf8') + '</body></html>' : buf);
  });
}).listen(PORT, () => console.log('listening on ' + PORT + (USER && PASS ? ` · 로그인 설정됨 (아이디 ${USER.length}자, 비밀번호 ${PASS.length}자)` : ' · 비밀번호 미설정')));
