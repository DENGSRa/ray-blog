import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUp } from 'lucide-react';
import { api } from './lib/api';
import { AppLink } from './lib/router';
import { Footer, Header, PageHeading } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ArticlesPage, BooksPage, BookReader } from './pages/ArticlesPage';
import { PostPage } from './pages/PostPage';
import { AlbumPage, AlbumsPage, GalleryPage } from './pages/MediaPages';
import { LinksPage } from './pages/LinksPage';
import { AdminLogin, AdminPage } from './pages/AdminPage';

function Loading() {
  return <main className="loading-page">正在读取博客内容…</main>;
}

function NotFound() {
  return (
    <>
      <PageHeading title="404" subtitle="这条路暂时还没有被写进地图。" />
      <main className="not-found"><AppLink href="/">回到首页 <ArrowRight /></AppLink></main>
    </>
  );
}

export function App() {
  const [location, setLocation] = useState(() => ({ pathname: window.location.pathname, search: window.location.search }));
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [showTop, setShowTop] = useState(false);
  const [content, setContent] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [adminAuthenticated, setAdminAuthenticated] = useState(null);
  const { pathname } = location;
  const isAdmin = pathname === '/admin';

  const reload = async () => {
    try {
      setLoadError('');
      setContent(await api('/api/content'));
    } catch (error) {
      setLoadError(error.message);
    }
  };

  useEffect(() => { reload(); }, []);
  useEffect(() => {
    if (!isAdmin) { setAdminAuthenticated(true); return; }
    api('/api/auth/session').then((result) => setAdminAuthenticated(Boolean(result.authenticated))).catch(() => setAdminAuthenticated(false));
  }, [isAdmin]);
  useEffect(() => {
    const onPop = () => setLocation({ pathname: window.location.pathname, search: window.location.search });
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);
  useEffect(() => { if (content?.site?.title) document.title = content.site.title; }, [content?.site?.title]);
  useEffect(() => {
    const onScroll = () => setShowTop(scrollY > 450);
    addEventListener('scroll', onScroll);
    return () => removeEventListener('scroll', onScroll);
  }, []);

  if (!content) {
    return (
      <>
        <Header theme={theme} setTheme={setTheme} pathname={pathname} site={content?.site} />
        {loadError
          ? <main className="loading-page">无法读取内容：{loadError}。请确认已通过 <code>npm run dev</code> 启动。</main>
          : <Loading />}
      </>
    );
  }

  if (isAdmin && adminAuthenticated === false) {
    return <><Header theme={theme} setTheme={setTheme} pathname={pathname} site={content.site} /><AdminLogin onLogin={() => setAdminAuthenticated(true)} /><Footer site={content.site} /></>;
  }

  if (isAdmin && adminAuthenticated === null) {
    return <><Header theme={theme} setTheme={setTheme} pathname={pathname} site={content.site} /><main className="loading-page">正在验证管理员身份…</main><Footer site={content.site} /></>;
  }

  const segment = pathname.split('/').filter(Boolean);
  let page;
  if (pathname === '/') page = <HomePage content={content} />;
  else if (pathname === '/articles') page = <ArticlesPage key={location.search} posts={content.posts || []} site={content.site} />;
  else if (pathname === '/books') page = <BooksPage key={location.search} books={content.books || []} site={content.site} />;
  else if (segment[0] === 'books') page = <BookReader book={(content.books || []).find((item) => item.id === segment[1])} />;
  else if (segment[0] === 'posts') {
    const post = content.posts.find((item) => item.id === segment[1]);
    page = post ? <PostPage post={post} posts={content.posts} /> : <NotFound />;
  } else if (pathname === '/albums') page = <AlbumsPage albums={content.albums} site={content.site} />;
  else if (segment[0] === 'albums') {
    const album = content.albums.find((item) => item.slug === segment[1]);
    page = album ? <AlbumPage album={album} /> : <NotFound />;
  } else if (pathname === '/gallery') page = <GalleryPage albums={content.albums} site={content.site} />;
  else if (pathname === '/links') page = <LinksPage site={content.site} />;
  else if (pathname === '/admin') page = <AdminPage content={content} reload={reload} />;
  else page = <NotFound />;

  return (
    <>
      <Header theme={theme} setTheme={setTheme} pathname={pathname} site={content.site} />
      <div
        key={`${pathname}${location.search}`}
        className="route-page"
      >
        {page}
      </div>
      <Footer site={content.site} />
      <button className={`back-top ${showTop ? 'visible' : ''}`} aria-label="回到顶部" onClick={() => scrollTo({ top: 0, behavior: 'smooth' })}><ArrowUp /></button>
    </>
  );
}
