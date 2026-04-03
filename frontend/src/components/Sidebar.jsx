import { NavLink, useParams } from "react-router-dom";

const itemBase =
  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100";
const activeClass = "bg-gray-100 text-gray-900 font-medium";

export default function Sidebar() {
  const { id } = useParams(); // board id when present
  const membersHref = id ? `/members/${id}` : "/"; // fallback to dashboard

  return (
    <aside className="hidden md:block w-60 flex-shrink-0">
      <div className="sticky top-4 space-y-2">
        <div className="px-3 py-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold">
              W
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Workspace</p>
              <p className="text-xs text-gray-500">Collaborative</p>
            </div>
          </div>
        </div>

        <NavLink to="/" className={({ isActive }) => `${itemBase} ${isActive ? activeClass : ""}`}>
          <span>Overview</span>
        </NavLink>
        <button className={itemBase} type="button">
          <span>Analytics</span>
        </button>
        <NavLink to={membersHref} className={({ isActive }) => `${itemBase} ${isActive ? activeClass : ""}`}>
          <span>Team</span>
        </NavLink>
        <button className={itemBase} type="button">
          <span>Archive</span>
        </button>

        <div className="pt-2 border-t border-gray-100 mt-2" />
        <button className={itemBase} type="button">
          <span>Help</span>
        </button>
        <button className={itemBase} type="button">
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}

