import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ListColumn from "../components/ListColumn";
import { getLists } from "../services/listService";
import { createList } from "../services/listService";
import {connectSocket , getSocket} from "../sockets/socket.js";
import { getCards , createCard} from "../services/cardService";
import { deleteBoard, getBoardById } from "../services/boardService";
import { useNavigate } from "react-router-dom";
import { updateBoard } from "../services/boardService";
import { searchUsers } from "../services/userService";
import { addMember, removeMember } from "../services/boardService";
import { getInitials } from "../utils/user";


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
  
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const [listsRes, boardRes] = await Promise.all([getLists(id), getBoardById(id)]);

        const listsWithCards = await Promise.all(
          listsRes.data.map(async (list) => {
            const cardsRes = await getCards(list._id);

            return {
              ...list,
              cards: cardsRes.data.cards || []
            };
          })
        );

        setLists(listsWithCards);
        setTitle(boardRes.data.title || "Board");
        setMembers(boardRes.data.members || []);
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

useEffect(() => {
  const socket = getSocket();

  if (!socket) return; hj

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
    setLists((prevLists) =>
      prevLists.map((list) =>
        list._id === data.card.listId
          ? {
              ...list,
              cards: [...(list.cards || []), data.card]
            }
          : list
      )
    );
  });

  // ================= CARD DELETED =================
  socket.on("card:deleted", (data) => {
    setLists((prevLists) =>
      prevLists.map((list) =>
        list._id === data.card.listId
          ? {
              ...list,
              cards: list.cards.filter(c => c._id !== data.card.id)
            }
          : list
      )
    );
  });

  // ================= LIST CREATED =================
  socket.on("list:created", (data) => {
    setLists((prev) => [...prev,  {
    ...data.list,
    _id: data.list._id || data.list.id // 🔥 normalize here
  }]);
  });

  // ================= LIST DELETED =================
  socket.on("list:deleted", (data) => {
    setLists((prev) =>
      prev.filter((l) => l._id !== data.list.id)
    );
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
  });

  socket.on("member:removed", (data) => {
    setMembers((prev) =>
      prev.filter((m) => String(m.user?._id || m.user?.id) !== String(data.member.user.id))
    );
  });

  return () => {
    socket.off("card:created");
    socket.off("card:deleted");
    socket.off("list:created");
    socket.off("list:deleted");
    socket.off("member:added");
    socket.off("member:removed");
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddMemberModal(true)}
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
        </div>

        {/* Add Member Modal */}
        {showAddMemberModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Add Member</h3>
                <button
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setSearch("");
                    setResults([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Search Input */}
              <input
                type="text"
                placeholder="Search users by name or email"
                className="w-full border px-4 py-2 rounded-lg text-sm mb-3"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />

              {searchError && (
                <p className="text-xs text-red-500 mb-2">{searchError}</p>
              )}

              {/* Search Results */}
              {results.length > 0 && (
                <div className="max-h-60 overflow-y-auto border rounded-lg">
                  {results.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => handleAddMember(user._id)}
                      className="w-full p-3 hover:bg-gray-50 text-left text-sm border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                    >
                      <div className="h-8 w-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-semibold">
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <span className="block font-medium text-gray-800">{user.name}</span>
                        <span className="block text-xs text-gray-500">{user.email}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {search.trim() && results.length === 0 && !searchError && (
                <p className="text-sm text-gray-500 text-center py-4">No users found</p>
              )}

              {/* Close Button */}
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setSearch("");
                  setResults([]);
                }}
                className="w-full mt-4 px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

      </div>
    </div>

    {/* LISTS */}
    <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">

      {lists.map((list) => (
        <ListColumn
          key={list._id}
          list={list}
          onCreateCard={handleCreateCard}
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

  </div>
);
}