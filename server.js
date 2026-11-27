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
// 구조: index.html(대시보드) · events.json(행사 목록) · events/<행사>/index.html · images/ · 엑셀

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};
// 공개할 파일만 허용 (서버 코드 등은 내보내지 않음)
const SLUG = '[a-z0-9][a-z0-9-]*';
const PATTERNS = [
  /^index\.html$/, /^events\.json$/, /^shares\.json$/,
  new RegExp(`^events/${SLUG}/index\\.html$`),
  new RegExp(`^events/${SLUG}/images/(products/)?[\\w.-]+\\.(jpe?g|png|webp)$`),
  new RegExp(`^events/${SLUG}/[^/]+\\.xlsx$`),
];
const allowed = rel => PATTERNS.some(p => p.test(rel));
const isPage = rel => rel.endsWith('.html');

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

// 공유 링크: /s/<토큰>/ → 해당 행사 페이지만 로그인 없이 보기 (토큰 목록: shares.json, 로그인한 대시보드에서만 열림)
function shareTarget(token) {
  try {
    const list = JSON.parse(fs.readFileSync(path.join(ROOT, 'shares.json'), 'utf8'));
    const hit = list.find(x => x.token === token && x.active !== false);
    return hit && new RegExp(`^${SLUG}$`).test(hit.slug) ? hit.slug : null;
  } catch { return null; }
}
const SHARE_FILES = [/^index\.html$/, /^images\/(products\/)?[\w.-]+\.(jpe?g|png|webp)$/];

function send(res, file, rel) {
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'}); return res.end('없는 페이지입니다.'); }
    const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
    res.setHeader('Cache-Control', 'private, no-cache');
    res.writeHead(200, {'Content-Type': type});
    res.end(isPage(rel) ? HEAD + buf.toString('utf8') + '</body></html>' : buf);
  });
}
const notFound = res => { res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'}); res.end('없는 페이지입니다.'); };

http.createServer((req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  let rel;
  try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, ''); }
  catch { res.writeHead(400); return res.end(); }

  const sm = rel.match(/^s\/([A-Za-z0-9_-]{16,64})(\/.*)?$/);
  if (sm) {
    const slug = shareTarget(sm[1]);
    if (!slug) return notFound(res);
    if (sm[2] === undefined) { res.writeHead(301, {Location: '/s/' + sm[1] + '/'}); return res.end(); }
    let sub = sm[2].slice(1);
    if (sub === '') sub = 'index.html';
    if (sub.includes('..') || !SHARE_FILES.some(p => p.test(sub))) return notFound(res);
    return send(res, path.join(ROOT, 'events', slug, sub), sub);
  }

  if (!USER || !PASS) {
    res.writeHead(503, {'Content-Type': 'text/plain; charset=utf-8'});
    return res.end('비밀번호가 설정되지 않았습니다. Railway Variables에 BASIC_AUTH_USER, BASIC_AUTH_PASSWORD를 넣어주세요.');
  }
  if (!authorized(req)) {
    res.writeHead(401, {'WWW-Authenticate': 'Basic realm="FootJoy Jamsil", charset="UTF-8"', 'Content-Type': 'text/plain; charset=utf-8'});
    return res.end('로그인이 필요합니다.');
  }
  if (new RegExp(`^events/${SLUG}$`).test(rel)) { res.writeHead(301, {Location: '/' + rel + '/'}); return res.end(); }
  if (rel === '' || rel.endsWith('/')) rel += 'index.html';
  if (rel.includes('..') || !allowed(rel)) return notFound(res);
  send(res, path.join(ROOT, rel), rel);
}).listen(PORT, () => console.log('listening on ' + PORT + (USER && PASS ? ` · 로그인 설정됨 (아이디 ${USER.length}자, 비밀번호 ${PASS.length}자)` : ' · 비밀번호 미설정')));
