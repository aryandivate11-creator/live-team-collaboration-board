/** Normalize member.user whether it is an ObjectId or a populated { _id, ... } subdoc. */
const memberUserIdString = (member) => {
    const u = member?.user;
    if (u == null) return null;
    if (typeof u === "object" && u._id != null) return u._id.toString();
    return u.toString();
};

const ownerIdString = (board) => {
    const o = board?.owner;
    if (o == null) return null;
    if (typeof o === "object" && o._id != null) return o._id.toString();
    return o.toString();
};

export const hasPermission = (board, userId, allowedRoles) => {
    const uid = userId?.toString?.() ?? String(userId);
    const ownerId = ownerIdString(board);

    // Board owner can always perform board-scoped actions (even if members[] is empty/out of sync)
    if (ownerId != null && ownerId === uid) {
        return true;
    }

    const members = Array.isArray(board?.members) ? board.members : [];
    const member = members.find((m) => memberUserIdString(m) === uid);

    if (!member) return false;

    const role = member.role || "member";
    return allowedRoles.includes(role);
};