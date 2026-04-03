import { useEffect, useState } from "react";

export default function CardItem({ card, onDelete, onUpdate }) {
  const cardId = card._id || card.id;
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(card.title || "");
  const [description, setDescription] = useState(card.description || "");

  useEffect(() => {
    setTitle(card.title || "");
    setDescription(card.description || "");
  }, [card.title, card.description]);

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

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
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

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-gray-500">
          <span className="text-xs">💬 3</span>
          <span className="text-xs">📎 2</span>
        </div>
        <button
          type="button"
          onClick={() => onDelete(cardId)}
          className="text-red-500 text-xs hover:text-red-700"
          title="Delete card"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
