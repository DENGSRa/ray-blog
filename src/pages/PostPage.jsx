import { ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PostImage, PostMeta } from '../components/Content';
import { AppLink } from '../lib/router';

export function PostPage({ post, posts }) {
  if (!post) return null;
  const nearby = posts.filter((item) => item.id !== post.id).slice(0, 3);

  return (
    <main className="post-page">
      <div className="post-content">
        <article className="post-detail">
          <PostImage post={post} className="post-hero-image" />
          <div className="post-heading"><h1>{post.title}</h1><PostMeta post={post} /></div>
          <div className="article-body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content || post.excerpt}</ReactMarkdown></div>
        </article>
        <section className="related-posts">
          <h2>继续阅读</h2>
          <div>{nearby.map((item) => <AppLink href={`/posts/${item.id}`} key={item.id}>{item.title}<ArrowRight /></AppLink>)}</div>
        </section>
      </div>
    </main>
  );
}
