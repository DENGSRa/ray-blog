import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Edit3,
  Eye,
  EyeOff,
  FilePlus2,
  FolderOpen,
  Image as ImageIcon,
  LayoutDashboard,
  Plus,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { emptyAlbum, emptyPost, fallbackImage } from '../constants';
import { PostImage, PostMeta } from '../components/Content';
import { api, toDate, toDateDisplay } from '../lib/api';
import { AppLink } from '../lib/router';
import { avatarImageStyle, parseAvatarPosition } from '../lib/avatar';

export function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setError('');
    try { await api('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) }); onLogin(); }
    catch (loginError) { setError(loginError.message); }
    finally { setLoading(false); }
  };
  return (
    <main className="admin-login-page">
      <div className="admin-login-grid" aria-hidden="true" />
      <div className="admin-login-orb admin-login-orb-one" aria-hidden="true" />
      <div className="admin-login-orb admin-login-orb-two" aria-hidden="true" />
      <div className="admin-login-layout">
        <section className="admin-login-intro">
          <div className="admin-login-kicker"><span>RAY BLOG</span><i /> <small>PRIVATE SPACE</small></div>
          <h1>把灵感，留在<br /><em>自己的空间。</em></h1>
          <p>记录、整理，再把每一次思考打磨成值得分享的内容。</p>
          <div className="admin-login-points">
            <span><b>01</b> 内容与媒体集中管理</span>
            <span><b>02</b> 轻盈、安静的写作体验</span>
          </div>
        </section>

        <form className="admin-login-card" onSubmit={submit}>
          <div className="admin-login-card-head">
            <div className="admin-login-icon"><LayoutDashboard /></div>
            <span>CONTROL CENTER</span>
          </div>
          <h2>欢迎回来</h2>
          <p className="admin-login-card-desc">登录后继续管理你的博客内容。</p>
          <label className="admin-login-field">用户名
            <input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="输入管理员账号" />
          </label>
          <label className="admin-login-field">密码
            <span className="admin-password-input">
              <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="输入登录密码" />
              <button type="button" aria-label={showPassword ? '隐藏密码' : '显示密码'} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeOff /> : <Eye />}</button>
            </span>
          </label>
          {error && <p className="form-error admin-login-error" role="alert">{error}</p>}
          <button className="primary-button admin-login-submit" disabled={loading}><span>{loading ? '正在验证…' : '进入管理后台'}</span>{loading ? <ShieldCheck /> : <ArrowRight />}</button>
          <p className="admin-login-security"><ShieldCheck /> 管理入口已启用安全会话保护</p>
        </form>
      </div>
    </main>
  );
}

