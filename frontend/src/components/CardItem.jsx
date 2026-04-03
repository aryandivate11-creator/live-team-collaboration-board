const CardItem = ({ title, description, onDelete }) => {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">
          RESEARCH
        </span>
      </div>

      <p className="text-sm text-gray-900 font-medium">{title}</p>

      {description && (
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{description}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-gray-500">
          <span className="text-xs">💬 3</span>
          <span className="text-xs">📎 2</span>
        </div>
        <button
          onClick={onDelete}
          className="text-red-500 text-xs hover:text-red-700"
          title="Delete card"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default CardItem;