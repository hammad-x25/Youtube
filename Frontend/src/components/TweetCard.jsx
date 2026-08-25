import { useState } from "react";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";

export default function TweetCard({ tweet, currentUserId, onChange, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(tweet.content);
  const [error, setError] = useState("");
  const [likePending, setLikePending] = useState(false);
  const isOwner = String(tweet.owner?._id || tweet.owner) === String(currentUserId);

  async function like() {
    if (likePending) return;
    setLikePending(true);
    try {
      const data = await api.post(`/likes/tweet/${tweet._id}`);
      onChange({ ...tweet, isLiked: data.liked, likesCount: data.likeCount ?? tweet.likesCount });
    } catch (err) { setError(err.message); } finally { setLikePending(false); }
  }

  async function save() {
    try {
      const updated = await api.patch(`/tweets/${tweet._id}`, { content });
      onChange({ ...tweet, ...updated });
      setEditing(false);
    } catch (err) { setError(err.message); }
  }

  async function remove() {
    try { await api.delete(`/tweets/${tweet._id}`); onDelete(tweet._id); } catch (err) { setError(err.message); }
  }

  return <article className="tweet-card panel">
    <div className="tweet-top"><div className="channel-avatar">{tweet.owner?.avatar ? <img src={tweet.owner.avatar} alt="" /> : (tweet.owner?.username || "U")[0].toUpperCase()}</div><div><strong>{tweet.owner?.fullName || tweet.owner?.username || "Creator"}</strong><span className="tweet-date">@{tweet.owner?.username} · {formatDate(tweet.createdAt)}</span></div>{isOwner && <div className="tweet-menu"><button className="text-button" onClick={() => setEditing((value) => !value)}>Edit</button><button className="text-button danger" onClick={remove}>Delete</button></div>}</div>
    {editing ? <div className="tweet-edit"><textarea value={content} onChange={(event) => setContent(event.target.value)} rows="3" maxLength="500" /><button className="button button-primary" onClick={save}>Save</button></div> : <p className="tweet-content">{tweet.content}</p>}
    <button disabled={likePending} className={`tweet-like ${tweet.isLiked ? "active" : ""}`} onClick={like} type="button"><span aria-hidden="true">&#9825;</span> {tweet.likesCount || 0}</button>
    {error && <p className="error-text">{error}</p>}
  </article>;
}
