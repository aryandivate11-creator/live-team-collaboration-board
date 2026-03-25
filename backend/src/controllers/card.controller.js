import Card from "../models/card.model.js";
import List from "../models/list.model.js";
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
        throw new ApiError(404, "List not found");
    }

    // ✅ Same board validation
    if (sourceList.board.toString() !== destinationList.board.toString()) {
        throw new ApiError(400, "Cannot move card across different boards");
    }

    // ✅ Permission check
    const board = await Board.findById(sourceList.board);
    const allowed = hasPermission(board, req.user._id, ["owner", "admin", "member"]);

    if (!allowed) {
        throw new ApiError(403, "Not allowed to move card");
    }

    if(sourceListId === destinationListId){
        await Card.updateMany(
            {
                list: sourceListId,
                position: {$gte:newPosition}
            },
            { $inc : {position: 1}}
        );

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
            id: card._id
        },
        from: {
            listId: sourceListId,
            position: oldPosition
        },
        to: {
            listId: destinationListId,
            position: newPosition
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
    const allowed = hasPermission(board, req.user._id, ["owner", "admin"]);

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

    const card = await Card.findById(cardId);

    if (!card) throw new ApiError(404, "Card not found");

    const list = await List.findById(card.list);

    // ✅ Permission check
    const board = await Board.findById(list.board);
    const allowed = hasPermission(board, req.user._id, ["owner", "admin", "member"]);

    if (!allowed) {
        throw new ApiError(403, "Not allowed to update card");
    }

    if (title) card.title = title;
    if (description) card.description = description;
    if (assignedUsers) card.assignedUsers = assignedUsers;

    await card.save();

    req.app.get("io").to(list.board.toString()).emit("card:updated", {
        card: {
            id: card._id,
            title: card.title,
            description: card.description,
            assignedUsers: card.assignedUsers
        },
        action: "updated",
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