import Card from "../models/card.model.js";
import List from "../models/list.model.js";
import User from "../models/user.model.js";
import Board from "../models/board.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { hasPermission } from "../utils/permissions.js";

// ================= CREATE CARD =================
export const createCard = asyncHandler(async (req, res) => {

    const { title, description, listId } = req.body;

    const cleanedTitle = title?.trim();
    const cleanedDescription = description?.trim() || "";

    if (!cleanedTitle || !listId) {
        throw new ApiError(400, "Title and listID are required");
    }

    const list = await List.findById(listId);

    if (!list) {
        throw new ApiError(404, "List not found");
    }

    // ✅ Permission check
    const board = await Board.findById(list.board);
    const allowed = hasPermission(board, req.user._id, ["owner", "admin", "member"]);

    if (!allowed) {
        throw new ApiError(403, "Not allowed to create card");
    }

    const cardCount = await Card.countDocuments({ list: listId });

    const card = await Card.create({
        title: cleanedTitle,
        description: cleanedDescription,
        list: listId,
        position: cardCount + 1
    });

    req.app.get("io").to(list.board.toString()).emit("card:created", {
        card: {
            id: card._id,
            title: card.title,
            description: card.description,
            listId: card.list,
            position: card.position,
            assignedUsers: card.assignedUsers
        },
        action: "created",
        user: {
            id: req.user._id,
            name: req.user.name
        },
        timestamp: Date.now()
    });

    return res.status(201).json(
        new ApiResponse(201, card, "Card created successfully")
    );
});


// ================= MOVE CARD =================
export const moveCard = asyncHandler(async(req,res) =>{

    const { cardId, sourceListId, destinationListId, newPosition } = req.body;

    const card = await Card.findById(cardId); // ✅ FIXED (added await)

    if(!card){
        throw new ApiError(404,"Card not found")
    };

    const sourceList = await List.findById(sourceListId);
    const destinationList = await List.findById(destinationListId);

    if (!sourceList || !destinationList) {
        throw new ApiError(404, "List not found")
    };

    // ✅ Same board validation
    if (sourceList.board.toString() !== destinationList.board.toString()) {
        throw new ApiError(400, "Cannot move card across different boards")
    };

    // ✅ Permission check
    const board = await Board.findById(sourceList.board);
    const allowed = hasPermission(board, req.user._id, ["owner", "admin", "member"]);

    if (!allowed) {
        throw new ApiError(403, "Not allowed to move card")
    };

    if (sourceListId === destinationListId) {

    if (newPosition > card.position) {
        // 🔻 Moving DOWN
        await Card.updateMany(
            {
                list: sourceListId,
                position: { 
                    $gt: card.position,
                    $lte: newPosition
                }
            },
            { $inc: { position: -1 } }
        );

    } else if (newPosition < card.position) {
        // 🔺 Moving UP
        await Card.updateMany(
            {
                list: sourceListId,
                position: {
                    $gte: newPosition,
                    $lt: card.position
                }
            },
            { $inc: { position: 1 } }
        );
    }
} else {

        await Card.updateMany(
            {
                list: destinationListId,
                position: { $gte: newPosition }
            },
            { $inc: { position: 1 } }
        );

        await Card.updateMany(
            {
                list: sourceListId,
                position: { $gt: card.position }
            },
            { $inc: { position: -1} }
        );
    }

    const oldPosition = card.position;

    card.list = destinationListId;
    card.position = newPosition;

    await card.save();

    req.app.get("io").to(destinationList.board.toString()).emit("card:moved",{
        card: {
            id: card._id,
            title:card.title
        },
        from: {
            listId: sourceListId,
            position: oldPosition,
            sourceTitle: sourceList.title
        },
        to: {
            listId: destinationListId,
            position: newPosition,
            destinationTitle : destinationList.title
        },
        action: "moved",
        user: {
            id: req.user._id,
            name: req.user.name
        },
        timestamp: Date.now()
    });

    return res.status(200).json(
        new ApiResponse(200, card, "Card moved successfully")
    );
});


// ================= DELETE CARD =================
export const deleteCard = asyncHandler(async(req,res) => {

    const { cardId } = req.params;

    const card = await Card.findById(cardId);

    if(!card){
        throw new ApiError(404 ,"Card not found")
    };

    const list = await List.findById(card.list);

    // ✅ Permission check
    const board = await Board.findById(list.board);
    const allowed = hasPermission(board, req.user._id, ["owner", "admin", "member"]);

    if (!allowed) {
        throw new ApiError(403, "Not allowed to delete card");
    }

    await Card.updateMany(
        {
            list: card.list,
            position: { $gt : card.position}
        },
        { $inc : { position : -1 } }
    );

    await card.deleteOne();

    req.app.get("io").to(list.board.toString()).emit("card:deleted",{
        card: {
            id: card._id,
            title: card.title,
            listId: card.list
        },
        action: "deleted",
        user: {
            id: req.user._id,
            name: req.user.name
        },
        timestamp: Date.now()
    });

    return res.status(200).json(
        new ApiResponse(200,{},"Card deleted successfully")
    );
});


