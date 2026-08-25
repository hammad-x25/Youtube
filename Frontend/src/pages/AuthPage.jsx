import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", username: "", password: "", fullName: "" });
  const [avatar, setAvatar] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);
  if (isAuthenticated) return null;

  function change(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      if (mode === "login") { await login({ email: form.email || undefined, username: form.username || undefined, password: form.password }); }
      else {
        if (!avatar) throw new Error("Please choose a profile image");
        const body = new FormData(); Object.entries(form).forEach(([key, value]) => body.append(key, value)); body.append("avatar", avatar); if (coverImage) body.append("coverImage", coverImage);
        await apiRequest("/users/register", { method: "POST", body });
        await login({ email: form.email, password: form.password });
      }
      navigate("/");
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return <div className="auth-layout"><div className="auth-intro"><p className="eyebrow">Welcome to frame</p><h1>Make space for better ideas.</h1><p>Sign in to keep your watch history, follow creators, and leave something useful behind.</p></div><form className="auth-card panel" onSubmit={submit}><div className="auth-tabs"><button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Sign in</button><button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Create account</button></div>{mode === "register" && <><label>Full name<input name="fullName" value={form.fullName} onChange={change} required /></label><label>Username<input name="username" value={form.username} onChange={change} required /></label></>}{mode === "login" && <label>Username or email<input name={form.email ? "email" : "username"} value={form.email || form.username} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value, username: event.target.value }))} required /></label>}{mode === "register" && <label>Email<input type="email" name="email" value={form.email} onChange={change} required /></label>}<label>Password<input type="password" name="password" value={form.password} onChange={change} minLength="8" required /></label>{mode === "register" && <><label>Profile image<input type="file" accept="image/*" onChange={(event) => setAvatar(event.target.files?.[0])} required /></label><label>Cover image <span className="muted">(optional)</span><input type="file" accept="image/*" onChange={(event) => setCoverImage(event.target.files?.[0])} /></label></>}{error && <p className="error-text">{error}</p>}<button className="button button-primary button-wide" disabled={busy}>{busy ? "Working…" : mode === "login" ? "Continue" : "Create account"}</button></form></div>;
}
