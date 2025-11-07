import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const title = location.pathname.startsWith("/dashboard/teams")
    ? "Teams"
    : location.pathname.startsWith("/dashboard/projects")
      ? "Project"
      : "Dashboard";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen">
      <aside className="w-52 bg-[#d37125] text-white p-4 border-r border-black/10 shadow-lg">
        <div className="text-xl font-bold flex items-center gap-2">
          <img src="/assets/logo.svg" alt="TaskFlow" className="h-6" />
        </div>
        <nav className="mt-8 space-y-2">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `block py-2 px-4 rounded-md text-lg transition-all duration-200 ${
                isActive
                  ? "bg-white/10 ring-1 ring-white/15 shadow-inner relative before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-1.5 before:rounded before:bg-white/70"
                  : "hover:bg-white/5 hover:translate-x-0.5"
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/dashboard/teams"
            className={({ isActive }) =>
              `block py-2 px-4 rounded-md text-lg transition-all duration-200 ${
                isActive
                  ? "bg-white/10 ring-1 ring-white/15 shadow-inner relative before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-1.5 before:rounded before:bg-white/70"
                  : "hover:bg-white/5 hover:translate-x-0.5"
              }`
            }
          >
            Teams
          </NavLink>
        </nav>
      </aside>

      <div className="flex flex-col flex-1 bg-[#f9f7f4]">
        <header className="bg-[#f5f5fa] shadow px-6 py-3 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          <div className="flex items-center gap-4">
            <span className="font-[Poppins] text-[#1f2937] text-lg font-semibold">
              {user?.name}
            </span>
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white">
              <img
                src="/assets/avatar.svg"
                alt="Avatar"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <button
              onClick={handleLogout}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded transition-colors duration-200 cursor-pointer shadow-sm"
            >
              Вийти
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
