import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Wrap protected routes with this in the route tree, e.g.:
//   <Route element={<ProtectedRoute />}>
//     <Route path="/settings" element={<SettingsPage />} />
//   </Route>
export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Still checking whether a session cookie is valid — avoid a
    // flash-redirect to /login before we actually know.
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-400">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    // Remember where the user was headed so login can send them back.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
