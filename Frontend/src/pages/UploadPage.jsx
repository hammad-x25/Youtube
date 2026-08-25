import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function UploadPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", isPublished: "true" });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function change(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    try { const body = new FormData(); Object.entries(form).forEach(([key, value]) => body.append(key, value)); body.append("VideoFile", videoFile); body.append("Thumbnail", thumbnail); await api.post("/videos/upload", body); navigate("/"); } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <div className="form-layout"><div className="section-heading"><div><p className="eyebrow">Creator studio</p><h1>Share something worth watching.</h1><p className="muted">Upload a video and give it the context it deserves.</p></div><Link className="button button-quiet" to="/">Cancel</Link></div><form className="panel wide-form" onSubmit={submit}><div className="form-grid"><label>Title<input name="title" value={form.title} onChange={change} placeholder="A clear, memorable title" required maxLength="180" /></label><label>Visibility<select name="isPublished" value={form.isPublished} onChange={change}><option value="true">Public</option><option value="false">Private draft</option></select></label></div><label>Description<textarea name="description" value={form.description} onChange={change} placeholder="What should viewers know before they press play?" required rows="6" maxLength="5000" /></label><div className="upload-drop"><label><span className="upload-icon">↑</span><strong>{videoFile?.name || "Choose your video"}</strong><small>MP4, MOV or WebM · up to 1 GB</small><input type="file" accept="video/*" onChange={(event) => setVideoFile(event.target.files?.[0])} required /></label></div><label>Thumbnail<input type="file" accept="image/*" onChange={(event) => setThumbnail(event.target.files?.[0])} required /></label>{error && <p className="error-text">{error}</p>}<button className="button button-primary" disabled={busy || !videoFile || !thumbnail}>{busy ? "Uploading…" : "Publish video"}</button></form></div>;
}
