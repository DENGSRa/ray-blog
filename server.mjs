import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { access, copyFile, mkdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import sharp from 'sharp';

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(root, 'data');
const contentFile = path.join(dataDir, 'content.json');
const seedFile = process.env.SEED_FILE || path.join(dataDir, 'default-content.json');
const uploadDir = path.join(root, 'public', 'uploads');
const bookDir = path.join(root, 'public', 'books');
const imageUrlPrefix = '/uploads/';
const adminUser = process.env.ADMIN_USER || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || '';
const sessionTtlMs = 1000 * 60 * 60 * 12;
const sessions = new Map();

async function ensureStorage() {
  await mkdir(dataDir, { recursive: true });
  await mkdir(uploadDir, { recursive: true });
  await mkdir(bookDir, { recursive: true });
  try { await access(contentFile); } catch { await copyFile(seedFile, contentFile); }
}

async function readContent() {
  await ensureStorage();
  const content = JSON.parse(await readFile(contentFile, 'utf8'));
  // Older content files predate book descriptions and manual ordering.
  // Fill those defaults in memory so old libraries behave like new uploads.
  let booksChanged = false;
  if (Array.isArray(content.books)) {
    content.books = content.books.map((book, index) => {
      const filename = repairMojibake(String(book.filename || ''));
      const downloadName = repairMojibake(String(book.downloadName || filename || ''));
      if (filename !== (book.filename || '') || downloadName !== (book.downloadName || '')) booksChanged = true;
      return {
        ...book,
        filename,
        downloadName,
        description: String(book.description || ''),
        sortOrder: Number(book.sortOrder) > 0 ? Math.round(Number(book.sortOrder)) : index + 1,
      };
    });
    // Persist metadata repairs only; uploaded book files remain untouched.
    if (booksChanged) await writeContent(content);
  }
  if (Array.isArray(content.albums)) {
    const media = content.media || {};
    for (const album of content.albums) {
      album.photos = (album.photos || []).map((photo) => {
        const mediaName = path.basename(String(photo.src || ''));
        const fallbackTitle = media[mediaName]?.title || path.parse(mediaName).name || '未命名照片';
        const currentTitle = String(photo.title || '').trim();
        return { ...photo, title: !currentTitle || currentTitle === '未命名照片' ? fallbackTitle : currentTitle, description: String(photo.description || '') };
      });
    }
  }
  return content;
}

async function writeContent(content) {
  await ensureStorage();
  const temp = `${contentFile}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(content, null, 2), 'utf8');
  await rename(temp, contentFile);
  return content;
}

function cleanPost(body, existing = {}) {
  return {
    id: existing.id || body.id || randomUUID(),
    title: String(body.title || '').trim() || '未命名文章',
    excerpt: String(body.excerpt || '').trim(),
    content: String(body.content || '').trim(),
    date: String(body.date || existing.date || new Date().toISOString().slice(0, 10)).replaceAll('-', '/'),
    category: String(body.category || existing.category || '生活').trim(),
    tags: Array.isArray(body.tags) ? body.tags.map(t => String(t).trim()).filter(Boolean) : String(body.tags || '').split(/[,，]/).map(t => t.trim()).filter(Boolean),
    image: String(body.image || existing.image || ''),
    pinned: Boolean(body.pinned)
  };
}

function cleanAlbum(body, existing = {}) {
  return {
    id: existing.id || body.id || randomUUID(),
    slug: String(body.slug || existing.slug || body.name || 'album').trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '') || `album-${Date.now()}`,
    name: String(body.name || '').trim() || '未命名相册',
    desc: String(body.desc || '').trim(),
    cover: String(body.cover || existing.cover || ''),
    photos: existing.photos || []
  };
}

function cleanSite(body = {}, existing = {}) {
  const text = (key, fallback = '') => String(body[key] ?? existing[key] ?? fallback).trim();
  const list = (key) => (Array.isArray(body[key]) ? body[key] : existing[key] || []).map(item => String(item).trim()).filter(Boolean);
  const pageSubtitles = body.pageSubtitles || existing.pageSubtitles || {};
  const mbti = body.mbti || existing.mbti || {};
  const friends = Array.isArray(body.friends) ? body.friends : existing.friends || [];
  return {
    brand: text('brand', 'RAY BLOG'),
    title: text('title', 'RAY BLOG'),
    heroTitle: text('heroTitle', '个人博客'),
    heroSubtitle: text('heroSubtitle'),
    startDate: text('startDate', new Date().toISOString().slice(0, 10)),
    avatar: text('avatar'),
    avatarPosition: text('avatarPosition', '50% 50%'),
    avatarZoom: Math.min(220, Math.max(100, Number(body.avatarZoom ?? existing.avatarZoom ?? 100))),
    profileName: text('profileName', '博主'),
    profileCompactTitle: text('profileCompactTitle', 'About Me'),
    profileBio: text('profileBio'),
    profileTags: list('profileTags'),
    githubUrl: text('githubUrl'),
    email: text('email'),
    footerQuote: text('footerQuote'),
    copyright: text('copyright'),
    footerNote: text('footerNote'),
    pageSubtitles: {
      articles: String(pageSubtitles.articles || '').trim(),
      albums: String(pageSubtitles.albums || '').trim(),
      gallery: String(pageSubtitles.gallery || '').trim(),
      links: String(pageSubtitles.links || '').trim(),
    },
    mbti: {
      type: String(mbti.type || '').trim(),
      name: String(mbti.name || '').trim(),
      english: String(mbti.english || '').trim(),
      description: String(mbti.description || '').trim(),
      tags: (Array.isArray(mbti.tags) ? mbti.tags : []).map(item => String(item).trim()).filter(Boolean),
      url: String(mbti.url || '').trim(),
    },
    friends: friends.map(friend => ({
      title: String(friend.title || '').trim(),
      description: String(friend.description || '').trim(),
      url: String(friend.url || '').trim(),
      avatar: String(friend.avatar || '').trim(),
    })).filter(friend => friend.title),
  };
}

function cleanBook(body = {}, existing = {}) {
  const parsedOrder = Number(body.sortOrder ?? existing.sortOrder ?? 0);
  const requestedName = String(body.downloadName ?? body.filename ?? existing.downloadName ?? existing.filename ?? '').trim();
  const filename = requestedName ? path.basename(requestedName) : String(existing.filename || '').trim();
  return {
    id: existing.id || body.id || randomUUID(),
    title: String(body.title ?? existing.title ?? '').trim() || '未命名书籍',
    description: String(body.description ?? existing.description ?? '').trim(),
    // This is the user-facing/download filename; the physical file stays at its stable URL.
    filename,
    downloadName: filename,
    url: existing.url || String(body.url || '').trim(),
    cover: String(body.cover ?? existing.cover ?? '').trim(),
    size: Number(existing.size ?? body.size ?? 0),
    sortOrder: Number.isFinite(parsedOrder) ? Math.max(1, Math.round(parsedOrder)) : 1,
  };
}

function decodeUploadName(value) {
  const name = String(value || '').trim();
  if (!name) return '未命名文件';
  // Decode only typical multipart mojibake; leave already-correct Unicode intact.
  return repairMojibake(name);
}

function repairMojibake(value) {
  if (!value || !/[\u00c0-\u00ff\u0080-\u009f]/.test(value)) return value;
  try {
    const candidate = Buffer.from(value, 'latin1').toString('utf8');
    if (!candidate || candidate.includes('\ufffd')) return value;
    const cjk = (text) => (text.match(/[\u3400-\u9fff]/g) || []).length;
    const noise = (text) => (text.match(/[\u0080-\u009f]|[ÃÂâð]|(?:[çæåäéè][\u0080-\u00ff])/g) || []).length;
    return cjk(candidate) > cjk(value) || noise(candidate) < noise(value) ? candidate : value;
  } catch { return value; }
}

function readCookies(request) {
  return Object.fromEntries(String(request.headers.cookie || '').split(';').map((part) => {
    const index = part.indexOf('=');
    return index < 0 ? [part.trim(), ''] : [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }).filter(([key]) => key));
}

function isValidSecret(value, expected) {
  const actual = Buffer.from(String(value || ''));
  const target = Buffer.from(String(expected || ''));
  return actual.length === target.length && timingSafeEqual(actual, target);
}

function currentAdmin(request) {
  const token = readCookies(request).ray_admin;
  const expiresAt = token ? sessions.get(token) : 0;
  if (!expiresAt || expiresAt < Date.now()) {
    if (token) sessions.delete(token);
    return false;
  }
  sessions.set(token, Date.now() + sessionTtlMs);
  return true;
}

function requireAdmin(request, response, next) {
  if (currentAdmin(request)) return next();
  return response.status(401).json({ error: '请先登录管理员账号。', code: 'AUTH_REQUIRED' });
}

const app = express();
const maxUploadMb = Number(process.env.MAX_UPLOAD_SIZE_MB || 12);
const imageMaxDimension = Number(process.env.IMAGE_MAX_DIMENSION || 2400);
const imageQuality = Number(process.env.IMAGE_WEBP_QUALITY || 84);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxUploadMb * 1024 * 1024 },
  fileFilter: (_, file, callback) => callback(null, /^image\/(avif|gif|heic|heif|jpeg|png|webp)$/.test(file.mimetype))
});

app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(uploadDir));
app.use('/books', express.static(bookDir));

app.post('/api/auth/login', (req, res) => {
  const username = String(req.body?.username || '');
  const password = String(req.body?.password || '');
  if (!isValidSecret(username, adminUser) || !isValidSecret(password, adminPassword)) return res.status(401).json({ error: '用户名或密码错误。' });
  const token = randomUUID();
  sessions.set(token, Date.now() + sessionTtlMs);
  res.setHeader('Set-Cookie', `ray_admin=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${sessionTtlMs / 1000}`);
  return res.json({ user: adminUser });
});

app.get('/api/auth/session', (req, res) => res.json({ authenticated: currentAdmin(req), user: currentAdmin(req) ? adminUser : null }));

app.post('/api/auth/logout', (req, res) => {
  const token = readCookies(req).ray_admin;
  if (token) sessions.delete(token);
  res.setHeader('Set-Cookie', 'ray_admin=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');
  return res.status(204).end();
});

// Public content remains readable; media metadata and all writes require a session.
app.use('/api', (req, res, next) => {
  if (req.path === '/auth/login' || req.path === '/auth/session' || req.path === '/auth/logout') return next();
  if (req.method === 'GET' && req.path === '/content') return next();
  if (req.method === 'GET' && /^\/books\/[^/]+\/download$/.test(req.path)) return next();
  return requireAdmin(req, res, next);
});

app.get('/api/content', async (_, res, next) => { try { res.json(await readContent()); } catch (error) { next(error); } });
app.put('/api/site', async (req, res, next) => {
  try {
    const content = await readContent();
    content.site = cleanSite(req.body, content.site);
    await writeContent(content);
    res.json(content.site);
  } catch (error) { next(error); }
});
app.get('/api/media', async (_, res, next) => {
  try {
    await ensureStorage();
    const content = await readContent();
    const { readdir } = await import('node:fs/promises');
    const files = await readdir(uploadDir);
    const media = await Promise.all(files.filter(file => !file.startsWith('.')).map(async (name) => {
      const file = path.join(uploadDir, name);
      const info = await stat(file);
      const metadata = (content.media || {})[name] || {};
      return { name, url: `${imageUrlPrefix}${name}`, size: info.size, updatedAt: info.mtime.toISOString(), title: metadata.title || '', description: metadata.description || '' };
    }));
    res.json(media.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  } catch (error) { next(error); }
});

app.post('/api/upload', upload.array('files', 30), async (req, res, next) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files.length) return res.status(400).json({ error: '请选择图片文件。' });
    await ensureStorage();
    const content = await readContent(); content.media ||= {};
    const results = [];
    for (const file of files) {
      const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.webp`;
      const output = await sharp(file.buffer, { animated: false, failOn: 'none' }).rotate().resize({ width: imageMaxDimension, height: imageMaxDimension, fit: 'inside', withoutEnlargement: true }).webp({ quality: imageQuality, smartSubsample: true }).toFile(path.join(uploadDir, filename));
      content.media[filename] = { title: path.parse(file.originalname).name, description: '' };
      results.push({ url: `${imageUrlPrefix}${filename}`, filename: file.originalname, size: output.size, width: output.width, height: output.height });
    }
    await writeContent(content);
    res.status(201).json(results.length === 1 ? results[0] : results);
  } catch (error) { next(error); }
});