function MediaPicker({ value, onChange, label = '上传图片' }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadMedia = async () => {
    setLoading(true);
    try { setMedia(await api('/api/media')); } catch (loadError) { setError(loadError.message); } finally { setLoading(false); }
  };

  const openLibrary = () => {
    setOpen(true);
    loadMedia();
  };

  const select = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const data = new FormData();
      data.append('files', file);
      const result = await api('/api/upload', { method: 'POST', body: data });
      onChange(Array.isArray(result) ? result[0].url : result.url);
      await loadMedia();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="upload-control">
      <label><Upload />{uploading ? '正在上传…' : label}<input type="file" accept="image/*" onChange={select} disabled={uploading} /></label>
      <button type="button" className="media-library-button" onClick={openLibrary}><ImageIcon />从媒体库选择</button>
      {value && <><img src={value} alt="图片预览" /><button type="button" onClick={() => onChange('')}>移除</button></>}
      {error && <small>{error}</small>}
      {open && (
        <div className="media-modal" role="dialog" aria-modal="true" aria-label="媒体库" onClick={() => setOpen(false)}>
          <section onClick={(event) => event.stopPropagation()}>
            <header><div><h2>媒体库</h2><p>上传会自动压缩并转为 WebP。</p></div><button type="button" aria-label="关闭媒体库" onClick={() => setOpen(false)}><X /></button></header>
            <label className="media-upload-button"><Upload />{uploading ? '正在上传…' : '上传新图片'}<input type="file" accept="image/*" onChange={select} disabled={uploading} /></label>
            {loading ? <p className="media-empty">正在读取图片…</p> : (
              <div className="media-grid">
                {media.map((item) => (
                  <button type="button" key={item.name} className={value === item.url ? 'selected' : ''} onClick={() => { onChange(item.url); setOpen(false); }}>
                    <img src={item.url} alt="" /><span>{Math.max(1, Math.round(item.size / 1024))} KB</span>
                  </button>
                ))}
                {!media.length && <p className="media-empty">还没有上传过图片。</p>}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function MediaLibrary() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setMedia(await api('/api/media')); setError(''); } catch (loadError) { setError(loadError.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const uploadMany = async (event) => {
    const files = [...(event.target.files || [])]; if (!files.length) return;
    setUploading(true); setError('');
    try { const data = new FormData(); files.forEach((file) => data.append('files', file)); await api('/api/upload', { method: 'POST', body: data }); await load(); }
    catch (uploadError) { setError(uploadError.message); } finally { setUploading(false); event.target.value = ''; }
  };
  const saveMetadata = async () => { if (!editing) return; try { await api(`/api/media/${encodeURIComponent(editing.name)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) }); setEditing(null); await load(); } catch (saveError) { setError(saveError.message); } };
  const remove = async (item) => {
    if (!confirm(`删除图片 ${item.name}？正在使用的图片不能删除。`)) return;
    try { await api(`/api/media/${encodeURIComponent(item.name)}`, { method: 'DELETE' }); await load(); } catch (deleteError) { setError(deleteError.message); }
  };

  return (
    <section className="media-manager">
      <div className="media-manager-head"><div><h2>媒体库</h2><p>支持批量上传；已被文章或相册引用的图片不能删除。</p></div><div><label className="primary-button"><Upload />{uploading ? '上传中…' : '批量上传'}<input type="file" accept="image/*" multiple hidden onChange={uploadMany} disabled={uploading} /></label> <button className="secondary-button" onClick={load}>刷新</button></div></div>
      {error && <p className="form-error">{error}</p>}
      {loading ? <p className="media-empty">正在读取图片…</p> : <div className="media-manager-grid">{media.map((item) => <article key={item.name}><img src={item.url} alt={item.title || ''} /><div><span>{item.title || item.name}</span><small>{Math.max(1, Math.round(item.size / 1024))} KB</small></div><button type="button" aria-label="编辑图片信息" onClick={() => setEditing(item)}><Edit3 /></button><button type="button" aria-label="删除图片" onClick={() => remove(item)}><Trash2 /></button></article>)}{!media.length && <p className="media-empty">还没有上传过图片。</p>}</div>}
      {editing && <div className="media-modal" onClick={() => setEditing(null)}><section onClick={(event) => event.stopPropagation()}><h2>编辑图片信息</h2><label>标题<input value={editing.title || ''} onChange={(event) => setEditing({ ...editing, title: event.target.value })} /></label><label>描述<textarea value={editing.description || ''} onChange={(event) => setEditing({ ...editing, description: event.target.value })} /></label><button className="primary-button" onClick={saveMetadata}>保存</button></section></div>}
    </section>
  );
}

function BooksLibrary({ content, reload }) {
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const uploadBook = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const data = new FormData();
      data.append('file', file);
      await api('/api/books/upload', { method: 'POST', body: data });
      await reload();
    } catch (uploadError) { setError(uploadError.message); } finally { setUploading(false); event.target.value = ''; }
  };
  const books = [...(content.books || [])].sort((a, b) => (Number(a.sortOrder) || 999999) - (Number(b.sortOrder) || 999999));
  const saveBook = async () => {
    if (!editing) return;
    setSaving(true); setError('');
    try { await api(`/api/books/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) }); setEditing(null); await reload(); }
    catch (saveError) { setError(saveError.message); }
    finally { setSaving(false); }
  };
  const deleteBook = async (book) => {
    if (!confirm(`确定删除《${book.title}》吗？`)) return;
    setError('');
    try { await api(`/api/books/${book.id}`, { method: 'DELETE' }); await reload(); }
    catch (deleteError) { setError(deleteError.message); }
  };
  return <section className="media-manager books-manager">
    <div className="media-manager-head"><div><h2>书籍库</h2><p>支持 TXT、Word、PDF 和 EPUB；可编辑书名、简介、封面和显示顺序。</p></div><label className="primary-button"><Upload />{uploading ? '上传中…' : '上传书籍'}<input type="file" accept=".txt,.doc,.docx,.pdf,.epub" onChange={uploadBook} hidden disabled={uploading} /></label></div>
    {error && <p className="form-error">{error}</p>}
    <div className="admin-table">{books.map((book) => (
      <article className="book-admin-row" key={book.id}>
        <div className="book-admin-cover">{book.cover ? <img src={book.cover} alt="" /> : <BookOpen />}</div>
        <div><h3>{book.title}</h3><p>{book.description || book.filename}</p><small>排序：{book.sortOrder || '未设置'} · {Math.max(1, Math.round((book.size || 0) / 1024))} KB</small></div>
        <div className="admin-row-actions"><button type="button" aria-label="编辑书籍" onClick={() => setEditing({ ...book })}><Edit3 /></button><a className="secondary-button" href={book.url} download>下载</a><button type="button" aria-label="删除书籍" onClick={() => deleteBook(book)}><Trash2 /></button></div>
      </article>
    ))}{!books.length && <p className="media-empty">还没有上传过书籍。</p>}</div>
    {editing && <div className="media-modal" role="dialog" aria-modal="true" onClick={() => setEditing(null)}><section className="book-edit-modal" onClick={(event) => event.stopPropagation()}>
      <header><div><h2>编辑书籍</h2><p>文件本身不会被修改，只保存展示信息。</p></div><button type="button" aria-label="关闭编辑" onClick={() => setEditing(null)}><X /></button></header>
      <label>书名<input value={editing.title || ''} onChange={(event) => setEditing({ ...editing, title: event.target.value })} /></label>
      <label>简介<textarea value={editing.description || ''} onChange={(event) => setEditing({ ...editing, description: event.target.value })} /></label>
      <label>显示顺序（数字越小越靠前）<input type="number" min="1" step="1" value={editing.sortOrder || 1} onChange={(event) => setEditing({ ...editing, sortOrder: Number(event.target.value) || 1 })} /></label>
      <label>封面图片</label><MediaPicker value={editing.cover || ''} onChange={(value) => setEditing({ ...editing, cover: value })} label="上传或选择封面" />
      <div className="book-edit-actions"><button type="button" className="secondary-button" onClick={() => setEditing(null)}>取消</button><button type="button" className="primary-button" onClick={saveBook} disabled={saving}><Save />{saving ? '保存中…' : '保存书籍'}</button></div>
    </section></div>}
  </section>;
}

function PostEditor({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({
    ...emptyPost(),
    ...initial,
    date: toDate(initial?.date || new Date().toISOString().slice(0, 10)),
    tags: (initial?.tags || []).join(', '),
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(false);
  const contentRef = useRef(null);
  const draftKey = `ray-blog-draft:${initial?.id || 'new'}`;
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    const saved = localStorage.getItem(draftKey);
    if (!saved) return;
    try {
      const draft = JSON.parse(saved);
      if (draft.updatedAt && Date.now() - draft.updatedAt < 1000 * 60 * 60 * 24 * 30) setForm(draft.form);
    } catch { localStorage.removeItem(draftKey); }
  }, [draftKey]);
  useEffect(() => {
    const timer = setTimeout(() => localStorage.setItem(draftKey, JSON.stringify({ form, updatedAt: Date.now() })), 350);
    return () => clearTimeout(timer);
  }, [draftKey, form]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({
        ...form,
        date: toDateDisplay(form.date),
        tags: form.tags.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean),
      });
      localStorage.removeItem(draftKey);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="editor-form" onSubmit={submit}>
      <div className="editor-form-title"><h2>{initial?.id ? '编辑文章' : '新建文章'}</h2><button type="button" onClick={onCancel}>取消</button></div>
      <label>标题<input required value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="文章标题" /></label>
      <label>摘要<textarea value={form.excerpt} onChange={(event) => update('excerpt', event.target.value)} placeholder="文章摘要" /></label>
      <div className="form-two">
        <label>分类<select value={form.category} onChange={(event) => update('category', event.target.value)}>{['生活', '音乐', '编程', '摄影'].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>发布日期<input type="date" value={form.date} onChange={(event) => update('date', event.target.value)} /></label>
      </div>
      <label>标签（用逗号隔开）<input value={form.tags} onChange={(event) => update('tags', event.target.value)} placeholder="React, 前端" /></label>
      <MediaPicker value={form.image} onChange={(value) => update('image', value)} label="上传文章封面" />
      <label className="checkbox-line"><input type="checkbox" checked={form.pinned} onChange={(event) => update('pinned', event.target.checked)} />置顶文章</label>
      <div className="editor-content-label"><span>正文（支持完整 Markdown、表格、任务列表和图片）</span><div><button type="button" className={preview ? 'selected' : ''} onClick={() => setPreview(!preview)}>实时预览</button><small>自动保存草稿</small><MediaPicker value="" label="插入图片" onChange={(url) => update('content', `${form.content}${form.content.endsWith('\n') || !form.content ? '' : '\n'}\n![图片](${url})\n`)} /></div></div>
      <div className={`markdown-editor ${preview ? 'previewing' : ''}`}>
        <textarea ref={contentRef} className="content-field" value={form.content} onChange={(event) => update('content', event.target.value)} placeholder="从这里开始写作…" />
        {preview && <article className="markdown-preview"><ReactMarkdown remarkPlugins={[remarkGfm]}>{form.content || '*暂无内容*'}</ReactMarkdown></article>}
      </div>
      {error && <p className="form-error">{error}</p>}
      <button className="primary-button" disabled={saving}><Save />{saving ? '保存中…' : '保存文章'}</button>
    </form>
  );
}

function AlbumEditor({ initial, onSave, onCancel, onUploadPhoto, onDeletePhoto }) {
  const [form, setForm] = useState(() => ({ ...emptyAlbum(), ...initial }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoDescription, setPhotoDescription] = useState('');
  const [photoSrc, setPhotoSrc] = useState('');
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try { await onSave(form); } catch (saveError) { setError(saveError.message); } finally { setSaving(false); }
  };

  const addPhoto = async () => {
    if (!initial?.id || !photoSrc) return;
    try {
      await onUploadPhoto(initial.id, {
        src: photoSrc,
        title: photoTitle || '未命名照片',
        description: photoDescription,
        date: new Date().toISOString().slice(0, 10),
      });
      setPhotoTitle('');
      setPhotoDescription('');
      setPhotoSrc('');
    } catch (uploadError) {
      setError(uploadError.message);
    }
  };

  return (
    <form className="editor-form" onSubmit={submit}>
      <div className="editor-form-title"><h2>{initial?.id ? '编辑相册' : '新建相册'}</h2><button type="button" onClick={onCancel}>取消</button></div>
      <label>相册名称<input required value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="例如：旅途" /></label>
      <label>路径标识（可选）<input value={form.slug} onChange={(event) => update('slug', event.target.value)} placeholder="journey" /></label>
      <label>相册描述<textarea value={form.desc} onChange={(event) => update('desc', event.target.value)} placeholder="用一句话介绍这个相册" /></label>
      <MediaPicker value={form.cover} onChange={(value) => update('cover', value)} label="上传相册封面" />
      {initial?.id && (
        <section className="album-upload-box">
          <h3>上传照片到相册</h3>
          <MediaPicker value={photoSrc} onChange={setPhotoSrc} label="选择照片" />
          <input value={photoTitle} onChange={(event) => setPhotoTitle(event.target.value)} placeholder="照片标题" />
          <input value={photoDescription} onChange={(event) => setPhotoDescription(event.target.value)} placeholder="照片描述（可选）" />
          <button type="button" disabled={!photoSrc} onClick={addPhoto} className="secondary-button"><Plus />添加照片</button>
          <div className="admin-photo-list">
            {initial.photos.map((photo) => (
              <div key={photo.id}>
                <img src={photo.src} alt="" /><span>{photo.title}</span>
                <button type="button" aria-label="删除照片" onClick={() => onDeletePhoto(initial.id, photo.id)}><Trash2 /></button>
              </div>
            ))}
          </div>
        </section>
      )}
      {error && <p className="form-error">{error}</p>}
      <button className="primary-button" disabled={saving}><Save />{saving ? '保存中…' : '保存相册'}</button>
    </form>
  );
}

function SiteSettingsEditor({ initial, onSave }) {
  const [form, setForm] = useState(() => ({
    ...initial,
    profileTags: (initial.profileTags || []).join(', '),
    mbti: { ...initial.mbti, tags: (initial.mbti?.tags || []).join(', ') },
    friends: initial.friends || [],
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateNested = (group, key, value) => setForm((current) => ({ ...current, [group]: { ...current[group], [key]: value } }));
  const avatarPosition = parseAvatarPosition(form.avatarPosition);
  const updateAvatarPosition = (axis, value) => {
    const next = { ...avatarPosition, [axis]: Number(value) };
    update('avatarPosition', `${next.x}% ${next.y}%`);
  };
  const updateFriend = (index, key, value) => setForm((current) => ({ ...current, friends: current.friends.map((friend, friendIndex) => friendIndex === index ? { ...friend, [key]: value } : friend) }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({
        ...form,
        profileTags: form.profileTags.split(/[,，]/).map((item) => item.trim()).filter(Boolean),
        mbti: { ...form.mbti, tags: form.mbti.tags.split(/[,，]/).map((item) => item.trim()).filter(Boolean) },
      });
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="editor-form site-settings-form" onSubmit={submit}>
      <section className="settings-section">
        <h3>基础信息</h3>
        <div className="form-two">
          <label>网页标题<input value={form.title || ''} onChange={(event) => update('title', event.target.value)} /></label>
          <label>首页统计起始日期<input type="date" value={form.startDate} onChange={(event) => update('startDate', event.target.value)} /></label>
        </div>
        <label>导航栏名称<input value={form.brand} onChange={(event) => update('brand', event.target.value)} /></label>
        <label>首页主标题<input value={form.heroTitle} onChange={(event) => update('heroTitle', event.target.value)} /></label>
        <label>首页副标题<input value={form.heroSubtitle} onChange={(event) => update('heroSubtitle', event.target.value)} /></label>
      </section>

      <section className="settings-section">
        <h3>头像和个人资料</h3>
        <MediaPicker value={form.avatar} onChange={(value) => update('avatar', value)} label="上传头像" />
        <div className="avatar-setting-preview"><div className="avatar-crop-frame">{form.avatar ? <img src={form.avatar} alt="头像预览" style={avatarImageStyle(form.avatarPosition, form.avatarZoom)} /> : <span>头像预览</span>}</div></div>
        <div className="avatar-crop-controls">
          <div className="avatar-control-heading"><strong>头像裁切</strong><button type="button" className="secondary-button" onClick={() => { update('avatarPosition', '50% 50%'); update('avatarZoom', 120); }}>重置居中</button></div>
          <label className="range-setting"><span>水平位置 <output>{avatarPosition.x}%</output></span><input type="range" min="0" max="100" value={avatarPosition.x} onChange={(event) => updateAvatarPosition('x', event.target.value)} /></label>
          <label className="range-setting"><span>垂直位置 <output>{avatarPosition.y}%</output></span><input type="range" min="0" max="100" value={avatarPosition.y} onChange={(event) => updateAvatarPosition('y', event.target.value)} /></label>
          <label className="range-setting"><span>缩放 <output>{form.avatarZoom || 100}%</output></span><input type="range" min="100" max="220" value={form.avatarZoom || 100} onChange={(event) => update('avatarZoom', Number(event.target.value))} /></label>
          <small className="avatar-crop-hint">拖动滑块即可实时预览，放大后水平和垂直位置更明显。</small>
        </div>
        <div className="form-two">
          <label>显示名称<input value={form.profileName} onChange={(event) => update('profileName', event.target.value)} /></label>
          <label>首页侧栏标题<input value={form.profileCompactTitle} onChange={(event) => update('profileCompactTitle', event.target.value)} /></label>
        </div>
        <label>个人介绍<textarea value={form.profileBio} onChange={(event) => update('profileBio', event.target.value)} /></label>
        <label>个人标签（逗号隔开）<input value={form.profileTags} onChange={(event) => update('profileTags', event.target.value)} /></label>
        <div className="form-two">
          <label>GitHub 地址<input value={form.githubUrl} onChange={(event) => update('githubUrl', event.target.value)} /></label>
          <label>邮箱<input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} /></label>
        </div>
      </section>

      <section className="settings-section">
        <h3>页面文字和页脚</h3>
        <div className="form-two">
          <label>文章页副标题<input value={form.pageSubtitles.articles} onChange={(event) => updateNested('pageSubtitles', 'articles', event.target.value)} /></label>
          <label>相册页副标题<input value={form.pageSubtitles.albums} onChange={(event) => updateNested('pageSubtitles', 'albums', event.target.value)} /></label>
          <label>画廊页副标题<input value={form.pageSubtitles.gallery} onChange={(event) => updateNested('pageSubtitles', 'gallery', event.target.value)} /></label>
          <label>关于页副标题<input value={form.pageSubtitles.links} onChange={(event) => updateNested('pageSubtitles', 'links', event.target.value)} /></label>
        </div>
        <label>页脚引用<input value={form.footerQuote} onChange={(event) => update('footerQuote', event.target.value)} /></label>
        <div className="form-two">
          <label>版权文字<input value={form.copyright} onChange={(event) => update('copyright', event.target.value)} /></label>
          <label>页脚备注<input value={form.footerNote} onChange={(event) => update('footerNote', event.target.value)} /></label>
        </div>
      </section>

      <section className="settings-section">
        <h3>MBTI 卡片</h3>
        <div className="form-two">
          <label>类型<input value={form.mbti.type} onChange={(event) => updateNested('mbti', 'type', event.target.value)} /></label>
          <label>中文名称<input value={form.mbti.name} onChange={(event) => updateNested('mbti', 'name', event.target.value)} /></label>
          <label>英文名称<input value={form.mbti.english} onChange={(event) => updateNested('mbti', 'english', event.target.value)} /></label>
          <label>链接<input value={form.mbti.url} onChange={(event) => updateNested('mbti', 'url', event.target.value)} /></label>
        </div>
        <label>介绍<textarea value={form.mbti.description} onChange={(event) => updateNested('mbti', 'description', event.target.value)} /></label>
        <label>标签（逗号隔开）<input value={form.mbti.tags} onChange={(event) => updateNested('mbti', 'tags', event.target.value)} /></label>
      </section>

      <section className="settings-section">
        <div className="settings-section-head"><h3>友情链接</h3><button type="button" className="secondary-button" onClick={() => update('friends', [...form.friends, { title: '', description: '', url: '', avatar: '' }])}><Plus />新增链接</button></div>
        <div className="friend-editor-list">
          {form.friends.map((friend, index) => (
            <article key={index}>
              <div className="friend-editor-title"><strong>链接 {index + 1}</strong><button type="button" aria-label="删除友情链接" onClick={() => update('friends', form.friends.filter((_, friendIndex) => friendIndex !== index))}><Trash2 /></button></div>
              <div className="form-two">
                <label>名称<input value={friend.title} onChange={(event) => updateFriend(index, 'title', event.target.value)} /></label>
                <label>网址<input value={friend.url} onChange={(event) => updateFriend(index, 'url', event.target.value)} /></label>
              </div>
              <label>介绍<input value={friend.description} onChange={(event) => updateFriend(index, 'description', event.target.value)} /></label>
              <MediaPicker value={friend.avatar} onChange={(value) => updateFriend(index, 'avatar', value)} label="上传友链头像" />
            </article>
          ))}
        </div>
      </section>

      {error && <p className="form-error">{error}</p>}
      <button className="primary-button settings-save" disabled={saving}><Save />{saving ? '正在保存…' : '保存全部站点设置'}</button>
    </form>
  );
}

export function AdminPage({ content, reload }) {
  const [tab, setTab] = useState('posts');
  const [editingPost, setEditingPost] = useState(null);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [notice, setNotice] = useState('');

  const run = async (request, success) => {
    await request();
    setNotice(success);
    await reload();
  };
  const deletePost = async (id) => {
    if (!confirm('确定删除这篇文章吗？')) return;
    await run(() => api(`/api/posts/${id}`, { method: 'DELETE' }), '文章已删除。');
  };
  const savePost = async (form) => {
    const method = form.id ? 'PUT' : 'POST';
    const endpoint = form.id ? `/api/posts/${form.id}` : '/api/posts';
    await run(() => api(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }), '文章已保存。');
    setEditingPost(null);
  };
  const saveAlbum = async (form) => {
    const method = form.id ? 'PUT' : 'POST';
    const endpoint = form.id ? `/api/albums/${form.id}` : '/api/albums';
    await run(() => api(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }), '相册已保存。');
    setEditingAlbum(null);
  };
  const saveSite = async (form) => run(
    () => api('/api/site', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }),
    '站点设置已保存。',
  );
  const deleteAlbum = async (id) => {
    if (!confirm('确定删除这个相册吗？')) return;
    await run(() => api(`/api/albums/${id}`, { method: 'DELETE' }), '相册已删除。');
  };
  const uploadPhoto = async (albumId, photo) => run(
    () => api(`/api/albums/${albumId}/photos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(photo) }),
    '照片已添加。',
  );
  const deletePhoto = async (albumId, photoId) => {
    if (!confirm('确定删除这张照片吗？')) return;
    await run(() => api(`/api/albums/${albumId}/photos/${photoId}`, { method: 'DELETE' }), '照片已删除。');
    setEditingAlbum((current) => (current ? { ...current, photos: current.photos.filter((photo) => photo.id !== photoId) } : current));
  };

  const editor = editingPost !== null
    ? <PostEditor initial={editingPost || undefined} onSave={savePost} onCancel={() => setEditingPost(null)} />
    : editingAlbum !== null
      ? <AlbumEditor initial={editingAlbum || undefined} onSave={saveAlbum} onCancel={() => setEditingAlbum(null)} onUploadPhoto={uploadPhoto} onDeletePhoto={deletePhoto} />
      : null;

  const changeTab = (nextTab) => {
    setTab(nextTab);
    setEditingPost(null);
    setEditingAlbum(null);
  };

  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <div><LayoutDashboard /><h1>内容管理</h1></div>
        <button className={tab === 'posts' ? 'active' : ''} onClick={() => changeTab('posts')}><Edit3 />文章</button>
        <button className={tab === 'books' ? 'active' : ''} onClick={() => changeTab('books')}><BookOpen />书籍</button>
        <button className={tab === 'albums' ? 'active' : ''} onClick={() => changeTab('albums')}><FolderOpen />相册</button>
        <button className={tab === 'media' ? 'active' : ''} onClick={() => changeTab('media')}><ImageIcon />媒体库</button>
        <button className={tab === 'site' ? 'active' : ''} onClick={() => changeTab('site')}><Settings />站点设置</button>
        <AppLink href="/"><ArrowLeft />返回站点</AppLink>
      </aside>
      <section className="admin-main">
        <header>
          <div><h2>{tab === 'posts' ? '文章管理' : tab === 'books' ? '书籍管理' : tab === 'albums' ? '相册管理' : tab === 'media' ? '媒体库' : '站点设置'}</h2><p>{tab === 'media' ? '集中管理已上传的图片。' : tab === 'books' ? '管理电子书文件。' : tab === 'site' ? '修改博客名称、头像、个人资料、页面文字和友情链接。' : '内容会保存到本机的 data/content.json。'}</p></div>
          {(tab === 'posts' || tab === 'albums') && <button className="primary-button" onClick={() => (tab === 'posts' ? setEditingPost({ ...emptyPost() }) : setEditingAlbum({ ...emptyAlbum() }))}><FilePlus2 />新建{tab === 'posts' ? '文章' : '相册'}</button>}
        </header>
        {notice && <div className="admin-notice"><Check />{notice}<button onClick={() => setNotice('')}><X /></button></div>}
        {tab === 'media' ? <MediaLibrary /> : tab === 'books' ? <BooksLibrary content={content} reload={reload} /> : tab === 'site' ? <SiteSettingsEditor initial={content.site} onSave={saveSite} /> : editor || (
          <div className="admin-table">
            {tab === 'posts'
              ? content.posts.map((post) => (
                <article key={post.id}>
                  <PostImage post={post} className="admin-thumb" />
                  <div><h3>{post.title}</h3><PostMeta post={post} /></div>
                  <div className="admin-row-actions"><button onClick={() => setEditingPost(post)} aria-label="编辑文章"><Edit3 /></button><button onClick={() => deletePost(post.id)} aria-label="删除文章"><Trash2 /></button></div>
                </article>
              ))
              : content.albums.map((album) => (
                <article key={album.id}>
                  <div className="admin-thumb" style={{ backgroundImage: `url(${album.cover || fallbackImage})` }} />
                  <div><h3>{album.name}</h3><p>{album.photos.length} 张照片 · {album.desc}</p></div>
                  <div className="admin-row-actions"><button onClick={() => setEditingAlbum(album)} aria-label="编辑相册"><Edit3 /></button><button onClick={() => deleteAlbum(album.id)} aria-label="删除相册"><Trash2 /></button></div>
                </article>
              ))}
          </div>
        )}
      </section>
    </main>
  );
}
