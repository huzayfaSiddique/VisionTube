import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ui/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import WatchPage from "./pages/WatchPage";
import ChannelPage from "./pages/ChannelPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/watch/:videoId" element={<WatchPage />} />
          <Route path="/c/:username" element={<ChannelPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