app.put('/api/media/:filename', async (req, res, next) => {
  try {
    const filename = path.basename(req.params.filename); const content = await readContent(); content.media ||= {};
    if (!content.media[filename]) content.media[filename] = {};
    content.media[filename].title = String(req.body.title || '').trim(); content.media[filename].description = String(req.body.description || '').trim();
    await writeContent(content); res.json(content.media[filename]);
  } catch (error) { next(error); }
});

const bookUpload = multer({ storage: multer.diskStorage({
  destination: bookDir,
  filename: (_, file, callback) => callback(null, `${Date.now()}-${randomUUID().slice(0, 8)}${path.extname(file.originalname).toLowerCase()}`),
}), limits: { fileSize: 100 * 1024 * 1024 }, fileFilter: (_, file, callback) => callback(null, /\.(txt|doc|docx|pdf|epub)$/i.test(file.originalname)) });
app.post('/api/books/upload', bookUpload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: '请选择 TXT、Word、PDF 或 EPUB 文件。' });
    const content = await readContent();
    const maxOrder = (content.books || []).reduce((max, item) => Math.max(max, Number(item.sortOrder) || 0), content.books?.length || 0);
    const originalName = decodeUploadName(req.file.originalname);
    const book = { id: randomUUID(), title: path.basename(originalName, path.extname(originalName)), description: '', filename: originalName, downloadName: originalName, url: `/books/${req.file.filename}`, cover: '', size: req.file.size, sortOrder: maxOrder + 1 };
    content.books = [book, ...(content.books || [])];
    await writeContent(content);
    res.status(201).json(book);
  } catch (error) { next(error); }
});

