import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { fallbackImage } from '../constants';
import { GlowCard } from '../components/Content';
import { PageHeading } from '../components/Layout';
import { AppLink } from '../lib/router';

export function AlbumsPage({ albums, site }) {
  return (
    <>
      <PageHeading title="相册" subtitle={site?.pageSubtitles?.albums} />
      <main className="albums-page">
        <section className="album-grid">
          {albums.map((album) => (
            <AppLink className="album-card hover-glow" href={`/albums/${album.slug}`} key={album.id}>
              <div className="album-cover">
                <div className="album-cover-image" style={{ backgroundImage: `url(${album.cover || fallbackImage})` }} />
              </div>
              <h2>{album.name}</h2>
            </AppLink>
          ))}
        </section>
      </main>
    </>
  );
}

function ImageViewer({ photo, onClose, onPrevious, onNext, album }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  return (
    <div className="photo-viewer" role="dialog" aria-modal="true" aria-label={photo.title} onClick={onClose}>
      <div className="viewer-blur" style={{ backgroundImage: `url(${photo.src})` }} />
      <div className="viewer-scrim" />
      <button className="viewer-close" aria-label="关闭" onClick={onClose}><X /></button>
      {onPrevious && <button className="viewer-arrow left" aria-label="上一张" onClick={(event) => { event.stopPropagation(); onPrevious(); }}><ChevronLeft /></button>}
      <figure onClick={(event) => event.stopPropagation()}>
        <img src={photo.src} alt={photo.title} />
        <figcaption>
          {album && <span>{album}</span>}
          <h2>{photo.title}</h2>
          {photo.description && <p>{photo.description}</p>}
          <small>{photo.date}</small>
        </figcaption>
      </figure>
      {onNext && <button className="viewer-arrow right" aria-label="下一张" onClick={(event) => { event.stopPropagation(); onNext(); }}><ChevronRight /></button>}
    </div>
  );
}

export function AlbumPage({ album }) {
  const [current, setCurrent] = useState(null);
  useEffect(() => setCurrent(null), [album?.id]);

  if (!album) return null;
  const activeIndex = current === null ? -1 : current;
  const active = album.photos[activeIndex];
  const next = (step) => setCurrent((activeIndex + step + album.photos.length) % album.photos.length);

  return (
    <>
      <main className="album-page">
        <AppLink href="/albums" className="back-link"><ArrowLeft />返回</AppLink>
        <section className="album-page-heading"><h1>{album.name}</h1></section>
        <section className="album-photo-grid">
          {album.photos.map((photo, index) => (
            <GlowCard key={photo.id} onClick={() => setCurrent(index)}>
              <img src={photo.src} alt={photo.title} />
            </GlowCard>
          ))}
        </section>
      </main>
      {active && (
        <ImageViewer
          photo={active}
          album={album.name}
          onClose={() => setCurrent(null)}
          onPrevious={album.photos.length > 1 ? () => next(-1) : null}
          onNext={album.photos.length > 1 ? () => next(1) : null}
        />
      )}
    </>
  );
}

export function GalleryPage({ albums, site }) {
  const [selected, setSelected] = useState(null);
  const photos = albums.flatMap((album) => album.photos.map((photo) => ({ ...photo, album: album.name })));
  const selectedIndex = photos.findIndex((photo) => photo.id === selected?.id);
  const step = (direction) => setSelected(photos[(selectedIndex + direction + photos.length) % photos.length]);

  return (
    <>
      <PageHeading title="画廊" subtitle={site?.pageSubtitles?.gallery} />
      <main className="gallery-page">
        <section className="gallery-mosaic">
          {photos.map((photo, index) => (
            <GlowCard className={`gallery-item hover-glow tile-${index % 10}`} key={photo.id} onClick={() => setSelected(photo)}>
              <img src={photo.src} alt={photo.title} loading="lazy" />
            </GlowCard>
          ))}
        </section>
      </main>
      {selected && (
        <ImageViewer
          photo={selected}
          album={selected.album}
          onClose={() => setSelected(null)}
          onPrevious={photos.length > 1 ? () => step(-1) : null}
          onNext={photos.length > 1 ? () => step(1) : null}
        />
      )}
    </>
  );
}