// ================= UPDATE CARD =================
export const updateCard = asyncHandler(async (req, res) => {

    const { cardId } = req.params;
    const { title, description, assignedUsers } = req.body;
    
    const hasAssign =
        assignedUsers !== undefined && assignedUsers !== null;
    if (
        title === undefined &&
        description === undefined &&
        !hasAssign
    ) {
        throw new ApiError(400, "Nothing to update");
    }

    const card = await Card.findById(cardId);
    if (!card) throw new ApiError(404, "Card not found");

    const list = await List.findById(card.list);

    // ✅ Permission check
    const board = await Board.findById(list.board);
    const allowed = hasPermission(board, req.user._id, ["owner", "admin", "member"]);

    if (!allowed) {
        throw new ApiError(403, "Not allowed to update card")
    };

    if (title !== undefined) card.title = title;
    if (description !== undefined) card.description = description;

    // ✅ Handle assigned users
    let assignedUsersData = [];

    if (assignedUsers) {
    const boardMemberIds = board.members.map(m => m.user.toString());

    // ✅ 1. Check if all users are board members
    const isValid = assignedUsers.every(
        id => boardMemberIds.includes(id)
    );

    if (!isValid) {
        throw new ApiError(400, "User must be a board member")
    };

    // ✅ 2. Remove duplicates from incoming request
    const uniqueAssignedUsers = [...new Set(assignedUsers)];

    // ✅ 3. Check if already assigned
    const alreadyAssigned = uniqueAssignedUsers.filter(id =>
        card.assignedUsers.map(u => u.toString()).includes(id)
    );

    if (alreadyAssigned.length > 0) {
        throw new ApiError(
            400,
            `User(s) already assigned: ${alreadyAssigned.join(", ")}`
        );
    }

    // ✅ 4. Assign users
    card.assignedUsers = uniqueAssignedUsers;

    // 🔥 Fetch user details
    const users = await User.find(
        { _id: { $in: uniqueAssignedUsers } },
        "name"
    );

    assignedUsersData = users.map(user => ({
        id: user._id,
        name: user.name
    }))
};

    await card.save();

    req.app.get("io").to(list.board.toString()).emit("card:updated", {
        card: {
            id: card._id,
            title: card.title,
            description: card.description,
            assignedUsers: assignedUsersData.length
                ? assignedUsersData
                : card.assignedUsers // fallback if not updated
        },
        action: assignedUsers ? "assigned" : "updated",
        user: {
            id: req.user._id,
            name: req.user.name
        },
        timestamp: Date.now()
    });

    return res.status(200).json(
        new ApiResponse(200, card, "Card updated")
    );
});

export const getCards = asyncHandler(async (req, res) => {

    const { listId } = req.params;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const cards = await Card.find({ list: listId })
        .sort({ position: 1 })
        .skip(skip)
        .limit(limit);

    const totalCards = await Card.countDocuments({ list: listId });

    return res.status(200).json(
        new ApiResponse(200, {
            cards,
            pagination: {
                total: totalCards,
                page,
                limit,
                totalPages: Math.ceil(totalCards / limit)
            }
        }, "Cards fetched successfully")
    );
});

export const unassignUser = asyncHandler(async (req, res) => {

    const { cardId } = req.params;
    const { userId } = req.body;

    if (!userId) {
        throw new ApiError(400, "User ID is required")
    };

    const card = await Card.findById(cardId);
    if (!card) throw new ApiError(404, "Card not found");

    const list = await List.findById(card.list);
    const board = await Board.findById(list.board);

    // ✅ Permission check
    const allowed = hasPermission(
        board,
        req.user._id,
        ["owner", "admin"]
    );

    if (!allowed) {
        throw new ApiError(403, "Not allowed")
    };

    // ✅ Check if user is assigned
    const isAssigned = card.assignedUsers
        .map(id => id.toString())
        .includes(userId);

    if (!isAssigned) {
        throw new ApiError(400, "User is not assigned to this card")
    };

    // ✅ Remove user
    card.assignedUsers = card.assignedUsers.filter(
        id => id.toString() !== userId
    );

    await card.save();

    // 🔥 Fetch user info (for socket payload)
    const removedUser = await User.findById(userId, "name");

    // 🔥 Emit event
    req.app.get("io").to(board._id.toString()).emit("card:unassigned", {
        card:{
            Id: card._id,
            title : card.title},
        user: {
            id: removedUser._id,
            name: removedUser.name
        },
        action: "unassigned",
        triggeredBy: {
            id: req.user._id,
            name: req.user.name
        },
        timestamp: Date.now()
    });

    return res.status(200).json(
        new ApiResponse(200, card, "User unassigned successfully")
    );
});