function navigate(event, href) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  event.preventDefault();
  const current = `${window.location.pathname}${window.location.search}`;
  if (current === href) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const updatePage = () => {
    window.history.pushState({}, '', href);
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  updatePage();
}

export function AppLink({ href, children, className = '', ...props }) {
  return (
    <a href={href} className={className} onClick={(event) => navigate(event, href)} {...props}>
      {children}
    </a>
  );
}
