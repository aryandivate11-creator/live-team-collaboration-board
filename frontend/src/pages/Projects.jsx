import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBoards } from "../services/boardService";
import { getStoredUser } from "../utils/user";
import { unwrapApiData } from "../services/http";

const Projects = () => {
  const [boards, setBoards] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchBoards = async () => {
      setLoading(true);
      setError("");
      try {
        const me = getStoredUser();
        if (!me?._id) {
          setBoards([]);
          return;
        }

        const res = await getBoards();
        const payload = unwrapApiData(res) ?? res?.data;
        const all = Array.isArray(payload) ? payload : [];

        const myId = String(me._id);

        const joined = all.filter((b) => {
          const ownerId = String(b.owner ?? "");
          if (ownerId === myId) return false;
          const members = Array.isArray(b.members) ? b.members : [];
          return members.some((m) => {
            const u = m?.user;
            if (u == null) return false;
            if (typeof u === "object") return String(u._id || u.id || "") === myId;
            return String(u) === myId;
          });
        });

        setBoards(joined);
      } catch (err) {
        setError(err.message || "Failed to load projects");
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Projects</h2>
          <p className="text-sm text-gray-500 mt-1">
            Boards where you&apos;ve been added as a member.
          </p>
        </div>
      </div>

      {error && (
        <p className="text-red-500 mb-4 text-sm">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading projects…</p>
      ) : boards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-gray-800 font-medium">No shared boards yet</p>
          <p className="text-sm text-gray-500 mt-2">
            When someone adds you to their board, it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {boards.map((board) => {
            const membersCount = Array.isArray(board.members)
              ? board.members.length
              : undefined;
            return (
              <button
                key={board._id}
                type="button"
                onClick={() => navigate(`/board/${board._id}`)}
                className="relative text-left cursor-pointer bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 mb-3 flex items-center justify-center text-lg">
                  📁
                </div>
                <p className="text-sm text-gray-900 font-semibold truncate">
                  {board.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {typeof membersCount === "number"
                    ? `${membersCount} Members`
                    : "Members —"}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Projects;

