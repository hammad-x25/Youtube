import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import LoadingState from "../components/LoadingState";
import TweetCard from "../components/TweetCard";

export default function TweetsPage() {
  const { user } = useAuth();
  const [tweets, setTweets] = useState([]);
  const [feed, setFeed] = useState([]);
  const [content, setContent] = useState("");
  const [tab, setTab] = useState("mine");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { api.get(`/tweets/user/${user._id}?limit=50`).then((data) => setTweets(data?.tweets || [])).catch((err) => setError(err.message)).finally(() => setLoading(false)); }, [user._id]);
  useEffect(() => { if (tab === "feed") api.get("/tweets/feed?limit=50").then((data) => setFeed(data?.tweets || [])).catch((err) => setError(err.message)); }, [tab]);
  async function create(event) { event.preventDefault(); if (!content.trim()) return; try { const tweet = await api.post("/tweets", { content }); setTweets((current) => [tweet, ...current]); setContent(""); } catch (err) { setError(err.message); } }
  if (loading) return <LoadingState label="Loading social space" />;
  const list = tab === "mine" ? tweets : feed;
  return <div className="social-page"><div className="section-heading"><div><p className="eyebrow">Community</p><h1>Social space</h1><p className="muted">Post a thought, follow the conversation, and react to creators.</p></div></div><form className="tweet-composer panel" onSubmit={create}><div className="channel-avatar">{user.username?.[0]?.toUpperCase()}</div><textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="What is on your mind?" rows="3" maxLength="500" /><button className="button button-primary">Post</button></form><div className="tab-bar"><button className={tab === "mine" ? "active" : ""} onClick={() => setTab("mine")}>My posts</button><button className={tab === "feed" ? "active" : ""} onClick={() => setTab("feed")}>Following feed</button></div>{error && <p className="error-text">{error}</p>}<div className="tweet-grid">{list.length ? list.map((tweet) => <TweetCard key={tweet._id} tweet={tweet} currentUserId={user._id} onChange={(next) => (tab === "mine" ? setTweets : setFeed)((current) => current.map((item) => item._id === next._id ? next : item))} onDelete={(id) => (tab === "mine" ? setTweets : setFeed)((current) => current.filter((item) => item._id !== id))} />) : <div className="empty-state"><span>✦</span><h3>No posts here yet</h3><p>Start the conversation.</p></div>}</div></div>;
}
