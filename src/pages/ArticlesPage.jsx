import { useMemo, useState } from 'react';
import { Search, BookOpen, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import ePub from 'epubjs';
import { PageHeading } from '../components/Layout';
import { PostImage, PostMeta } from '../components/Content';
import { AppLink } from '../lib/router';

function ArticleTile({ post, view }) {
  const text = (
    <>
      <h3><AppLink href={`/posts/${post.id}`}>{post.title}</AppLink></h3>
      <p>{post.excerpt}</p>
      <PostMeta post={post} />
    </>
  );

  if (view === 'list') {
    return (
      <article className="article-list-card">
        <AppLink href={`/posts/${post.id}`}><PostImage post={post} className="article-list-image" /></AppLink>
        <div>{text}</div>
      </article>
    );
  }

  return (
    <article className="article-tile hover-glow">
      <div className="article-cover">
        <AppLink href={`/posts/${post.id}`}>
          <PostImage post={post} className="article-tile-image">{post.pinned && <b />}</PostImage>
        </AppLink>
      </div>
      {text}
    </article>
  );
}

export function ArticlesPage({ posts, site }) {
  const queryParams = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(queryParams.get('q') || '');
  const [category, setCategory] = useState(queryParams.get('category') || '全部');
  const [view, setView] = useState('grid');
  const categories = ['全部', ...new Set(posts.map((post) => post.category).filter(Boolean))];
  const filtered = useMemo(() => posts.filter((post) => {
    const matchesCategory = category === '全部' || post.category === category;
    const haystack = `${post.title} ${post.excerpt} ${(post.tags || []).join(' ')}`.toLowerCase();
    return matchesCategory && (!query || haystack.includes(query.toLowerCase()));
  }), [posts, category, query]);

  return (
    <>
      <PageHeading title="文章" subtitle={site?.pageSubtitles?.articles || '计算机专业课程笔记与学习记录'} />
      <main className="articles-page">
        <div className="article-tools">
          <div className="category-tabs">{categories.map((item) => <button className={category === item ? 'selected' : ''} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div>
          <div className="article-actions"><label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索课程" /></label><button className={view === 'grid' ? 'selected' : ''} onClick={() => setView('grid')}>网格</button><button className={view === 'list' ? 'selected' : ''} onClick={() => setView('list')}>列表</button></div>
        </div>
        <section className={`articles ${view}`}>
          {filtered.length ? filtered.map((post) => <ArticleTile post={post} view={view} key={post.id} />) : <p className="empty">没有找到匹配的课程文章。</p>}
        </section>
      </main>
    </>
  );
}

export function BooksPage({ books, site }) {
  const queryParams = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(queryParams.get('tag') || '');
  const filtered = useMemo(
    () => [...books].sort((a, b) => (Number(a.sortOrder) || 999999) - (Number(b.sortOrder) || 999999)).filter((book) => !query || `${book.title}${book.filename}`.toLowerCase().includes(query.toLowerCase())),
    [books, query],
  );

  return (
    <>
      <PageHeading title="书籍" subtitle="收藏的电子书与小说" />
      <main className="articles-page books-page">
        <div className="article-tools"><div /><div className="article-actions"><label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索书籍" /></label></div></div>
        <section className="articles grid">
          {filtered.length
            ? filtered.map((book) => <article className="article-tile hover-glow" key={book.id}><a href={`/books/${book.id}`}><div className="article-cover book-cover">{book.cover ? <img src={book.cover} alt="" /> : <BookOpen />}</div><h3>{book.title}</h3><p>{book.description || book.filename}</p></a></article>)
            : <p className="empty">没有找到书籍。</p>}
        </section>
      </main>
    </>
  );
}

export function BookReader({ book }) {
  const readerRef = useRef(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ page: 0, total: 0, chapter: '' });
  const renditionRef = useRef(null);
  useEffect(() => {
    if (!book || !readerRef.current) return undefined;
    const publication = ePub(book.url);
    const rendition = publication.renderTo(readerRef.current, { width: '100%', height: '75vh', manager: 'default', flow: 'paginated', spread: 'none' });
    renditionRef.current = rendition;
    const updateProgress = (location) => {
      const current = location?.start;
      setProgress({
        page: current?.displayed?.page || 0,
        total: current?.displayed?.total || 0,
        chapter: current?.href ? (publication.navigation?.get ? publication.navigation.get(current.href)?.label : '') || '' : '',
      });
    };
    rendition.on('relocated', updateProgress);
    publication.opened.then(() => rendition.display()).catch(() => setError('EPUB 文件无法解析，请确认文件完整。'));
    const onKey = (event) => { if (event.key === 'ArrowLeft') rendition.prev(); if (event.key === 'ArrowRight') rendition.next(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); rendition.off('relocated', updateProgress); rendition.destroy(); renditionRef.current = null; };
  }, [book]);
  if (!book) return null;
  const previous = () => renditionRef.current?.prev();
  const next = () => renditionRef.current?.next();
  return <main className="book-reader"><a className="back-link" href="/books"><ArrowLeft />返回书籍</a><h1>{book.title}</h1>{error ? <p className="empty">{error}</p> : <><div className="reader-shell"><button className="reader-nav reader-prev" onClick={previous} aria-label="上一页"><ChevronLeft /></button><div ref={readerRef} className="epub-viewer" /><button className="reader-nav reader-next" onClick={next} aria-label="下一页"><ChevronRight /></button></div><div className="reader-progress"><span>{progress.chapter || '正文'}</span><b>{progress.page ? `第 ${progress.page} / ${progress.total || '?'} 页` : '正在读取页码…'}</b></div></>}</main>;
}
