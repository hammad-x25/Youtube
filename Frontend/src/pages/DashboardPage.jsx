import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatViews } from "../lib/format";
import LoadingState from "../components/LoadingState";
import VideoCard from "../components/VideoCard";
import TweetCard from "../components/TweetCard";

function Metric({ label, value, detail }) {
  return <div className="metric panel"><span className="eyebrow">{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}

function CreatorVideoRow({ video, onChange, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description);
  const [error, setError] = useState("");

  async function save() {
    try {
      const updated = await api.patch(`/videos/${video._id}`, { title, description });
      onChange({ ...video, ...updated });
      setEditing(false);
    } catch (err) { setError(err.message); }
  }

  async function publish() {
    try { onChange({ ...video, ...(await api.patch(`/videos/${video._id}/publish`)) }); } catch (err) { setError(err.message); }
  }

  async function remove() {
    try { await api.delete(`/videos/${video._id}`); onDelete(video._id); } catch (err) { setError(err.message); }
  }

  return <article className="creator-video panel"><img src={video.Thumbnail} alt="" /><div className="creator-video-copy">{editing ? <div className="video-edit-fields"><input value={title} onChange={(event) => setTitle(event.target.value)} /><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows="2" /><button className="button button-primary" onClick={save}>Save</button></div> : <><Link to={`/watch/${video._id}`}><h3>{video.title}</h3></Link><span className="muted">{video.isPublished ? "Published" : "Draft"} · {formatDate(video.createdAt)}</span><p>{formatViews(video.views)} views · {video.likeCount} likes · {video.commentsCount} comments</p></>}<div className="creator-actions"><button className="text-button" onClick={() => setEditing((value) => !value)}>{editing ? "Cancel" : "Edit"}</button><button className="text-button" onClick={publish}>{video.isPublished ? "Unpublish" : "Publish"}</button><button className="text-button danger" onClick={remove}>Delete</button></div>{error && <small className="error-text">{error}</small>}</div></article>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [history, setHistory] = useState([]);
  const [likedVideos, setLikedVideos] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [tweetContent, setTweetContent] = useState("");
  const [feedTweets, setFeedTweets] = useState([]);
  const [showFeed, setShowFeed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [overview, watchHistory, liked, userTweets] = await Promise.all([
        api.get("/dashboard"),
        api.get("/users/getwatchhistory"),
        api.get("/users/liked-videos?limit=8"),
        api.get(`/tweets/user/${user._id}?limit=20`),
      ]);
      setDashboard(overview);
      setHistory(watchHistory || []);
      setLikedVideos(liked?.videos || []);
      setTweets(userTweets?.tweets || []);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, [user?._id]);

  useEffect(() => { load(); }, [load]);

  async function createTweet(event) {
    event.preventDefault();
    if (!tweetContent.trim()) return;
    try {
      const tweet = await api.post("/tweets", { content: tweetContent });
      setTweets((current) => [tweet, ...current]);
      setTweetContent("");
    } catch (err) { setError(err.message); }
  }

  async function loadFeed() {
    setShowFeed(true);
    try { const result = await api.get("/tweets/feed?limit=20"); setFeedTweets(result?.tweets || []); } catch (err) { setError(err.message); }
  }

  if (loading) return <LoadingState label="Preparing your dashboard" />;
  if (error && !dashboard) return <div className="page-state error-text">{error}</div>;
  const summary = dashboard?.summary || {};
  const videos = dashboard?.videos || [];

  return <div className="dashboard-page">
    <div className="section-heading dashboard-heading"><div><p className="eyebrow">Your command center</p><h1>Good to see you, {user.fullName?.split(" ")[0] || user.username}.</h1><p className="muted">A clear view of what you publish, watch, and contribute.</p></div><Link className="button button-primary" to="/upload">+ Publish video</Link></div>
    {error && <p className="error-text">{error}</p>}
    <div className="metrics-grid"><Metric label="Total views" value={formatViews(summary.totalViews)} detail="Across your videos" /><Metric label="Subscribers" value={formatViews(summary.subscriberCount)} detail="People following you" /><Metric label="Published" value={summary.publishedVideos || 0} detail={`${summary.totalVideos || 0} total videos`} /><Metric label="Video likes" value={formatViews(summary.totalLikes)} detail="Positive signals" /></div>
    <div className="dashboard-columns"><section><div className="section-heading compact"><div><p className="eyebrow">Creator studio</p><h2>Your videos</h2></div><span className="muted">{videos.length} total</span></div>{videos.length ? <div className="creator-video-list">{videos.slice(0, 6).map((video) => <CreatorVideoRow key={video._id} video={video} onChange={(next) => setDashboard((current) => ({ ...current, videos: current.videos.map((item) => item._id === next._id ? next : item) }))} onDelete={(id) => setDashboard((current) => ({ ...current, videos: current.videos.filter((item) => item._id !== id) }))} />)}</div> : <div className="empty-state small"><span>✦</span><p>Publish your first video to start tracking performance.</p></div>}</section><section><div className="section-heading compact"><div><p className="eyebrow">Audience</p><h2>Subscribers</h2></div><span className="muted">{summary.subscriberCount || 0}</span></div><div className="people-list panel">{dashboard?.subscribers?.length ? dashboard.subscribers.map((item) => <Link className="person-row" to={`/channel/${item.subscriber?.username}`} key={item._id}><div className="channel-avatar">{item.subscriber?.avatar ? <img src={item.subscriber.avatar} alt="" /> : item.subscriber?.username?.[0]?.toUpperCase()}</div><span><strong>{item.subscriber?.fullName}</strong><small>@{item.subscriber?.username}</small></span></Link>) : <p className="muted">No subscribers yet. Keep publishing.</p>}</div></section></div>
    <div className="dashboard-columns"><section><div className="section-heading compact"><div><p className="eyebrow">Personal library</p><h2>Watch history</h2></div><Link className="text-button" to="/history">See all</Link></div><div className="mini-video-grid">{history.slice(0, 4).map((video) => <VideoCard key={video._id} video={{ ...video, owner: video.owner || video.WatchedVideo_Creator }} />)}</div></section><section><div className="section-heading compact"><div><p className="eyebrow">Following</p><h2>Channels</h2></div><span className="muted">{summary.followingCount || 0}</span></div><div className="people-list panel">{dashboard?.channels?.length ? dashboard.channels.map((item) => <Link className="person-row" to={`/channel/${item.channel?.username}`} key={item._id}><div className="channel-avatar">{item.channel?.avatar ? <img src={item.channel.avatar} alt="" /> : item.channel?.username?.[0]?.toUpperCase()}</div><span><strong>{item.channel?.fullName}</strong><small>@{item.channel?.username}</small></span></Link>) : <p className="muted">Follow creators from a video page.</p>}</div></section></div>
    <section className="dashboard-section"><div className="section-heading compact"><div><p className="eyebrow">Your voice</p><h2>Tweets</h2></div><div className="heading-actions"><button className="button button-quiet" onClick={loadFeed}>Following feed</button><Link className="text-button" to="/tweets">Open social space</Link></div></div><form className="tweet-composer panel" onSubmit={createTweet}><div className="channel-avatar">{user.username?.[0]?.toUpperCase()}</div><textarea value={tweetContent} onChange={(event) => setTweetContent(event.target.value)} placeholder="Share a thought with your community" rows="2" maxLength="500" /><button className="button button-primary">Post</button></form>{showFeed && feedTweets.length > 0 && <div className="tweet-grid">{feedTweets.slice(0, 3).map((tweet) => <TweetCard key={tweet._id} tweet={tweet} currentUserId={user._id} onChange={(next) => setFeedTweets((current) => current.map((item) => item._id === next._id ? next : item))} onDelete={(id) => setFeedTweets((current) => current.filter((item) => item._id !== id))} />)}</div>}<div className="tweet-grid">{tweets.slice(0, 3).map((tweet) => <TweetCard key={tweet._id} tweet={tweet} currentUserId={user._id} onChange={(next) => setTweets((current) => current.map((item) => item._id === next._id ? next : item))} onDelete={(id) => setTweets((current) => current.filter((item) => item._id !== id))} />)}</div></section>
    <div className="dashboard-columns"><section><div className="section-heading compact"><div><p className="eyebrow">Saved for later</p><h2>Liked videos</h2></div><Link className="text-button" to="/liked">See all</Link></div><div className="mini-video-grid">{likedVideos.slice(0, 4).map((video) => <VideoCard key={video._id} video={video} />)}</div></section><section><div className="section-heading compact"><div><p className="eyebrow">Collections</p><h2>Playlists</h2></div><Link className="text-button" to="/playlists">Manage</Link></div><div className="playlist-list panel">{dashboard?.playlists?.length ? dashboard.playlists.slice(0, 4).map((playlist) => <Link className="playlist-row" key={playlist._id} to={`/playlists/${playlist._id}`}><span className="playlist-icon">▤</span><span><strong>{playlist.name}</strong><small>{playlist.videoCount} videos</small></span></Link>) : <p className="muted">Create a playlist to organize your watching.</p>}</div></section></div>
  </div>;
}