app.get('/api/books/:id/download', async (req, res, next) => {
  try {
    const content = await readContent();
    const book = (content.books || []).find((item) => item.id === req.params.id);
    if (!book?.url) return res.status(404).json({ error: '书籍不存在。' });
    const filePath = path.join(bookDir, path.basename(book.url));
    await stat(filePath);
    const filename = String(book.downloadName || book.filename || book.title || 'book').trim() || 'book';
    res.setHeader('Content-Disposition', `attachment; filename="download"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    return res.sendFile(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') return res.status(404).json({ error: '书籍文件不存在。' });
    return next(error);
  }
});

app.put('/api/books/:id', async (req, res, next) => {
  try {
    const content = await readContent();
    const index = (content.books || []).findIndex((book) => book.id === req.params.id);
    if (index < 0) return res.status(404).json({ error: '书籍不存在。' });
    content.books[index] = cleanBook(req.body, content.books[index]);
    await writeContent(content);
    res.json(content.books[index]);
  } catch (error) { next(error); }
});

app.delete('/api/books/:id', async (req, res, next) => {
  try {
    const content = await readContent();
    const book = (content.books || []).find((item) => item.id === req.params.id);
    if (!book) return res.status(404).json({ error: '书籍不存在。' });
    content.books = content.books.filter((item) => item.id !== req.params.id);
    await writeContent(content);
    if (book.url) {
      try { await unlink(path.join(bookDir, path.basename(book.url))); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    res.status(204).end();
  } catch (error) { next(error); }
});

app.delete('/api/media/:filename', async (req, res, next) => {
  try {
    const filename = path.basename(req.params.filename);
    if (!filename || filename !== req.params.filename) return res.status(400).json({ error: '无效的图片名称。' });
    const url = `${imageUrlPrefix}${filename}`;
    const content = await readContent();
    const inUse = content.posts.some(post => post.image === url)
      || content.albums.some(album => album.cover === url || album.photos.some(photo => photo.src === url))
      || content.site?.avatar === url
      || content.site?.friends?.some(friend => friend.avatar === url);
    if (inUse) return res.status(409).json({ error: '图片正在被文章或相册使用，无法删除。' });
    await unlink(path.join(uploadDir, filename));
    if (content.media) { delete content.media[filename]; await writeContent(content); }
    res.status(204).end();
  } catch (error) {
    if (error.code === 'ENOENT') return res.status(404).json({ error: '图片不存在。' });
    next(error);
  }
});

app.post('/api/posts', async (req, res, next) => {
  try { const content = await readContent(); const post = cleanPost(req.body); content.posts.unshift(post); await writeContent(content); res.status(201).json(post); } catch (error) { next(error); }
});
app.put('/api/posts/:id', async (req, res, next) => {
  try { const content = await readContent(); const index = content.posts.findIndex(p => p.id === req.params.id); if (index < 0) return res.status(404).json({ error: '文章不存在。' }); const post = cleanPost(req.body, content.posts[index]); content.posts[index] = post; await writeContent(content); res.json(post); } catch (error) { next(error); }
});
app.delete('/api/posts/:id', async (req, res, next) => {
  try { const content = await readContent(); content.posts = content.posts.filter(p => p.id !== req.params.id); content.featuredIds = content.featuredIds.filter(id => id !== req.params.id); await writeContent(content); res.status(204).end(); } catch (error) { next(error); }
});

app.post('/api/albums', async (req, res, next) => {
  try { const content = await readContent(); const album = cleanAlbum(req.body); content.albums.push(album); await writeContent(content); res.status(201).json(album); } catch (error) { next(error); }
});
app.put('/api/albums/:id', async (req, res, next) => {
  try { const content = await readContent(); const index = content.albums.findIndex(a => a.id === req.params.id); if (index < 0) return res.status(404).json({ error: '相册不存在。' }); const album = cleanAlbum(req.body, content.albums[index]); content.albums[index] = album; await writeContent(content); res.json(album); } catch (error) { next(error); }
});
app.delete('/api/albums/:id', async (req, res, next) => {
  try { const content = await readContent(); content.albums = content.albums.filter(a => a.id !== req.params.id); await writeContent(content); res.status(204).end(); } catch (error) { next(error); }
});
app.post('/api/albums/:id/photos', async (req, res, next) => {
  try { const content = await readContent(); const album = content.albums.find(a => a.id === req.params.id); if (!album) return res.status(404).json({ error: '相册不存在。' }); const photo = { id: randomUUID(), src: String(req.body.src || ''), title: String(req.body.title || '未命名照片'), description: String(req.body.description || ''), date: String(req.body.date || new Date().toISOString().slice(0, 10)).replaceAll('-', '/') }; if (!photo.src) return res.status(400).json({ error: '照片地址不能为空。' }); album.photos.unshift(photo); if (!album.cover) album.cover = photo.src; await writeContent(content); res.status(201).json(photo); } catch (error) { next(error); }
});
app.put('/api/albums/:albumId/photos/:photoId', async (req, res, next) => {
  try {
    const content = await readContent();
    const album = content.albums.find((item) => item.id === req.params.albumId);
    const photo = album?.photos.find((item) => item.id === req.params.photoId);
    if (!photo) return res.status(404).json({ error: '照片不存在。' });
    photo.title = String(req.body.title || '').trim() || '未命名照片';
    photo.description = String(req.body.description || '').trim();
    await writeContent(content);
    res.json(photo);
  } catch (error) { next(error); }
});
app.delete('/api/albums/:albumId/photos/:photoId', async (req, res, next) => {
  try { const content = await readContent(); const album = content.albums.find(a => a.id === req.params.albumId); if (!album) return res.status(404).json({ error: '相册不存在。' }); album.photos = album.photos.filter(photo => photo.id !== req.params.photoId); await writeContent(content); res.status(204).end(); } catch (error) { next(error); }
});

app.use((error, _, res, __) => { console.error(error); const uploadError = error.code === 'LIMIT_FILE_SIZE' || error.code === 'LIMIT_UNEXPECTED_FILE'; res.status(uploadError ? 413 : 500).json({ error: error.code === 'LIMIT_FILE_SIZE' ? `图片不能超过 ${maxUploadMb}MB。` : error.code === 'LIMIT_UNEXPECTED_FILE' ? '仅支持 JPG、PNG、WebP、GIF、AVIF 或 HEIC 图片。' : '保存失败，请稍后重试。' }); });

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(root, 'dist')));
  app.use((_, res) => res.sendFile(path.join(root, 'dist', 'index.html')));
}

await ensureStorage();
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';
app.listen(port, host, () => console.log(`Content API: http://${host}:${port}`));
