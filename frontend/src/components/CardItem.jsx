import { useEffect, useRef, useState } from "react";
import { getInitials } from "../utils/user";

function userIdFromAssigned(u) {
  if (u == null) return "";
  if (typeof u === "object") return String(u._id || u.id || "");
  return String(u);
}

function boardMemberUserId(m) {
  const u = m?.user;
  if (u == null) return "";
  if (typeof u === "object") return String(u._id || u.id || "");
  return String(u);
}

function boardMemberName(m) {
  const u = m?.user;
  if (u && typeof u === "object") return u.name || "Member";
  return "Member";
}

export default function CardItem({
  card,
  listId,
  boardMembers = [],
  onDelete,
  onUpdate,
  onAssignMember,
  onUnassignMember,
  canDrag = false,
  onDragStartCard
}) {
  const cardId = card._id || card.id;
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(card.title || "");
  const [description, setDescription] = useState(card.description || "");
  const [assignOpen, setAssignOpen] = useState(false);
  const assignRef = useRef(null);

  useEffect(() => {
    setTitle(card.title || "");
    setDescription(card.description || "");
  }, [card.title, card.description]);

  useEffect(() => {
    if (!assignOpen) return;
    const close = (e) => {
      if (assignRef.current && !assignRef.current.contains(e.target)) {
        setAssignOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [assignOpen]);

  const save = async () => {
    const t = title.trim();
    if (!t) {
      alert("Title is required");
      return;
    }
    await onUpdate(cardId, {
      title: t,
      description: description.trim()
    });
    setEditing(false);
  };

  const assigned = Array.isArray(card.assignedUsers) ? card.assignedUsers : [];
  const assignedIds = new Set(assigned.map(userIdFromAssigned));

  const assignableMembers = boardMembers.filter(
    (m) => !assignedIds.has(boardMemberUserId(m))
  );

  return (
    <div
      className={`bg-white border border-gray-100 rounded-2xl p-4 shadow-sm ${
        canDrag ? "cursor-grab active:cursor-grabbing" : ""
      }`}
      draggable={Boolean(canDrag)}
      onDragStart={(e) => {
        if (!canDrag) return;
        onDragStartCard?.(e, {
          cardId: String(cardId),
          sourceListId: String(listId)
        });
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">
          RESEARCH
        </span>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="ml-auto text-xs text-indigo-600 hover:text-indigo-800"
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <input
            type="text"
            className="w-full p-2 border rounded-lg text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <textarea
            className="w-full p-2 border rounded-lg text-sm"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              className="px-3 py-1.5 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setTitle(card.title || "");
                setDescription(card.description || "");
              }}
              className="px-3 py-1.5 text-xs rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-900 font-medium">{card.title}</p>
          {card.description && (
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{card.description}</p>
          )}
        </>
      )}

      {/* Assignees */}
      <div className="mt-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {assigned.length === 0 ? (
            <span className="text-[11px] text-gray-400">No assignees</span>
          ) : (
            assigned.map((u) => {
              const uid = userIdFromAssigned(u);
              const displayName =
                (typeof u === "object" && u.name) ||
                boardMemberName(
                  boardMembers.find((m) => boardMemberUserId(m) === uid) || {}
                );
              return (
                <span
                  key={uid}
                  className="inline-flex items-center gap-1 pl-1 pr-0.5 py-0.5 rounded-full bg-gray-100 text-[11px] text-gray-800"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-semibold text-white">
                    {getInitials(displayName)}
                  </span>
                  <span className="max-w-[100px] truncate">{displayName}</span>
                  <button
                    type="button"
                    onClick={() => onUnassignMember(cardId, uid)}
                    className="ml-0.5 rounded-full p-0.5 text-gray-500 hover:bg-gray-200 hover:text-red-600"
                    title="Remove assignee"
                    aria-label={`Unassign ${displayName}`}
                  >
                    ×
                  </button>
                </span>
              );
            })
          )}
        </div>

        <div className="relative flex items-center justify-between gap-2" ref={assignRef}>
          <div className="flex items-center gap-3 text-gray-500">
            <span className="text-xs">💬 3</span>
            <span className="text-xs">📎 2</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAssignOpen((o) => !o)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              + Assign
            </button>
            <button
              type="button"
              onClick={() => onDelete(cardId)}
              className="text-red-500 text-xs hover:text-red-700"
              title="Delete card"
            >
              Delete
            </button>
          </div>

          {assignOpen && (
            <div className="absolute right-0 bottom-full mb-1 z-30 w-56 max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
              {assignableMembers.length === 0 ? (
                <p className="px-3 py-2 text-xs text-gray-500">Everyone is assigned</p>
              ) : (
                assignableMembers.map((m) => {
                  const uid = boardMemberUserId(m);
                  const name = boardMemberName(m);
                  return (
                    <button
                      key={uid}
                      type="button"
                      onClick={async () => {
                        setAssignOpen(false);
                        await onAssignMember(cardId, uid);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-gray-50"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-semibold text-white">
                        {getInitials(name)}
                      </span>
                      <span className="truncate font-medium text-gray-800">{name}</span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
