import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import WatchPage from "./pages/WatchPage";
import AuthPage from "./pages/AuthPage";
import UploadPage from "./pages/UploadPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";
import DashboardPage from "./pages/DashboardPage";
import HistoryPage from "./pages/HistoryPage";
import LikedVideosPage from "./pages/LikedVideosPage";
import TweetsPage from "./pages/TweetsPage";
import { PlaylistsPage, PlaylistDetailPage } from "./pages/PlaylistsPage";
import SettingsPage from "./pages/SettingsPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import { useAuth } from "./context/AuthContext";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="page-state">Checking your session…</div>;
  return isAuthenticated ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="watch/:videoId" element={<WatchPage />} />
        <Route path="channel/:username" element={<ProfilePage />} />
        <Route path="auth" element={<AuthPage />} />
        <Route path="upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
        <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="liked" element={<ProtectedRoute><LikedVideosPage /></ProtectedRoute>} />
        <Route path="tweets" element={<ProtectedRoute><TweetsPage /></ProtectedRoute>} />
        <Route path="playlists" element={<ProtectedRoute><PlaylistsPage /></ProtectedRoute>} />
        <Route path="playlists/:playlistId" element={<ProtectedRoute><PlaylistDetailPage /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="subscriptions" element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
