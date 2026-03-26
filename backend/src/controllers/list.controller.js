import List from "../models/list.model.js";
import Board from "../models/board.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Card from "../models/card.model.js";
import { hasPermission } from "../utils/permissions.js";


// ================= CREATE LIST =================
export const createList = asyncHandler(async (req,res) =>{
    
    const {title , boardId} = req.body;

    const cleanedTitle = title?.trim();

    if(!cleanedTitle || !boardId){
        throw new ApiError(400 ,"Title and boardId are required");
    };

    const board = await Board.findById(boardId);

    if(!board){
        throw new ApiError(404,"Board not found");
    };

    // ✅ Permission check
    const allowed = hasPermission(board, req.user._id, ["owner", "admin"]);

    if(!allowed){
        throw new ApiError(403,"Not allowed to create list");
    };

    const listCount = await List.countDocuments({board : boardId});

    const list = await List.create({
        title:cleanedTitle,
        board:boardId,
        position: listCount + 1
    });
    
    req.app.get("io").to(boardId).emit("list:created", {
        list: {
            id: list._id,
            title: list.title,
            position: list.position
        },
        action: "created",
        user: {
            id: req.user._id,
            name: req.user.name
        },
        timestamp: Date.now()
    });

    return res.status(201).json(
        new ApiResponse(201 , list , "list created successfully")
    );
});


// ================= GET LISTS =================
export const getLists = asyncHandler(async (req,res) =>{

    const { boardId } = req.params;

    const board = await Board.findById(boardId);

    if (!board) {
        throw new ApiError(404, "Board not found");
    }

    // ✅ Permission check (all roles allowed)
    const allowed = hasPermission(board, req.user._id, ["owner", "admin", "member", "viewer"]);

    if (!allowed) {
        throw new ApiError(403, "Not allowed to view lists");
    }

    const lists = await List.find({board:boardId}).sort({position:1});

    return res.status(200).json(
        new ApiResponse(200,lists,"Lists fetched successfully")
    );
});


// ================= DELETE LIST =================
export const deleteList = asyncHandler(async(req , res) =>{

    const { listId } = req.params;
    
    const list = await List.findById(listId);

    if(!list){
        throw new ApiError(404,"List not found")
    };

    const board = await Board.findById(list.board);

    // ✅ Permission check
    const allowed = hasPermission(board, req.user._id, ["owner", "admin"]);

    if (!allowed) {
        throw new ApiError(403, "Not allowed to delete list");
    }

    await Card.deleteMany({ list : listId});

    await List.updateMany(
        {
            board : list.board,
            position : {$gt: list.position}
        },
        { $inc:{ position: -1 } }
    );

    await list.deleteOne();
    
    req.app.get("io").to(list.board.toString()).emit("list:deleted", {
        list: {
            id: list._id,
            title: list.title
        },
        action: "deleted",
        user: {
            id: req.user._id,
            name: req.user.name
        },
        timestamp: Date.now()
    });

    return res.status(200).json(
        new ApiResponse(200,{},"List deleted successfully")
    );
});


// ================= UPDATE LIST =================
export const updateList = asyncHandler(async (req, res) => {

    const { listId } = req.params;
    const { title } = req.body;

    const list = await List.findById(listId);

    if (!list) throw new ApiError(404, "List not found");
    
    const oldTitle = list.title;

    const board = await Board.findById(list.board);

    // ✅ Permission check
    const allowed = hasPermission(board, req.user._id, ["owner", "admin"]);

    if (!allowed) {
        throw new ApiError(403, "Not allowed to update list");
    }

    list.title = title || list.title;

    await list.save();
    
    req.app.get("io").to(list.board.toString()).emit("list:updated", {
        list: {
            id: list._id,
            newTitle: list.title,
            oldTitle: oldTitle
        },
        action: "updated",
        user: {
            id: req.user._id,
            name: req.user.name
        },
        timestamp: Date.now()
    });

    return res.status(200).json(
        new ApiResponse(200, list, "List updated")
    );
});