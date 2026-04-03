import { useEffect, useRef, useState } from "react";
import { createBoard } from "../services/boardService";
import { NavLink, useNavigate } from "react-router-dom";
import { logoutUser } from "../services/authService";
import { getInitials, getStoredUser } from "../utils/user";
import Sidebar from "../components/Sidebar";

const MainLayout = ({ children }) =>{

  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [user, setUser] = useState(() => getStoredUser());
  const [menuOpen, setMenuOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    const onStorage = () => setUser(getStoredUser());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim()) return;

    try {
      const res = await createBoard({ title: newBoardTitle });

      setNewBoardTitle("");

      // navigate to new board
      navigate(`/board/${res.data._id}`);

    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // ignore server logout failures; still clear local session
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <button
            onClick={() => navigate("/")}
            className="text-xl font-semibold text-gray-800 hover:text-gray-900"
          >
            TaskFlow
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive
                  ? "text-gray-900 font-medium"
                  : "text-gray-600 hover:text-gray-900"
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/projects"
              className={({ isActive }) =>
                isActive
                  ? "text-gray-900 font-medium"
                  : "text-gray-600 hover:text-gray-900"
              }
            >
              Projects
            </NavLink>
            <NavLink
              to="/members"
              className={({ isActive }) =>
                isActive
                  ? "text-gray-900 font-medium border-b-2 border-indigo-600 pb-0.5"
                  : "text-gray-600 hover:text-gray-900"
              }
            >
              Members
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setCreating(true)}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm hover:bg-indigo-700 transition"
          >
            + Create Board
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-sm shadow-sm hover:bg-indigo-700 transition"
              aria-label="Open profile menu"
              title={user?.name || user?.email || "Profile"}
            >
              {getInitials(user?.name || user?.email)}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email || ""}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/profile");
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Profile
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex gap-6 p-6">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>

      {/* Create Board modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900">Create Board</h3>
            <p className="text-sm text-gray-500 mt-1">Give your board a name.</p>
            <input
              className="mt-4 w-full border rounded-lg px-3 py-2"
              placeholder="e.g., Product Roadmap"
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              autoFocus
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                className="px-3 py-2 text-sm rounded-lg hover:bg-gray-50"
                onClick={() => {
                  setCreating(false);
                  setNewBoardTitle("");
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                onClick={async () => {
                  await handleCreateBoard();
                  setCreating(false);
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainLayout;