import { useEffect, useState } from "react";
import { getBoards, createBoard } from "../services/boardService";
import { useNavigate } from "react-router-dom";
import { getStoredUser } from "../utils/user";
import { unwrapApiData } from "../services/http";

const Dashboard = () => {
  const [boards, setBoards] = useState([]);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBoards = async () => {
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
        const owned = all.filter((b) => String(b.owner ?? "") === myId);

        setBoards(owned);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchBoards();
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await createBoard({ title: newTitle.trim() });
      setCreating(false);
      setNewTitle("");
      navigate(`/board/${res.data._id}`);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Your Boards</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage your active projects and track team progress across all workspaces.
          </p>
        </div>
        <div className="flex items-center gap-2"></div>
      </div>

      {error && (
        <p className="text-red-500 mb-4">{error}</p>
      )}

      {/* Boards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

        {boards.map((board) => {
          const membersCount = Array.isArray(board.members) ? board.members.length : undefined;
          return (
            <div
              key={board._id}
              onClick={() => navigate(`/board/${board._id}`)}
              className="relative cursor-pointer bg-white border border-gray-100 rounded-2xl p-4 text-left shadow-sm hover:shadow-md transition"
            >
              {/* Kebab menu inside card, does not trigger parent click */}
              <div className="absolute top-2 right-2 z-20" onClick={(e) => e.stopPropagation()}>
                <BoardCardMenu boardId={board._id} />
              </div>

              <div className="w-10 h-10 rounded-xl bg-gray-100 mb-3 flex items-center justify-center text-lg">
                📌
              </div>

              <p className="text-sm text-gray-900 font-semibold">{board.title}</p>
              <p className="text-xs text-gray-500 mt-1">
                {typeof membersCount === "number" ? `${membersCount} Members` : "Members —"}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 border-2 border-white" />
                  <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white" />
                  <div className="w-6 h-6 rounded-full bg-amber-500 border-2 border-white" />
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                  ACTIVE
                </span>
              </div>
            </div>
          );
        })}

        {/* New Board tile */}
        <button
          onClick={() => setCreating(true)}
          className="rounded-2xl border-2 border-dashed border-gray-300 hover:border-gray-400 bg-gray-50 text-gray-700 p-6 text-center flex flex-col items-center justify-center"
          aria-label="Create new board"
        >
          <div className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center mb-3">
            <span className="text-lg font-semibold">+</span>
          </div>
          <p className="text-sm font-medium">New Board</p>
          <p className="text-xs text-gray-500">Start a fresh project</p>
        </button>

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
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                className="px-3 py-2 text-sm rounded-lg hover:bg-gray-50"
                onClick={() => {
                  setCreating(false);
                  setNewTitle("");
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                onClick={handleCreate}
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

export default Dashboard;

function BoardCardMenu({ boardId }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const onDelete = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    try {
      const { deleteBoard } = await import("../services/boardService");
      await deleteBoard(boardId);
      // simple reload pattern for now
      navigate(0);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
        title="More"
      >
        ⋯
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-100 rounded-xl shadow-lg z-30 overflow-hidden">
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              navigate(`/board/${boardId}`);
            }}
          >
            Open
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            onClick={onDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete board"}
          </button>
        </div>
      )}
    </div>
  );
}