import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const title = location.pathname.includes("/teams")
    ? "Teams"
    : location.pathname.includes("/projects/")
    ? "Project"
    : "Home";

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 hidden md:block">
        <div className="p-4 text-lg font-semibold">Dashboard</div>
        <nav className="px-2 space-y-1">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `block px-3 py-2 rounded hover:bg-gray-100 ${
                isActive ? "bg-gray-100 font-medium" : "text-gray-700"
              }`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/dashboard/teams"
            className={({ isActive }) =>
              `block px-3 py-2 rounded hover:bg-gray-100 ${
                isActive ? "bg-gray-100 font-medium" : "text-gray-700"
              }`
            }
          >
            Teams
          </NavLink>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-semibold">{title}</h1>
            <div className="flex items-center gap-3">
              <span className="text-gray-600">{user?.name}</span>
              <button
                onClick={logout}
                className="bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-600"
              >
                Вийти
              </button>
            </div>
          </div>
        </header>

        {/* Routed content */}
        <main className="flex-1">
          <div className="mx-auto max-w-5xl px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

