import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  function search(event) {
    event.preventDefault();
    navigate(query.trim() ? `/?q=${encodeURIComponent(query.trim())}` : "/");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="Frame home">
          <span className="brand-mark">▶</span><span>frame</span>
        </Link>
        <form className="search" onSubmit={search}>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search videos" aria-label="Search videos" />
          <button type="submit" aria-label="Search">⌕</button>
        </form>
        <nav className="top-actions">
          {isAuthenticated ? (
            <>
              <Link className="button button-quiet dashboard-link" to="/dashboard">Dashboard</Link>
              <Link className="button button-quiet dashboard-link" to="/subscriptions">Network</Link>
              <Link className="button button-quiet dashboard-link" to="/settings">Settings</Link>
              <Link className="button button-quiet" to="/upload">+ Create</Link>
              <button className="avatar-button" onClick={() => navigate(`/channel/${user.username}`)} title="Your channel">
                {user.avatar ? <img src={user.avatar} alt="" /> : user.username?.[0]?.toUpperCase()}
              </button>
              <button className="icon-button" onClick={() => logout().catch(() => {})} title="Sign out">↪</button>
            </>
          ) : <Link className="button button-primary" to="/auth">Sign in</Link>}
        </nav>
      </header>
      <main className="content"><Outlet /></main>
    </div>
  );
}
