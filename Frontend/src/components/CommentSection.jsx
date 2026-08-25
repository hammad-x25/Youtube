import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";
import { useAuth } from "../context/AuthContext";

export default function CommentSection({ videoId }) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState("");
  const [editContent, setEditContent] = useState("");
  const [likingId, setLikingId] = useState("");

  useEffect(() => {
    api.get("/videos/" + videoId + "/comments?limit=30")
      .then((data) => setComments(data?.comments || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [videoId]);

  async function addComment(event) {
    event.preventDefault();
    if (!content.trim()) return;
    setError("");
    try {
      const created = await api.post("/comments/" + videoId, { content });
      setComments((current) => [created, ...current]);
      setContent("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleLike(commentId) {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    if (likingId === commentId) return;

    setLikingId(commentId);
    try {
      const data = await api.post("/likes/comment/" + commentId);
      setComments((current) => current.map((comment) => comment._id === commentId
        ? {
          ...comment,
          liked: data.liked,
          likeCount: data.likeCount ?? comment.likeCount,
        }
        : comment));
    } catch (err) {
      setError(err.message);
    } finally {
      setLikingId("");
    }
  }

  async function saveEdit(commentId) {
    try {
      const updated = await api.patch("/comments/" + commentId, { content: editContent });
      setComments((current) => current.map((comment) => comment._id === commentId ? { ...comment, ...updated } : comment));
      setEditingId("");
    } catch (err) { setError(err.message); }
  }

  async function removeComment(commentId) {
    try {
      await api.delete("/comments/" + commentId);
      setComments((current) => current.filter((comment) => comment._id !== commentId));
    } catch (err) { setError(err.message); }
  }

  return <section className="comments panel">
    <div className="section-heading"><div><p className="eyebrow">Community</p><h2>{comments.length} comments</h2></div></div>
    {isAuthenticated ? <form className="comment-form" onSubmit={addComment}>
      <div className="channel-avatar">{user?.username?.[0]?.toUpperCase()}</div>
      <input value={content} onChange={(event) => setContent(event.target.value)} placeholder="Add a thoughtful comment" maxLength={1000} />
      <button className="button button-primary" type="submit">Post</button>
    </form> : <p className="muted">Sign in to join the conversation.</p>}
    {error && <p className="error-text">{error}</p>}
    {loading ? <p className="muted">Loading comments...</p> : <div className="comment-list">
      {comments.length ? comments.map((comment) => <article className="comment" key={comment._id}>
        <div className="channel-avatar">{comment.owner?.avatar ? <img src={comment.owner.avatar} alt="" /> : comment.owner?.username?.[0]?.toUpperCase()}</div>
        <div className="comment-content">
          <strong>{comment.owner?.fullName || comment.owner?.username}</strong>
          <span className="comment-date">{formatDate(comment.createdAt)}</span>
          {editingId === comment._id ? <div className="comment-edit"><textarea value={editContent} onChange={(event) => setEditContent(event.target.value)} rows="2" /><button type="button" className="text-button" onClick={() => saveEdit(comment._id)}>Save</button><button type="button" className="text-button" onClick={() => setEditingId("")}>Cancel</button></div> : <p>{comment.content}</p>}
          <button disabled={likingId === comment._id} type="button" className={"comment-like " + (comment.liked ? "active" : "")} onClick={() => toggleLike(comment._id)} aria-label={comment.liked ? "Unlike comment" : "Like comment"}><span aria-hidden="true">&#9825;</span> <span>{comment.likeCount || 0}</span></button>
          {String(comment.owner?._id) === String(user?._id) && <span className="comment-owner-actions"><button type="button" className="text-button" onClick={() => { setEditingId(comment._id); setEditContent(comment.content); }}>Edit</button><button type="button" className="text-button danger" onClick={() => removeComment(comment._id)}>Delete</button></span>}
        </div>
      </article>) : <p className="muted">No comments yet. Start the conversation.</p>}
    </div>}
  </section>;
}
