import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

// Wraps every "inside the app" page (as opposed to /login, /register
// which intentionally have no navbar/sidebar). Used together with
// ProtectedRoute in App.jsx's route tree.
export default function MainLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Sidebar />
      <main className="pt-14 md:pl-56">
        <div className="p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
