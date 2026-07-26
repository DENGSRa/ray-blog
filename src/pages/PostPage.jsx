import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import GithubSlugger from 'github-slugger';
import { PostImage, PostMeta } from '../components/Content';
import { AppLink } from '../lib/router';

function scrollToHeading(id) {
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
}

function extractText(children) {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(extractText).join('');
  if (children?.props?.children) return extractText(children.props.children);
  return '';
}

export function PostPage({ post, posts }) {
  if (!post) return null;
  const nearby = posts.filter((item) => item.id !== post.id).slice(0, 3);

  const headings = useMemo(() => {
    const s = new GithubSlugger();
    const result = [];
    let inCode = false;
    for (const line of (post.content || post.excerpt).split('\n')) {
      if (line.trimStart().startsWith('```')) { inCode = !inCode; continue; }
      if (!inCode && /^#{1,3} /.test(line)) {
        const text = line.replace(/^#+ /, '');
        result.push({ text, id: s.slug(text) });
      }
    }
    return result;
  }, [post]);

  const makeHeading = (Tag) => {
    const s = new GithubSlugger();
    return ({ children, ...props }) => (
      <Tag id={s.slug(extractText(children))} {...props}>{children}</Tag>
    );
  };

  return (
    <main className="post-page">
      <aside className="post-toc">
        <AppLink href="/articles" className="back-link"><ArrowLeft />返回文章</AppLink>
        <b>☷ 目录</b>
        {headings.map((h) => <button key={h.id} onClick={() => scrollToHeading(h.id)}>{h.text}</button>)}
      </aside>
      <div className="post-content">
        <article className="post-detail">
          <PostImage post={post} className="post-hero-image" />
          <div className="post-heading"><h1>{post.title}</h1><PostMeta post={post} /></div>
          <div className="article-body"><ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{ h1: makeHeading('h1'), h2: makeHeading('h2'), h3: makeHeading('h3') }}
          >{post.content || post.excerpt}</ReactMarkdown></div>
        </article>
        <section className="related-posts">
          <h2>继续阅读</h2>
          <div>{nearby.map((item) => <AppLink href={`/posts/${item.id}`} key={item.id}>{item.title}<ArrowRight /></AppLink>)}</div>
        </section>
      </div>
    </main>
  );
}
