import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatDate, formatViews } from "../lib/format";
import LoadingState from "../components/LoadingState";

export default function HistoryPage() {
  const [videos, setVideos] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api.get("/users/getwatchhistory").then(setVideos).catch((err) => setError(err.message)); }, []);
  if (error) return <div className="page-state error-text">{error}</div>;
  if (!videos) return <LoadingState label="Loading your history" />;
  return <div className="library-page"><div className="section-heading"><div><p className="eyebrow">Personal library</p><h1>Watch history</h1><p className="muted">Everything you have recently watched.</p></div><Link className="button button-quiet" to="/dashboard">Back to dashboard</Link></div>{videos.length ? <div className="library-list">{videos.map((video) => <Link className="library-item panel" to={`/watch/${video._id}`} key={video._id}><img src={video.Thumbnail} alt="" /><div><h3>{video.title}</h3><p>{video.owner?.fullName || video.WatchedVideo_Creator?.fullName || "Creator"}</p><span>{formatViews(video.views)} views · watched {formatDate(video.createdAt)}</span></div></Link>)}</div> : <div className="empty-state"><span>◌</span><h3>Your history is empty</h3><p>Watch a video and it will appear here.</p></div>}</div>;
}
