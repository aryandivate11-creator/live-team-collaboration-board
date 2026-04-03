import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getBoardById, addMember, removeMember, updateMemberRole } from "../services/boardService";
import { searchUsers as searchUsersApi } from "../services/userService";
import { getInitials } from "../utils/user";

export default function Members() {
  const { id } = useParams(); // board id
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await getBoardById(id);
        setBoard(res.data);
        setMembers(res.data.members || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await searchUsersApi(query);
        const existing = new Set(members.map((m) => String(m.user)));
        setResults((res.data || []).filter((u) => !existing.has(String(u._id))));
      } catch (e) {
        setError(e.message);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, members]);

  const teamCount = members.length;
  const capacityPct = useMemo(() => Math.min(100, Math.round((teamCount / 14) * 100)), [teamCount]);

  const handleAdd = async (userId) => {
    try {
      await addMember(id, { userId, role: "member" });
      setInviteOpen(false);
      setQuery("");
      setResults([]);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleRemove = async (userId) => {
    try {
      await removeMember(id, userId);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleRole = async (userId, role) => {
    try {
      await updateMemberRole(id, userId, role);
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Loading members…</p>;
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Manage Members</h1>
          <p className="text-sm text-gray-500 mt-1">
            Assign roles, invite new collaborators, and maintain access for the board.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-2 border rounded-lg text-sm">
            <input
              className="outline-none"
              placeholder="Search members by name or email.."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setInviteOpen(true)}
            />
          </div>
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-indigo-700"
            onClick={() => setInviteOpen((v) => !v)}
          >
            + Add Member
          </button>
        </div>
      </div>

      {inviteOpen && (
        <div className="relative mt-3">
          <div className="absolute right-0 z-10 w-full md:w-96 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden">
            {results.length === 0 ? (
              <p className="p-3 text-sm text-gray-500">Type to search users…</p>
            ) : (
              results.map((u) => (
                <button
                  key={u._id}
                  onClick={() => handleAdd(u._id)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50"
                >
                  <p className="text-sm font-medium text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-2 bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-gray-500">MEMBER DETAILS</p>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          <div className="divide-y divide-gray-100">
            {members.map((m) => (
              <div key={String(m.user)} className="py-3 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold">
                  {getInitials(m.user?.name)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{m.user?.name}</p>
                  <p className="text-xs text-gray-500">{m.user?.email}</p>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                  {m.role}
                </span>
                <select
                  className="text-sm border rounded-lg px-2 py-1"
                  defaultValue={m.role}
                  onChange={(e) => handleRole(String(m.user?._id || m.user), e.target.value)}
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  className="text-gray-500 hover:text-gray-900 text-sm"
                  onClick={() => handleRemove(String(m.user?._id || m.user))}
                  title="Remove"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-indigo-600 text-white rounded-2xl p-5">
          <p className="text-sm opacity-80">Plan Capacity</p>
          <p className="text-2xl font-semibold mt-1">{capacityPct}% Full</p>
        </div>
      </div>
    </div>
  );
}

