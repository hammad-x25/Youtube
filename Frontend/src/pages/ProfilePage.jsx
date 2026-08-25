import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import LoadingState from "../components/LoadingState";
import { formatViews } from "../lib/format";

export default function ProfilePage() {
  const { username } = useParams();
  const [channel, setChannel] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api.get(`/users/getaccountdetails/${username}`).then(setChannel).catch((err) => setError(err.message)); }, [username]);
  if (error) return <div className="page-state error-text">{error}</div>;
  if (!channel) return <LoadingState label="Loading channel" />;
  return <div className="profile-page"><div className="cover" style={{ backgroundImage: channel.coverImage ? `url(${channel.coverImage})` : undefined }} /><section className="profile-head panel"><div className="profile-avatar">{channel.avatar ? <img src={channel.avatar} alt="" /> : channel.username?.[0]?.toUpperCase()}</div><div><p className="eyebrow">Creator channel</p><h1>{channel.fullName}</h1><p className="muted">@{channel.username}</p></div><div className="profile-stats"><strong>{formatViews(channel.subscriberscount)}<small>subscribers</small></strong><strong>{formatViews(channel.subscribedchannelscount)}<small>following</small></strong></div></section><div className="section-heading"><div><p className="eyebrow">The channel</p><h2>Latest work</h2></div></div><div className="empty-state"><span>✦</span><h3>The channel is ready for its next story.</h3><p>Video shelves will appear here as this creator publishes.</p></div></div>;
}
