import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import LoadingState from "../components/LoadingState";
import VideoCard from "../components/VideoCard";

export function PlaylistsPage() {
  const [playlists, setPlaylists] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");
  useEffect(() => { api.get("/playlists?limit=50").then((data) => setPlaylists(data?.playlists || [])).catch((err) => setError(err.message)); }, []);
  async function create(event) { event.preventDefault(); try { const playlist = await api.post("/playlists", form); setPlaylists((current) => [playlist, ...current]); setForm({ name: "", description: "" }); } catch (err) { setError(err.message); } }
  async function remove(id) { try { await api.delete(`/playlists/${id}`); setPlaylists((current) => current.filter((playlist) => playlist._id !== id)); } catch (err) { setError(err.message); } }
  if (!playlists) return <LoadingState label="Loading playlists" />;
  return <div className="library-page"><div className="section-heading"><div><p className="eyebrow">Personal library</p><h1>Playlists</h1><p className="muted">Curate videos into collections you can return to.</p></div></div><form className="playlist-create panel" onSubmit={create}><input placeholder="Playlist name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /><input placeholder="Short description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required /><button className="button button-primary">Create playlist</button></form>{error && <p className="error-text">{error}</p>}<div className="playlist-cards">{playlists.length ? playlists.map((playlist) => <article className="playlist-card panel" key={playlist._id}><div className="playlist-icon large">▤</div><div><h3>{playlist.name}</h3><p>{playlist.description}</p><span className="muted">{playlist.videoCount || 0} videos</span></div><div className="playlist-actions"><Link className="button button-quiet" to={`/playlists/${playlist._id}`}>Open</Link><button className="text-button danger" onClick={() => remove(playlist._id)}>Delete</button></div></article>) : <div className="empty-state"><span>▤</span><h3>No playlists yet</h3></div>}</div></div>;
}

export function PlaylistDetailPage() {
  const { playlistId } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api.get(`/playlists/${playlistId}`).then(setPlaylist).catch((err) => setError(err.message)); }, [playlistId]);
  async function removeVideo(videoId) { try { const updated = await api.delete(`/playlists/${playlistId}/videos/${videoId}`); setPlaylist(updated); } catch (err) { setError(err.message); } }
  if (error) return <div className="page-state error-text">{error}</div>;
  if (!playlist) return <LoadingState label="Loading playlist" />;
  return <div className="library-page"><div className="section-heading"><div><p className="eyebrow">Collection</p><h1>{playlist.name}</h1><p className="muted">{playlist.description}</p></div><Link className="button button-quiet" to="/playlists">All playlists</Link></div><div className="video-grid">{playlist.Videos?.map((video) => <div className="playlist-video" key={video._id}><VideoCard video={video} /><button className="text-button danger" onClick={() => removeVideo(video._id)}>Remove from playlist</button></div>)}</div>{!playlist.Videos?.length && <div className="empty-state"><span>▤</span><h3>This playlist is empty</h3><p>Use Save to playlist on any watch page.</p></div>}</div>;
}
