import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import VideoCard from "../components/VideoCard";
import LoadingState from "../components/LoadingState";
import { api } from "../lib/api";

const categories = ["For you", "Latest", "Design", "Technology", "Education"];

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.toLowerCase() || "";
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState(categories[0]);

  useEffect(() => {
    setLoading(true);
    api.get("/videos?page=1&limit=24")
      .then(setVideos)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const visibleVideos = useMemo(() => query
    ? videos.filter((video) => `${video.title} ${video.description} ${video.owner?.fullName}`.toLowerCase().includes(query))
    : videos, [query, videos]);

  return <>
    <section className="hero panel">
      <div><p className="eyebrow">A calmer way to watch</p><h1>Ideas worth your attention.</h1><p className="hero-copy">Discover work, stories, and useful perspectives from creators who care about the details.</p></div>
      <div className="hero-orbit"><span>✦</span><span>↗</span><span>•</span></div>
    </section>
    <nav className="category-bar" aria-label="Video categories">{categories.map((item) => <button className={item === category ? "active" : ""} key={item} onClick={() => setCategory(item)}>{item}</button>)}</nav>
    <section className="section-heading"><div><p className="eyebrow">{query ? `Results for “${query}”` : "Your daily mix"}</p><h2>{category === "For you" ? "Fresh from the community" : `${category} picks`}</h2></div><span className="muted">{visibleVideos.length} videos</span></section>
    {loading ? <LoadingState label="Finding something good" /> : error ? <div className="page-state error-text">{error}</div> : visibleVideos.length ? <div className="video-grid">{visibleVideos.map((video, index) => <VideoCard key={video._id} video={video} featured={index === 0} />)}</div> : <div className="empty-state"><span>◌</span><h3>No videos found</h3><p>Try another search or check back soon.</p></div>}
  </>;
}
