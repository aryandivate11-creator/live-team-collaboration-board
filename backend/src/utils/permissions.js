export const hasPermission = (board, userId, allowedRoles) => {

    const member = board.members.find(
        m => m.user.toString() === userId.toString()
    );

    if (!member) return false;

    return allowedRoles.includes(member.role);
};