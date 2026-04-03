const BoardCard = ({ title, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer"
    >
      <h2 className="text-gray-800 font-medium text-lg">
        {title}
      </h2>
    </div>
  );
}

export default BoardCard;