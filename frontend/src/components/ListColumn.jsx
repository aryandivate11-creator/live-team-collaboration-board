import { useEffect, useRef, useState } from "react";
import CardItem from "./CardItem";
import { deleteCard } from "../services/cardService";
import { deleteList } from "../services/listService";

export default function ListColumn({
  list,
  onCreateCard,
  onUpdateCard,
  boardMembers = [],
  onAssignMember,
  onUnassignMember,
  canDragCards = false,
  onMoveCard
}) {
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardDescription, setNewCardDescription] = useState("");
  const [adding, setAdding] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;

    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const handleDeleteCard = async (cardId) => {
    try {
      await deleteCard(cardId);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteList = async (listId) => {
    if (!listId) {
      alert("List ID is missing!");
      return;
    }
    try {
      await deleteList(listId);
    } catch (err) {
      alert(err.message);
    } finally {
      setMenuOpen(false);
    }
  };

  const confirmDeleteList = () => {
    if (
      window.confirm(
        "Delete this list and all its cards? This cannot be undone."
      )
    ) {
      handleDeleteList(list._id);
    }
  };

  return (
    <div
      className={`bg-white/60 rounded-2xl p-4 w-80 flex-shrink-0 min-h-[420px] border ${
        dragOver ? "border-indigo-400 ring-2 ring-indigo-200" : "border-gray-100"
      }`}
      onDragOver={(e) => {
        if (!canDragCards) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        if (!canDragCards) return;
        e.preventDefault();
        setDragOver(false);
        onMoveCard?.(e, {
          destinationListId: String(list._id),
          destinationIndex: (list.cards || []).length
        });
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
          <h3 className="font-semibold text-gray-800 truncate">{list.title}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex-shrink-0">
            {(list.cards || []).length}
          </span>
        </div>
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500"
            title="List options"
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  confirmDeleteList();
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Delete list…
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {list.cards?.map((card) => (
          <CardItem
            key={String(card._id || card.id)}
            card={card}
            listId={list._id}
            boardMembers={boardMembers}
            onDelete={handleDeleteCard}
            onUpdate={onUpdateCard}
            onAssignMember={onAssignMember}
            onUnassignMember={onUnassignMember}
            canDrag={canDragCards}
            onDragStartCard={onMoveCard}
          />
        ))}
      </div>

      <div className="mt-4">
        {adding ? (
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
            <input
              type="text"
              placeholder="Card title"
              className="w-full p-2 border rounded-lg mb-2"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              autoFocus
            />
            <textarea
              placeholder="Description (optional)"
              className="w-full p-2 border rounded-lg mb-2 text-sm"
              rows="2"
              value={newCardDescription}
              onChange={(e) => setNewCardDescription(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!newCardTitle.trim()) return;
                  onCreateCard(
                    list._id,
                    newCardTitle.trim(),
                    newCardDescription.trim()
                  );
                  setNewCardTitle("");
                  setNewCardDescription("");
                  setAdding(false);
                }}
                className="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Add card
              </button>
              <button
                type="button"
                className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50"
                onClick={() => {
                  setAdding(false);
                  setNewCardTitle("");
                  setNewCardDescription("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="w-full text-left text-sm text-gray-600 px-3 py-2 rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-400 bg-gray-50"
          >
            + Add a card
          </button>
        )}
      </div>
    </div>
  );
}
