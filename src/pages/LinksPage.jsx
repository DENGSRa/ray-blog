import { useState } from 'react';
import { Check, ExternalLink, MessageCircle, Send } from 'lucide-react';
import { PageHeading } from '../components/Layout';
import { ProfileCard } from './HomePage';

export function LinksPage({ site }) {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const links = site?.friends || [];
  const mbti = site?.mbti || {};

  return (
    <>
      <PageHeading title="关于" subtitle={site?.pageSubtitles?.links} />
      <main className="links-page">
        <section className="about-grid">
          <ProfileCard site={site} />
          <a className="personality" href={mbti.url || '#'} target="_blank" rel="noreferrer">
            <strong>{mbti.type}</strong><b>{mbti.name}</b><small>{mbti.english}</small>
            <p>{mbti.description}</p>
            <div>{mbti.tags?.map((tag) => <span key={tag}>{tag}</span>)}</div>
            <ExternalLink />
          </a>
        </section>
        <section className="friends">
          <div className="friends-title"><h2>友情链接</h2><span>山高水长，幸有同行</span></div>
          <div className="friend-grid">
            {links.map((friend) => (
              <a href={friend.url || '#'} target="_blank" rel="noreferrer" key={friend.title}>
                <div className="friend-avatar" style={friend.avatar ? { backgroundImage: `url(${friend.avatar})` } : {}}>{!friend.avatar && friend.title[0]}</div>
                <div><h3>{friend.title}</h3><p>{friend.description}</p></div>
                <ExternalLink />
              </a>
            ))}
          </div>
        </section>
        <section className="message-board">
          <div><MessageCircle /><h2>留言板</h2><p>说点什么吧，所有认真写下的话都会被珍惜。</p></div>
          <form onSubmit={(event) => { event.preventDefault(); if (message.trim()) { setSent(true); setMessage(''); } }}>
            <textarea value={message} onChange={(event) => { setMessage(event.target.value); setSent(false); }} placeholder="写下你想说的..." />
            <div className="form-row">
              <input placeholder="昵称" /><input type="email" placeholder="邮箱（选填）" />
              <button disabled={!message.trim()}>{sent ? <><Check />已发表</> : <><Send />发表</>}</button>
            </div>
            {sent && <p className="sent">已收到你的留言（此演示版不会发送到服务器）。</p>}
          </form>
        </section>
      </main>
    </>
  );
}
