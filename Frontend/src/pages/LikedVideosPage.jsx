import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import LoadingState from "../components/LoadingState";
import VideoCard from "../components/VideoCard";

export default function LikedVideosPage() {
  const [videos, setVideos] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api.get("/users/liked-videos?limit=50").then((data) => setVideos(data?.videos || [])).catch((err) => setError(err.message)); }, []);
  if (error) return <div className="page-state error-text">{error}</div>;
  if (!videos) return <LoadingState label="Loading liked videos" />;
  return <div className="library-page"><div className="section-heading"><div><p className="eyebrow">Personal library</p><h1>Liked videos</h1></div><Link className="button button-quiet" to="/dashboard">Back to dashboard</Link></div>{videos.length ? <div className="video-grid">{videos.map((video) => <VideoCard video={video} key={video._id} />)}</div> : <div className="empty-state"><span>♡</span><h3>Nothing liked yet</h3><p>Like a video to save it here.</p></div>}</div>;
}
