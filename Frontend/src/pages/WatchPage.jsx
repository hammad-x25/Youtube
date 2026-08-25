import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, apiRequest } from "../lib/api";
import { formatDate, formatViews } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import CommentSection from "../components/CommentSection";
import LoadingState from "../components/LoadingState";

export default function WatchPage() {
  const { videoId } = useParams();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [error, setError] = useState("");
  const [liked, setLiked] = useState(false);
  const [likePending, setLikePending] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [actionError, setActionError] = useState("");
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState("");
  const [playlistMessage, setPlaylistMessage] = useState("");
  const viewKeys = useRef(new Map());
  const recordedViews = useRef(new Set());

  useEffect(() => {
    if (authLoading) return;
    const request = isAuthenticated ? api.get(`/videos/${videoId}/watch`) : api.get(`/videos/${videoId}`);
    request.then((data) => { setVideo(data); setLiked(Boolean(data.liked)); setSubscribed(Boolean(data.subscribed)); })
      .then(() => {
        if (!recordedViews.current.has(videoId)) {
          const viewKey = viewKeys.current.get(videoId) || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
          viewKeys.current.set(videoId, viewKey);
          recordedViews.current.add(videoId);
          apiRequest(`/videos/${videoId}/view`, {
            method: "POST",
            headers: { "X-View-Key": viewKey },
          }).catch(() => {});
        }
        return isAuthenticated ? api.post(`/videos/${videoId}/watch-history`).catch(() => {}) : null;
      })
      .catch((err) => setError(err.message));
  }, [authLoading, isAuthenticated, videoId]);

  useEffect(() => {
    if (isAuthenticated) api.get("/playlists?limit=50").then((data) => setPlaylists(data?.playlists || [])).catch(() => {});
  }, [isAuthenticated]);

  async function toggleLike() {
    if (!isAuthenticated) return navigate("/auth");
    if (likePending) return;
    setLikePending(true);
    try { const data = await api.post(`/likes/video/${videoId}`); setLiked(data.liked); setVideo((current) => ({ ...current, likeCount: data.likeCount ?? current.likeCount })); } catch (err) { setActionError(err.message); } finally { setLikePending(false); }
  }

  async function toggleSubscription() {
    if (!isAuthenticated) return navigate("/auth");
    try { if (subscribed) { await api.delete(`/subscriptions/${video.owner._id}`); } else { await api.post(`/subscriptions/${video.owner._id}`); } setSubscribed((current) => !current); } catch (err) { setActionError(err.message); }
  }

  async function saveToPlaylist() {
    if (!selectedPlaylist) return;
    try {
      await api.post(`/playlists/${selectedPlaylist}/videos/${videoId}`);
      setPlaylistMessage("Saved to playlist");
    } catch (err) { setPlaylistMessage(err.message); }
  }

  if (error) return <div className="page-state error-text">{error}</div>;
  if (!video) return <LoadingState label="Loading video" />;

  return <div className="watch-layout">
    <div className="watch-main">
      <div className="player"><video controls autoPlay playsInline poster={video.Thumbnail} src={video.VideoFile}>Your browser does not support video playback.</video></div>
      <div className="watch-heading"><p className="eyebrow">Now watching</p><h1>{video.title}</h1><div className="watch-meta"><span>{formatViews(video.views)} views</span><span>·</span><span>{formatDate(video.createdAt)}</span><span className="watch-actions"><button disabled={likePending} className={`button ${liked ? "button-primary" : "button-quiet"}`} onClick={toggleLike}>♡ {video.likeCount || 0}</button><button className={`button ${subscribed ? "button-primary" : "button-quiet"}`} onClick={toggleSubscription}>{subscribed ? "Subscribed" : "Subscribe"}</button></span></div></div>
      {actionError && <p className="error-text">{actionError}</p>}
      {isAuthenticated && <div className="save-row"><select value={selectedPlaylist} onChange={(event) => setSelectedPlaylist(event.target.value)}><option value="">Save to playlist...</option>{playlists.map((playlist) => <option key={playlist._id} value={playlist._id}>{playlist.name}</option>)}</select><button className="button button-quiet" onClick={saveToPlaylist} disabled={!selectedPlaylist}>Save</button>{playlistMessage && <span className="muted">{playlistMessage}</span>}</div>}
      <div className="creator-row panel"><div className="channel-avatar large">{video.owner?.avatar ? <img src={video.owner.avatar} alt="" /> : video.owner?.username?.[0]?.toUpperCase()}</div><div className="creator-copy"><Link to={`/channel/${video.owner?.username}`}><strong>{video.owner?.fullName || video.owner?.username}</strong></Link><span>{formatViews(video.subscribersCount)} subscribers</span></div><button className="button button-quiet" onClick={toggleSubscription}>{subscribed ? "Following" : "Follow creator"}</button></div>
      <div className="description panel"><p>{video.description}</p></div>
      <CommentSection videoId={videoId} />
    </div>
    <aside className="watch-aside panel"><p className="eyebrow">Up next</p><h3>Keep exploring</h3><p className="muted">Return to the home feed for more ideas from the community.</p><Link className="button button-primary" to="/">Browse videos</Link></aside>
  </div>;
}
