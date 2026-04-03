import { useState } from "react";
import CardItem from "./CardItem";
import { deleteCard } from "../services/cardService";
import { deleteList } from "../services/listService";

export default function ListColumn({ list, onCreateCard }) {
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardDescription, setNewCardDescription] = useState("");
  const [adding, setAdding] = useState(false);

  const handleDeleteCard = async (cardId) =>{
      try {
        await deleteCard(cardId);
        // ❌ DO NOT update state here (socket will handle)
      } catch (err) {
        alert(err.message);
      };
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
  }
};
  return (
    <div className="bg-white/60 rounded-2xl p-4 w-80 flex-shrink-0 min-h-[420px] border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <h3 className="font-semibold text-gray-800">{list.title}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {(list.cards || []).length}
          </span>
        </div>
        <button
          onClick={() => handleDeleteList(list._id)}
          className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500"
          title="List options"
        >
          ⋯
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {list.cards?.map((card) => (
          <CardItem 
            key={card._id} 
            title={card.title} 
            description={card.description}
            onDelete={() => handleDeleteCard(card._id)} 
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
                onClick={() => {
                  if (!newCardTitle.trim()) return;
                  onCreateCard(list._id, newCardTitle.trim(), newCardDescription.trim());
                  setNewCardTitle("");
                  setNewCardDescription("");
                  setAdding(false);
                }}
                className="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Add card
              </button>
              <button
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