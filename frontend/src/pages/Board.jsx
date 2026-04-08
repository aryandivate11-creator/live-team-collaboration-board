import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ListColumn from "../components/ListColumn";
import { getLists } from "../services/listService";
import { createList } from "../services/listService";
import {connectSocket , getSocket} from "../sockets/socket.js";
import { getCards , createCard, updateCard, unassignUserFromCard, moveCard } from "../services/cardService";
import { deleteBoard, getBoardById } from "../services/boardService";
import { useNavigate } from "react-router-dom";
import { updateBoard } from "../services/boardService";
import { searchUsers } from "../services/userService";
import { addMember, removeMember } from "../services/boardService";
import { getInitials, getStoredUser } from "../utils/user";
import { unwrapApiData } from "../services/http";


export default function Board() {


  const { id } = useParams(); // boardId
  const [lists, setLists] = useState([]);
  const [error, setError] = useState("");
  const [newListTitle, setNewListTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [members, setMembers] = useState([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [activity, setActivity] = useState([]);
  const me = getStoredUser();
  const myId = me?._id ? String(me._id) : "";
  const myRole =
    (members || []).find(
      (m) => String(m?.user?._id || m?.user?.id || m?.user || "") === myId
    )?.role || "viewer";
  const canMoveCards = myRole !== "viewer";
  
  useEffect(() => {
    const fetchLists = async () => {
      setError("");
      try {
        const [listsRes, boardRes] = await Promise.all([getLists(id), getBoardById(id)]);
        const boardDoc = unwrapApiData(boardRes);
        const listsRaw = unwrapApiData(listsRes);
        const listsArray = Array.isArray(listsRaw) ? listsRaw : [];

        const listsWithCards = await Promise.all(
          listsArray.map(async (list) => {
            const cardsRes = await getCards(list._id);
            const payload = unwrapApiData(cardsRes);

            return {
              ...list,
              cards: payload?.cards || []
            };
          })
        );

        setLists(listsWithCards);
        setTitle(boardDoc?.title || "Board");
        setMembers(boardDoc?.members || []);
      } catch (err) {
        setError(err.message);
      }
    };
  
    fetchLists();
  }, [id]);
 
    const handleCreateCard = async (listId, title, description = "") => {
  try {
    await createCard({
      title,
      description,
      listId
    });

  } catch (err) {
    alert(err.message);
  }
};

  const handleUpdateCard = async (cardId, { title, description }) => {
    try {
      await updateCard(cardId, { title, description });
      setLists((prev) =>
        prev.map((list) => ({
          ...list,
          cards: (list.cards || []).map((c) => {
            const cid = String(c._id || c.id);
            if (cid !== String(cardId)) return c;
            return { ...c, title, description };
          })
        }))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAssignMember = async (cardId, userId) => {
    try {
      await updateCard(cardId, { assignedUsers: [userId] });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUnassignMember = async (cardId, userId) => {
    try {
      await unassignUserFromCard(cardId, userId);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMoveCard = async (eOrNull, info) => {
    if (!canMoveCards) return;

    // Drag start signature: (event, { cardId, sourceListId })
    if (info?.cardId && info?.sourceListId && eOrNull?.dataTransfer) {
      try {
        eOrNull.dataTransfer.setData(
          "application/json",
          JSON.stringify({
            cardId: String(info.cardId),
            sourceListId: String(info.sourceListId)
          })
        );
        eOrNull.dataTransfer.effectAllowed = "move";
      } catch {
        // ignore
      }
      return;
    }

    // Drop signature: (event, { destinationListId })
    const e = eOrNull;
    const destinationListId = String(info?.destinationListId || "");
    if (!destinationListId || !e?.dataTransfer) return;

    let payload = null;
    try {
      payload = JSON.parse(e.dataTransfer.getData("application/json") || "null");
    } catch {
      payload = null;
    }
    if (!payload?.cardId || !payload?.sourceListId) return;

    const cardId = String(payload.cardId);
    const sourceListId = String(payload.sourceListId);
    if (!cardId || !sourceListId) return;
    if (sourceListId === destinationListId) return;

    const snapshot = lists;

    // optimistic UI: move card to bottom of destination list
    setLists((prev) => {
      let movingCard = null;
      const without = prev.map((l) => {
        if (String(l._id) !== sourceListId) return l;
        const nextCards = (l.cards || []).filter((c) => {
          const isTarget = String(c._id || c.id) === cardId;
          if (isTarget) movingCard = c;
          return !isTarget;
        });
        return { ...l, cards: nextCards };
      });

      if (!movingCard) return prev;

      return without.map((l) => {
        if (String(l._id) !== destinationListId) return l;
        return { ...l, cards: [...(l.cards || []), movingCard] };
      });
    });

    try {
      const dest = (lists || []).find((l) => String(l._id) === destinationListId);
      const newPosition = (dest?.cards?.length || 0) + 1; // backend expects 1-based

      await moveCard({
        cardId,
        sourceListId,
        destinationListId,
        newPosition
      });
    } catch (err) {
      setLists(snapshot);
      alert(err.message);
    }
  };
 
const navigate = useNavigate();

const handleDeleteBoard = async () => {
  try {
    await deleteBoard(id);
    navigate("/");
  } catch (err) {
    alert(err.message);
  }
};

  useEffect(() => {
  const socket = connectSocket();
 
  // join board room
  socket.emit("joinBoard", id);

  return () => {
    socket.emit("leaveBoard", id);
    socket.disconnect();
  };
}, [id]);

  useEffect(() => {
  if (!search.trim()) {
    setResults([]);
    setSearchError("");
    return;
  }

  const fetchUsers = async () => {
    try {
      const res = await searchUsers(search);
      const users = res?.data || [];
      const existingIds = new Set(
        members.map((m) => String(m.user?._id || m.user?.id || m.user))
      );
      setResults(users.filter((u) => !existingIds.has(String(u._id))));
      setSearchError("");
    } catch (err) {
      setSearchError(err.message);
    }
  };

  const delay = setTimeout(fetchUsers, 300);
  return () => clearTimeout(delay);

}, [search, members]);

const handleAddMember = async (userId) => {
  try {
    await addMember(id, {
      userId,
      role: "member"
    });

    setSearch("");
    setResults([]);
    setShowAddMemberModal(false);

  } catch (err) {
    alert(err.message);
  }
};

const handleRemoveMember = async (userId) => {
  try {
    await removeMember(id, userId);
  } catch (err) {
    alert(err.message);
  }
};

  const handleCreateList = async () => {
  if (!newListTitle.trim()) return;

  try {
    const res = await createList({
      title: newListTitle,
      boardId: id
    });

    setNewListTitle("");
  } catch (err) {
    alert(err.message);
  }
};

const handleUpdateBoard = async () => {
  try {
    await updateBoard(id, { title });
    setIsEditing(false);
  } catch (err) {
    alert(err.message);
  }
};

  const formatActivityTime = (ts) => {
    if (!ts) return "";
    try {
      return new Date(ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "";
    }
  };

  const pushActivity = (text, ts) => {
    const at = ts ?? Date.now();
    const id = `${at}-${Math.random().toString(16).slice(2)}`;
    setActivity((prev) => [...prev, { id, text, at }].slice(-50));
  };

  const getActorName = (payload) =>
    payload?.user?.name || payload?.triggeredBy?.name || "Someone";

  const getAssignedToText = (assignedUsers) => {
    if (!Array.isArray(assignedUsers) || assignedUsers.length === 0) {
      return "nobody";
    }
 
    const names = assignedUsers
      .map((u) => {
        if (u && typeof u === "object") return u.name;
        return null;
      })
      .filter(Boolean);

    if (names.length > 0) return names.join(", ");
    return `${assignedUsers.length} user(s)`;
  };

useEffect(() => {
  const socket = getSocket();

  if (!socket) return;

  const normalizeMember = (member) => {
    const rawUser = member?.user || {};
    const normalizedUser = {
      _id: rawUser._id || rawUser.id || rawUser,
      name: rawUser.name || "Member"
    };

    return {
      ...member,
      user: normalizedUser
    };
  };

  // ================= CARD CREATED =================
  socket.on("card:created", (data) => {
    const raw = data.card;
    const normalized = {
      ...raw,
      _id: raw._id || raw.id,
      listId: raw.listId
    };
    const listKey = String(normalized.listId);

    setLists((prevLists) =>
      prevLists.map((list) =>
        String(list._id) === listKey
          ? {
              ...list,
              cards: [...(list.cards || []), normalized]
            }
          : list
      )
    );

    const actor = getActorName(data);
    const cardTitle = normalized.title || "Untitled";
    const assignedToText = getAssignedToText(normalized.assignedUsers);
    pushActivity(
      `${actor} created card “${cardTitle}” and assigned it to ${assignedToText}`,
      data.timestamp
    );
  });

  // ================= CARD DELETED =================
  socket.on("card:deleted", (data) => {
    const deletedId = String(data.card.id);
    const listKey = String(data.card.listId);

    setLists((prevLists) =>
      prevLists.map((list) =>
        String(list._id) === listKey
          ? {
              ...list,
              cards: (list.cards || []).filter(
                (c) => String(c._id || c.id) !== deletedId
              )
            }
          : list
      )
    );

    const actor = getActorName(data);
    pushActivity(
      `${actor} deleted card “${data.card.title || "Untitled"}”`,
      data.timestamp
    );
  });

  socket.on("card:updated", (data) => {
    const c = data.card;
    const cid = String(c.id || c._id);

    const assignedNormalized = Array.isArray(c.assignedUsers)
      ? c.assignedUsers.map((u) =>
          u && typeof u === "object"
            ? { _id: u.id || u._id, name: u.name || "Member" }
            : { _id: u, name: "" }
        )
      : null;

    setLists((prev) =>
      prev.map((list) => ({
        ...list,
        cards: (list.cards || []).map((x) => {
          if (String(x._id || x.id) !== cid) return x;
          return {
            ...x,
            ...(c.title !== undefined ? { title: c.title } : {}),
            ...(c.description !== undefined ? { description: c.description } : {}),
            ...(assignedNormalized !== null ? { assignedUsers: assignedNormalized } : {})
          };
        })
      }))
    );

    const actor = getActorName(data);
    const cardTitle = c.title || "Untitled";

    if (data.action === "assigned") {
      pushActivity(
        `${actor} assigned card “${cardTitle}” to ${getAssignedToText(c.assignedUsers)}`,
        data.timestamp
      );
    } else {
      pushActivity(`${actor} edited card “${cardTitle}”`, data.timestamp);
    }
  });

  socket.on("card:unassigned", (data) => {
    const cardId = String(data?.card?.id || data?.card?.Id || "");
    const uid = String(data?.user?.id || "");

    setLists((prev) =>
      prev.map((list) => ({
        ...list,
        cards: (list.cards || []).map((c) => {
          if (String(c._id || c.id) !== cardId) return c;
          if (Array.isArray(data.card?.assignedUsers)) {
            return {
              ...c,
              assignedUsers: data.card.assignedUsers.map((u) => ({
                _id: u.id || u._id,
                name: u.name || "Member"
              }))
            };
          }
          return {
            ...c,
            assignedUsers: (c.assignedUsers || []).filter((a) => {
              const aid =
                typeof a === "object" ? String(a._id || a.id || "") : String(a);
              return aid !== uid;
            })
          };
        })
      }))
    );

    const actor = data?.triggeredBy?.name || "Someone";
    const cardTitle = data?.card?.title || "Untitled";
    const removedName = data?.user?.name || "a user";
    pushActivity(
      `${actor} unassigned ${removedName} from card “${cardTitle}”`,
      data.timestamp
    );
  });

  socket.on("card:moved", (data) => {
    const cardId = String(data?.card?.id || data?.card?._id || "");
    const fromListId = String(data?.from?.listId || "");
    const toListId = String(data?.to?.listId || "");
    if (!cardId || !fromListId || !toListId) return;

    setLists((prev) => {
      let movingCard = null;
      const removed = prev.map((l) => {
        if (String(l._id) !== fromListId) return l;
        const nextCards = (l.cards || []).filter((c) => {
          const isTarget = String(c._id || c.id) === cardId;
          if (isTarget) movingCard = c;
          return !isTarget;
        });
        return { ...l, cards: nextCards };
      });

      if (!movingCard) return prev;

      return removed.map((l) => {
        if (String(l._id) !== toListId) return l;
        return { ...l, cards: [...(l.cards || []), movingCard] };
      });
    });

    const actor = getActorName(data);
    pushActivity(
      `${actor} moved card “${data?.card?.title || "Untitled"}” from “${
        data?.from?.sourceTitle || "a list"
      }” to “${data?.to?.destinationTitle || "a list"}”`,
      data.timestamp
    );
  });

  // ================= LIST CREATED =================
  socket.on("list:created", (data) => {
    setLists((prev) => [...prev,  {
    ...data.list,
    _id: data.list._id || data.list.id // 🔥 normalize here
  }]);

    const actor = getActorName(data);
    pushActivity(
      `${actor} created list “${data.list.title || "Untitled"}”`,
      data.timestamp
    );
  });

  // ================= LIST DELETED =================
  socket.on("list:deleted", (data) => {
    const lid = String(data.list.id);
    setLists((prev) =>
      prev.filter((l) => String(l._id) !== lid)
    );

    const actor = getActorName(data);
    pushActivity(
      `${actor} deleted list “${data.list.title || "Untitled"}”`,
      data.timestamp
    );
  });

  socket.on("list:updated", (data) => {
    const oldTitle = data?.list?.oldTitle;
    const newTitle = data?.list?.newTitle;
    const actor = getActorName(data);
    const text =
      oldTitle || newTitle
        ? `${actor} renamed list “${oldTitle || "Untitled"}” to “${
            newTitle || "Untitled"
          }”`
        : `${actor} updated list`;
    pushActivity(text, data.timestamp);
  });

  socket.on("member:added", (data) => {
    setMembers((prev) => {
      const nextMember = normalizeMember(data.member);
      const exists = prev.some(
        (m) => String(m.user?._id || m.user?.id) === String(nextMember.user._id)
      );
      if (exists) return prev;
      return [...prev, nextMember];
    });

    const actor = getActorName(data);
    const name =
      data?.member?.user?.name || data?.member?.user?.id || "Member";
    pushActivity(`${actor} added ${name} to the board`, data.timestamp);
  });

  socket.on("member:removed", (data) => {
    setMembers((prev) =>
      prev.filter((m) => String(m.user?._id || m.user?.id) !== String(data.member.user.id))
    );

    const actor = getActorName(data);
    const name =
      data?.member?.user?.name || data?.member?.user?.id || "Member";
    pushActivity(`${actor} removed ${name} from the board`, data.timestamp);
  });

  socket.on("board:updated", (data) => {
    const boardTitle = data?.board?.title || "Board";
    const actor = getActorName(data);
    pushActivity(`${actor} updated the board title to “${boardTitle}”`, data.timestamp);
  });

  return () => {
    socket.off("card:created");
    socket.off("card:deleted");
    socket.off("card:updated");
    socket.off("card:unassigned");
    socket.off("card:moved");
    socket.off("list:created");
    socket.off("list:deleted");
    socket.off("list:updated");
    socket.off("member:added");
    socket.off("member:removed");
    socket.off("board:updated");
  };
}, []);

  return (
  <div className="max-w-7xl mx-auto space-y-6">

    {/* HEADER */}
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">

      {/* LEFT */}
      <div>

        {/* Editable Title */}
        {isEditing ? (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleUpdateBoard}
            className="text-2xl font-semibold border rounded-lg px-3 py-1.5 w-full max-w-sm"
            autoFocus
          />
        ) : (
          <h2
            onClick={() => setIsEditing(true)}
            className="text-2xl font-semibold cursor-pointer text-gray-800"
          >
            {title || "Board"}
          </h2>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-500 mt-2">{error}</p>
        )}
      </div>

      {/* RIGHT SIDE */}
      <div className="flex flex-col items-stretch lg:items-end gap-2 relative">

        {/* Members */}
        <div className="flex flex-wrap gap-2 max-w-md justify-start lg:justify-end">
          {members.map((m) => (
            <div
              key={m.user._id || m.user.id}
              className="h-8 px-2 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-semibold"
              title={m.user.name || "Member"}
            >
              {getInitials(m.user.name)}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 relative">
          <button
            onClick={() => setShowAddMemberModal((v) => !v)}
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            + Add Member
          </button>
          <button
            onClick={handleDeleteBoard}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            Delete Board
          </button>

          {/* Add Member dropdown (aligned with button) */}
          {showAddMemberModal && (
            <div className="absolute right-0 top-full mt-2 z-50 w-80 max-w-xs bg-white rounded-xl shadow-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Add member</h3>
                <button
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setSearch("");
                    setResults([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                  aria-label="Close add member"
                >
                  ✕
                </button>
              </div>

              <input
                type="text"
                placeholder="Search by name or email"
                className="w-full border px-3 py-2 rounded-lg text-sm mb-2"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />

              {searchError && (
                <p className="text-xs text-red-500 mb-1">{searchError}</p>
              )}

              {results.length > 0 ? (
                <div className="max-h-56 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-100">
                  {results.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => handleAddMember(user._id)}
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-gray-50"
                    >
                      <div className="h-8 w-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-semibold">
                        {getInitials(user.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                search.trim() && !searchError && (
                  <p className="text-xs text-gray-500 mt-1">No users found</p>
                )
              )}
            </div>
          )}
        </div>

      </div>
    </div>

    {/* LISTS */}
    <div className="w-full max-w-full flex gap-6 overflow-x-auto pb-4 items-start scrollbar-hide">

      {lists.map((list) => (
        <ListColumn
          key={list._id}
          list={list}
          onCreateCard={handleCreateCard}
          onUpdateCard={handleUpdateCard}
          boardMembers={members}
          onAssignMember={handleAssignMember}
          onUnassignMember={handleUnassignMember}
          canDragCards={canMoveCards}
          onMoveCard={handleMoveCard}
        />
      ))}

      {/* ADD LIST */}
      <div className="w-72 flex-shrink-0 bg-gray-100 rounded-xl p-4 h-fit">
        <input
          type="text"
          placeholder="New list title"
          className="w-full p-2 border rounded-lg mb-2"
          value={newListTitle}
          onChange={(e) => setNewListTitle(e.target.value)}
        />

        <button
          onClick={handleCreateList}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
        >
          + Add List
        </button>
      </div>

    </div>

    {/* ACTIVITY LOG */}
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-900">Activity</p>
        <button
          type="button"
          onClick={() => setActivity([])}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Clear
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
        {activity.length === 0 ? (
          <p className="text-sm text-gray-500">
            No activity yet. Actions will appear here in real time.
          </p>
        ) : (
          activity
            .slice()
            .reverse()
            .map((a) => (
              <div key={a.id} className="flex gap-3 items-start">
                <span className="text-xs text-gray-400 whitespace-nowrap mt-0.5">
                  {formatActivityTime(a.at)}
                </span>
                <span className="text-sm text-gray-800 leading-snug">
                  {a.text}
                </span>
              </div>
            ))
        )}
      </div>
    </div>

  </div>
);
}