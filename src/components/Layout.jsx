import { useEffect, useState } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { navs } from '../constants';
import { AppLink } from '../lib/router';

export function Header({ theme, setTheme, pathname, site }) {
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="site-header">
      <AppLink className="brand" href="/">{site?.brand || 'RAY BLOG'}</AppLink>
      <button
        className="menu-button"
        aria-label={open ? '关闭菜单' : '打开菜单'}
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
      <nav className={open ? 'open' : ''}>
        {navs.map(([label, href]) => (
          <AppLink key={href} href={href} className={pathname === href ? 'active' : ''}>
            {label}
          </AppLink>
        ))}
        <button
          className="theme-button"
          aria-label="切换主题"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
          <span>切换主题</span>
        </button>
      </nav>
    </header>
  );
}

export function Footer({ site }) {
  return (
    <footer>
      <p>{site?.footerQuote}</p>
      <span>{site?.copyright}</span>
      <small>{site?.footerNote}</small>
    </footer>
  );
}

export function PageHeading({ title, subtitle }) {
  return (
    <section className="page-heading">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </section>
  );
}
