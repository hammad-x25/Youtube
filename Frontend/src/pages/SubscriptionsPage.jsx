import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import LoadingState from "../components/LoadingState";

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [channels, setChannels] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { Promise.all([api.get("/subscriptions/subscribed?limit=50"), api.get(`/subscriptions/${user._id}/subscribers?limit=50`)]).then(([following, audience]) => { setChannels(following || []); setSubscribers(audience || []); }).catch((err) => setError(err.message)); }, [user._id]);
  async function unsubscribe(channelId) { try { await api.delete(`/subscriptions/${channelId}`); setChannels((current) => current.filter((item) => item.channel?._id !== channelId)); } catch (err) { setError(err.message); } }
  if (!channels) return <LoadingState label="Loading subscriptions" />;
  return <div className="subscriptions-page"><div className="section-heading"><div><p className="eyebrow">Your network</p><h1>Subscriptions</h1><p className="muted">Creators you follow and people following your channel.</p></div><Link className="button button-quiet" to="/dashboard">Back to dashboard</Link></div>{error && <p className="error-text">{error}</p>}<div className="dashboard-columns"><section><div className="section-heading compact"><div><p className="eyebrow">Following</p><h2>Subscribed channels</h2></div><span className="muted">{channels.length}</span></div><div className="people-list panel">{channels.length ? channels.map((item) => <div className="person-row" key={item.channel?._id}><div className="channel-avatar">{item.channel?.avatar ? <img src={item.channel.avatar} alt="" /> : item.channel?.username?.[0]?.toUpperCase()}</div><span><Link to={`/channel/${item.channel?.username}`}><strong>{item.channel?.fullName}</strong></Link><small>@{item.channel?.username}</small></span><button className="text-button danger" onClick={() => unsubscribe(item.channel?._id)}>Unsubscribe</button></div>) : <p className="muted">You are not following anyone yet.</p>}</div></section><section><div className="section-heading compact"><div><p className="eyebrow">Your audience</p><h2>Subscribers</h2></div><span className="muted">{subscribers.length}</span></div><div className="people-list panel">{subscribers.length ? subscribers.map((item) => <Link className="person-row" to={`/channel/${item.subscriber?.username}`} key={item.subscriber?._id}><div className="channel-avatar">{item.subscriber?.avatar ? <img src={item.subscriber.avatar} alt="" /> : item.subscriber?.username?.[0]?.toUpperCase()}</div><span><strong>{item.subscriber?.fullName}</strong><small>@{item.subscriber?.username}</small></span></Link>) : <p className="muted">Your audience will appear here.</p>}</div></section></div></div>;
}
