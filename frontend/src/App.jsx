import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ui/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPendingPage from "./pages/VerifyEmailPendingPage";
import EmailConfirmedPage from "./pages/EmailConfirmedPage";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import WatchPage from "./pages/WatchPage";
import ChannelPage from "./pages/ChannelPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import UploadPage from "./pages/UploadPage";
import StudioPage from "./pages/StudioPage";
import PlaylistsPage from "./pages/PlaylistsPage";
import PlaylistDetailPage from "./pages/PlaylistDetailPage";
import LikedVideosPage from "./pages/LikedVideosPage";
import HistoryPage from "./pages/HistoryPage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPendingPage />} />
      <Route path="/confirm-email-success" element={<EmailConfirmedPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/watch/:videoId" element={<WatchPage />} />
          <Route path="/c/:username" element={<ChannelPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/studio" element={<StudioPage />} />
          <Route path="/playlists" element={<PlaylistsPage />} />
          <Route path="/playlist/:playlistId" element={<PlaylistDetailPage />} />
          <Route path="/liked-videos" element={<LikedVideosPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
