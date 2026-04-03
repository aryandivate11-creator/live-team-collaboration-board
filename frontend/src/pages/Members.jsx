import { useEffect, useMemo, useState } from "react";
import {
  getBoardById,
  getBoards,
  addMember,
  removeMember,
  updateMemberRole
} from "../services/boardService";
import { searchUsers as searchUsersApi } from "../services/userService";
import { unwrapApiData } from "../services/http";
import { getInitials, getStoredUser } from "../utils/user";

const PAGE_SIZE = 8;
const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" }
];

function memberUserId(m) {
  const u = m?.user;
  if (u == null) return "";
  if (typeof u === "object") return String(u._id || u.id || "");
  return String(u);
}

export default function Members() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [inviteBoardId, setInviteBoardId] = useState(null);
  const [inviteQuery, setInviteQuery] = useState("");
  const [inviteResults, setInviteResults] = useState([]);
  const [pageByBoard, setPageByBoard] = useState({});

  const refreshBoard = async (boardId) => {
    const raw = await getBoardById(boardId);
    const doc = unwrapApiData(raw);
    setSections((prev) =>
      prev.map((s) =>
        s.boardId === boardId
          ? {
              ...s,
              title: doc.title,
              members: doc.members || []
            }
          : s
      )
    );
  };

  useEffect(() => {
    setPageByBoard({});
  }, [filter]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const user = getStoredUser();
        if (!user?._id) {
          setSections([]);
          return;
        }

        const boardsPayload = unwrapApiData(await getBoards());
        const all = Array.isArray(boardsPayload) ? boardsPayload : [];

        const owned = all.filter(
          (b) => String(b.owner) === String(user._id)
        );

        const enriched = await Promise.all(
          owned.map(async (b) => {
            const raw = await getBoardById(b._id);
            const doc = unwrapApiData(raw);
            return {
              boardId: String(doc._id),
              title: doc.title,
              members: doc.members || []
            };
          })
        );

        setSections(enriched);
      } catch (e) {
        setError(e.message || "Failed to load members");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!inviteBoardId || !inviteQuery.trim()) {
      setInviteResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await searchUsersApi(inviteQuery);
        const list = unwrapApiData(res) || res?.data || [];
        const arr = Array.isArray(list) ? list : [];
        const section = sections.find((s) => s.boardId === inviteBoardId);
        const existing = new Set(
          (section?.members || []).map((m) => memberUserId(m))
        );
        setInviteResults(arr.filter((u) => !existing.has(String(u._id))));
      } catch (e) {
        setError(e.message);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [inviteQuery, inviteBoardId, sections]);

  const totals = useMemo(() => {
    let memberRows = 0;
    sections.forEach((s) => {
      memberRows += (s.members || []).length;
    });
    return { boards: sections.length, memberRows };
  }, [sections]);

  const filterMembers = (members) => {
    const q = filter.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const u = m.user;
      const name = typeof u === "object" ? u?.name || "" : "";
      const email = typeof u === "object" ? u?.email || "" : "";
      return (
        name.toLowerCase().includes(q) || email.toLowerCase().includes(q)
      );
    });
  };

  const handleAdd = async (boardId, userId) => {
    try {
      setError("");
      await addMember(boardId, { userId, role: "member" });
      await refreshBoard(boardId);
      setInviteQuery("");
      setInviteResults([]);
      setInviteBoardId(null);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleRemove = async (boardId, userId) => {
    if (
      !window.confirm(
        "Remove this person from the board? They will lose access to its lists and cards."
      )
    ) {
      return;
    }
    try {
      setError("");
      await removeMember(boardId, userId);
      await refreshBoard(boardId);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleRole = async (boardId, userId, role, previousRole) => {
    if (role === previousRole) return;
    try {
      setError("");
      await updateMemberRole(boardId, userId, role);
      await refreshBoard(boardId);
    } catch (e) {
      setError(e.message);
      await refreshBoard(boardId);
    }
  };

  const setPage = (boardId, p) => {
    setPageByBoard((prev) => ({ ...prev, [boardId]: p }));
  };

  if (loading) {
    return (
      <p className="text-sm text-gray-500 py-8">Loading workspace members…</p>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Manage Members
          </h1>
          <p className="text-sm text-gray-500 mt-2 max-w-xl leading-relaxed">
            Boards you own are listed below. Assign roles, invite collaborators,
            and control access for each workspace.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm flex-1 lg:min-w-[280px] shadow-sm">
            <span className="text-gray-400" aria-hidden>
              🔍
            </span>
            <input
              className="outline-none flex-1 bg-transparent placeholder:text-gray-400"
              placeholder="Search members by name or email.."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Active now
          </p>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {totals.memberRows}{" "}
            <span className="font-normal text-gray-600">team members</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Across {totals.boards} board{totals.boards === 1 ? "" : "s"} you
            own
          </p>
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
          <p className="text-gray-700 font-medium">No owned boards yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Create a board from the dashboard — only boards you own appear here
            with member management.
          </p>
        </div>
      ) : (
        sections.map((section) => (
          <BoardMemberSection
            key={section.boardId}
            section={section}
            filterMembers={filterMembers}
            inviteBoardId={inviteBoardId}
            setInviteBoardId={setInviteBoardId}
            inviteQuery={inviteQuery}
            setInviteQuery={setInviteQuery}
            inviteResults={inviteResults}
            onAdd={handleAdd}
            onRemove={handleRemove}
            onRoleChange={handleRole}
            page={pageByBoard[section.boardId] || 1}
            onPageChange={(p) => setPage(section.boardId, p)}
            pageSize={PAGE_SIZE}
          />
        ))
      )}
    </div>
  );
}

function BoardMemberSection({
  section,
  filterMembers,
  inviteBoardId,
  setInviteBoardId,
  inviteQuery,
  setInviteQuery,
  inviteResults,
  onAdd,
  onRemove,
  onRoleChange,
  page,
  onPageChange,
  pageSize
}) {
  const members = filterMembers(section.members || []);
  const total = members.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = members.slice(start, start + pageSize);

  return (
    <section className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4 border-b border-gray-100 bg-gray-50/80">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {section.title}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {total} member{total === 1 ? "" : "s"}
          </p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setInviteBoardId((id) =>
                id === section.boardId ? null : section.boardId
              )
            }
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            <span aria-hidden>＋</span>
            Add Member
          </button>
          {inviteBoardId === section.boardId && (
            <div className="absolute right-0 top-full mt-2 z-20 w-full min-w-[280px] rounded-xl border border-gray-100 bg-white shadow-xl overflow-hidden">
              <input
                className="w-full px-3 py-2 text-sm border-b border-gray-100 outline-none"
                placeholder="Search users…"
                value={inviteQuery}
                onChange={(e) => setInviteQuery(e.target.value)}
                autoFocus
              />
              <div className="max-h-56 overflow-y-auto">
                {inviteResults.length === 0 ? (
                  <p className="p-3 text-xs text-gray-500">Type to search…</p>
                ) : (
                  inviteResults.map((u) => (
                    <button
                      key={u._id}
                      type="button"
                      onClick={() => onAdd(section.boardId, u._id)}
                      className="w-full px-3 py-2.5 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {u.name}
                      </p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
              <th className="px-5 py-3">Member details</th>
              <th className="px-5 py-3 hidden sm:table-cell">Access role</th>
              <th className="px-5 py-3">Role selection</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pageRows.map((m) => {
              const u = m.user;
              const uid = memberUserId(m);
              const isOwner = m.role === "owner";
              const name = typeof u === "object" ? u?.name || "Member" : "—";
              const email = typeof u === "object" ? u?.email || "" : "";

              return (
                <tr key={uid} className="hover:bg-gray-50/60">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {getInitials(name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                      {m.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {isOwner ? (
                      <span className="text-xs text-gray-500">Owner (fixed)</span>
                    ) : (
                      <select
                        className="w-full max-w-[140px] border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                        value={
                          ROLE_OPTIONS.some((r) => r.value === m.role)
                            ? m.role
                            : "member"
                        }
                        onChange={(e) =>
                          onRoleChange(
                            section.boardId,
                            uid,
                            e.target.value,
                            m.role
                          )
                        }
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {isOwner ? (
                      <span
                        className="inline-flex text-gray-400"
                        title="Board owner cannot be removed"
                        aria-label="Locked"
                      >
                        🔒
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onRemove(section.boardId, uid)}
                        className="inline-flex p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50"
                        title="Remove member"
                        aria-label="Remove member"
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {total > pageSize && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-600">
          <span>
            Showing {total === 0 ? 0 : start + 1}–{Math.min(start + pageSize, total)}{" "}
            of {total} members
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => onPageChange(safePage - 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => onPageChange(safePage + 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
