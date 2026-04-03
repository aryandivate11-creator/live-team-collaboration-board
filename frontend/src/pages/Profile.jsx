import { getInitials, getStoredUser } from "../utils/user";

export default function Profile() {
  const user = getStoredUser();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
            {getInitials(user?.name || user?.email)}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user?.name || "Your Profile"}
            </h2>
            <p className="text-sm text-gray-500">{user?.email || ""}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">User ID</p>
            <p className="text-sm font-medium text-gray-900 break-all">
              {user?._id || "—"}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">Phone</p>
            <p className="text-sm font-medium text-gray-900">
              {user?.phone || "—"}
            </p>
          </div>
        </div>

        {!user && (
          <p className="mt-4 text-sm text-red-600">
            No user info found. Please log in again.
          </p>
        )}
      </div>
    </div>
  );
}

