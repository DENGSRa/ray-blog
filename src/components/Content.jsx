export function PostMeta({ post }) {
  return (
    <div className="post-meta">
      <span>{post.date}</span>
      <i>·</i>
      <span>{post.category}</span>
      {post.tags?.map((tag) => <em key={tag}>{tag}</em>)}
    </div>
  );
}

export function PostImage({ post, className = '', children }) {
  return (
    <div
      className={`${className} image-surface`}
      style={post.image ? { backgroundImage: `url(${post.image})` } : {}}
    >
      {!post.image && <span>{post.title}</span>}
      {children}
    </div>
  );
}

export function GlowCard({ className = '', children, ...props }) {
  return (
    <button className={`glow-card ${className}`} {...props}>
      {children}
    </button>
  );
}
