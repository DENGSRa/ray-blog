export const fallbackImage =
  'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=84';

export const navs = [
  ['首页', '/'],
  ['文章', '/articles'],
  ['书籍', '/books'],
  ['相册', '/albums'],
  ['画廊', '/gallery'],
  ['关于', '/links'],
];

export function emptyPost() {
  return {
    title: '',
    excerpt: '',
    content: '',
    date: new Date().toISOString().slice(0, 10),
    category: '生活',
    tags: [],
    image: '',
    pinned: false,
  };
}

export function emptyAlbum() {
  return { name: '', slug: '', desc: '', cover: '', photos: [] };
}
