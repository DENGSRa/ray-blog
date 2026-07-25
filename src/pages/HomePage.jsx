import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GitBranch,
  Music,
  Film,
  Mail,
} from 'lucide-react';
import { AppLink } from '../lib/router';
import { PostImage, PostMeta } from '../components/Content';
import { avatarImageStyle } from '../lib/avatar';

function Typewriter({ text, start = true, onDone }) {
  const [display, setDisplay] = useState('');
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    if (!start) return;
    setDisplay('');
    let index = 0;
    const timer = setInterval(() => {
      index++;
      setDisplay(text.slice(0, index));
      if (index >= text.length) { clearInterval(timer); onDoneRef.current?.(); }
    }, 80);
    return () => clearInterval(timer);
  }, [text, start]);
  return <span>{display}</span>;
}

function Hero({ content, site }) {
  const [subtitleDone, setSubtitleDone] = useState(false);
  const [statsDone, setStatsDone] = useState(false);
  const allDone = subtitleDone && statsDone;
  const photoCount = content.albums.reduce((sum, album) => sum + album.photos.length, 0);
  const start = new Date(site?.startDate || Date.now());
  const days = Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000));
  const statsText = `${content.posts.length} 篇文章 · ${photoCount} 张照片 · ${days} 天`;

  return (
    <section className="hero">
      <div className="hero-glow" />
      <h1>{site?.heroTitle}</h1>
      <p className={`typewriter${subtitleDone ? ' done' : ''}`}><Typewriter text={site?.heroSubtitle || ''} onDone={() => setSubtitleDone(true)} /></p>
      <div className="ink-line" aria-hidden="true">
        {Array.from({ length: 10 }, (_, index) => <i key={index} />)}
      </div>
      <div className="stats"><Typewriter text={statsText} start={subtitleDone} onDone={() => setStatsDone(true)} /></div>
    </section>
  );
}

function Featured({ posts }) {
  const items = posts.length ? posts : [];
  const [current, setCurrent] = useState(0);
  const [slideDirection, setSlideDirection] = useState('next');

  const changeSlide = (nextIndex, direction = 'next') => {
    setSlideDirection(direction);
    setCurrent(nextIndex);
  };

  useEffect(() => {
    setCurrent(0);
    setSlideDirection('next');
  }, [items.length]);
  useEffect(() => {
    if (items.length < 2) return undefined;
    const timer = setInterval(() => {
      setSlideDirection('next');
      setCurrent((value) => (value + 1) % items.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [items.length]);

  if (!items.length) return null;
  const item = items[current % items.length];

  return (
    <section className="featured-wrap" aria-label="精选文章">
      <AppLink href={`/posts/${item.id}`} className={`featured-card slide-${slideDirection}`} key={item.id}>
        <PostImage post={item} className="featured-image" />
        <div className="featured-copy">
          <span className="category">{item.category}</span>
          <h2>{item.title}</h2>
          <p>{item.excerpt}</p>
          <div className="featured-meta">
            <span><Clock3 />{item.date}</span>
            <span className="read-more">阅读全文 <ArrowRight /></span>
          </div>
        </div>
      </AppLink>
      {items.length > 1 && (
        <>
          <button className="slide prev" aria-label="上一篇" onClick={() => changeSlide((current + items.length - 1) % items.length, 'prev')}><ChevronLeft /></button>
          <button className="slide next" aria-label="下一篇" onClick={() => changeSlide((current + 1) % items.length, 'next')}><ChevronRight /></button>
          <div className="dots">
            {items.map((_, index) => (
              <button key={index} aria-label={`第 ${index + 1} 页`} className={index === current ? 'current' : ''} onClick={() => changeSlide(index, index >= current ? 'next' : 'prev')} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function HomePost({ post }) {
  return (
    <article className="home-post home-post-card">
      <AppLink href={`/posts/${post.id}`} className="home-post-media"><PostImage post={post} className="home-post-image" /></AppLink>
      <div>
        <h3><AppLink href={`/posts/${post.id}`}>{post.title}</AppLink></h3>
        <p>{post.excerpt}</p>
        <PostMeta post={post} />
      </div>
    </article>
  );
}

export function ProfileCard({ compact = false, site }) {
  return (
    <section className={`profile-card ${compact ? 'compact' : ''}`}>
      <div className="profile-avatar">
        {site?.avatar
          ? <span className="avatar-crop-frame"><img src={site.avatar} alt="" style={avatarImageStyle(site.avatarPosition, site.avatarZoom)} /></span>
          : (site?.profileName?.[0] || '川')}
      </div>
      <div className="profile-copy">
        <h2>{compact ? site?.profileCompactTitle : site?.profileName}</h2>
        <div className="profile-tags">
          {site?.profileTags?.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        <p>{site?.profileBio}</p>
        <div className="socials">
          {site?.githubUrl && <a href={site.githubUrl} target="_blank" rel="noreferrer"><GitBranch />GitHub</a>}
          {site?.bilibiliUrl && <a href={site.bilibiliUrl} target="_blank" rel="noreferrer"><Film />B站</a>}
          {site?.neteaseUrl && <a href={site.neteaseUrl} target="_blank" rel="noreferrer"><Music />网易云</a>}
          {site?.email && <a href={`mailto:${site.email}`}><Mail />Email</a>}
        </div>
      </div>
    </section>
  );
}

function HomeSidebar({ posts, site }) {
  const tags = [...new Set(posts.flatMap((post) => post.tags || []))].slice(0, 10);
  return (
    <aside className="home-sidebar home-lower">
      <section className="panel archive">
        <h3>归档</h3>
        <p className="month">2026年7月</p>
        {posts.slice(0, 6).map((post) => (
          <AppLink href={`/posts/${post.id}`} key={post.id}>
            <span>{post.date.slice(5)}</span>{post.title}
          </AppLink>
        ))}
      </section>
      <section className="panel tag-panel">
        <h3>标签</h3>
        <div>{tags.map((tag) => <AppLink href={`/articles?tag=${encodeURIComponent(tag)}`} key={tag}>{tag}</AppLink>)}</div>
      </section>
    </aside>
  );
}

export function HomePage({ content }) {
  const site = content.site;
  const featured = content.featuredIds
    .map((id) => content.posts.find((post) => post.id === id))
    .filter(Boolean);

  return (
    <>
      <Hero content={content} site={site} />
      <Featured posts={featured.length ? featured : content.posts.slice(0, 3)} />
      <div className="home-content">
        <section className="latest home-latest">
          <div className="section-title">
            <h2>最新文章</h2>
            <AppLink href="/articles">查看更多 <ArrowRight /></AppLink>
          </div>
          <div className="home-posts home-posts-grid">
            {content.posts.slice(0, 8).map((post) => <HomePost key={post.id} post={post} />)}
          </div>
        </section>
        <HomeSidebar posts={content.posts} site={site} />
        <ProfileCard compact site={site} />
      </div>
    </>
  );
}
