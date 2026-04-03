import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Board from "../models/board.model.js";
import List from "../models/list.model.js";
import User from "../models/user.model.js";
import Card from "../models/card.model.js";
import { hasPermission } from "../utils/permissions.js";


// ================= CREATE BOARD =================
export const createBoard = asyncHandler(async (req, res) => {

    const { title } = req.body;

    const trimmedTitle = title?.trim();

    if(!trimmedTitle){
        throw new ApiError(400,"Board title is required")
    };

    if(trimmedTitle.length < 3 || trimmedTitle.length > 50){
        throw new ApiError(400,"Title must be between 3 and 50 characters")
    }

    const board = await Board.create({
        title: trimmedTitle,
        owner: req.user._id,
        members: [
            {
                user:req.user._id,
                role:"owner"
            }
        ]
    });

    return res.status(201).json(
        new ApiResponse(201, board, "Board created successfully")
    );
});


// ================= GET BOARDS =================
export const getBoards = asyncHandler(async (req,res) =>{

    const boards = await Board.find({
        "members.user": req.user._id   // ✅ FIXED for new schema
    });

    return res
    .status(200)
    .json(
        new ApiResponse(200,boards,"Boards fetched successfully")
    );
});


// ================= GET BOARD BY ID =================
export const getBoardById = asyncHandler(async(req ,res) =>{

    const{ boardId } = req.params;

    const board = await Board.findById(boardId)
        .populate("members.user","name email");

    if(!board){
        throw new ApiError(404,"Board not found");
    };

    // ✅ Permission check (all roles allowed)
    const allowed = hasPermission(board, req.user._id, ["owner", "admin", "member", "viewer"]);

    if(!allowed){
        throw new ApiError(403,"Access denied");
    };

    return res
    .status(200)
    .json(
        new ApiResponse(200,board,"Board fetched successfully")
    );
});


// ================= DELETE BOARD =================
export const deleteBoard = asyncHandler(async(req,res) =>{

    const { boardId } = req.params;
    
    const board = await Board.findById(boardId);

    if(!board){
        throw new ApiError(404,"Board not found");
    };

    // ✅ Only owner can delete
    if(board.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403,"Only owner can delete this board");
    };
    
    const lists = await List.find({ board : boardId });
    
    const listIds = lists.map(list=> list._id);

    await Card.deleteMany({list: { $in: listIds}});
    await List.deleteMany({board :boardId});
    await board.deleteOne();

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Board deleted successfully")
    );
});


// ================= UPDATE BOARD =================
export const updateBoard = asyncHandler(async (req, res) => {

    const { boardId } = req.params;
    const { title } = req.body;

    const board = await Board.findById(boardId);

    if (!board) throw new ApiError(404, "Board not found");

    // ✅ Only owner can update
    if (board.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only owner can update");
    }

    board.title = title || board.title;

    await board.save();
    
    req.app.get("io").to(boardId).emit("board:updated", {
        board: {
            id: board._id,
            title: board.title
        },
        action: "updated",
        user: {
            id: req.user._id,
            name: req.user.name
        },
        timestamp: Date.now()
    });

    return res.status(200).json(
        new ApiResponse(200, board, "Board updated")
    );
});

export const addMember = asyncHandler(async(req,res) =>{

    const { boardId } = req.params;
    const {userId , role} = req.body;

    const board = await Board.findById(boardId);

    if(!board){
        throw new ApiError(404,"Board not found")
    };

    const allowed = hasPermission(board,req.user._id,["owner","admin"]);
    if(!allowed) throw new ApiError(403,"Not allowed");

    const alreadyMember = board.members.find(
        m => m.user.toString() === userId
    );

    if (alreadyMember) {
        throw new ApiError(400, "User already a member");
    }
    
    const newMember = await User.findById(userId);
    if (!newMember) throw new ApiError(404, "User not found");

    const roleToAssign = role || "member";

    board.members.push({
        user: userId,
        role: role || "member"
    });

    await board.save();
    
    req.app.get("io").to(boardId).emit("member:added",{
        member: {
        user: {
            id: newMember._id,
            name: newMember.name // if populated
        },
        role: roleToAssign
    },
    action: "added",
    user: {
        id: req.user._id,
        name: req.user.name
    },
    timestamp: Date.now()
    });

    return res.status(200).json(
        new ApiResponse(200, board, "Member added")
    );

});

export const updateMemberRole = asyncHandler(async (req, res) => {

    const { boardId, userId } = req.params;
    const { role } = req.body;

    const board = await Board.findById(boardId);

    if (!board) throw new ApiError(404, "Board not found");

    // only owner can change roles
    if (board.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only owner can change roles");
    };

    if (userId === board.owner.toString()) {
    throw new ApiError(400, "Cannot change owner role");
    };
    
    const allowedRoles = ["admin", "member","viewer"];

    if (!allowedRoles.includes(role)) {
    throw new ApiError(400, "Invalid role");
    };

    const member = board.members.find(
        m => m.user.toString() === userId
    );

    if (!member) throw new ApiError(404, "Member not found");
    
    if (member.role === role) {
    throw new ApiError(400, "Role already assigned");
    };

    if (userId === req.user._id.toString()) {
    throw new ApiError(400, "Cannot change your own role");
    };
    const updatedMember = await User.findById(userId);

    member.role = role;

    await board.save();
    
    req.app.get("io").to(boardId).emit("member:roleUpdated",{
       member: {
        user: {
            id: userId,
            name: updatedMember.name
        },
        role: role
    },
    action: "roleUpdated",
    user: {
        id: req.user._id,
        name: req.user.name
    },
    timestamp: Date.now()
    });

    return res.status(200).json(
        new ApiResponse(200, board, "Role updated")
    );
});

export const removeMember = asyncHandler(async (req, res) => {

    const { boardId, userId } = req.params;

    const board = await Board.findById(boardId);

    if (!board) throw new ApiError(404, "Board not found");
    
    if (userId === board.owner.toString()) {
    throw new ApiError(400, "Cannot remove owner");
    };

    const allowed = hasPermission(board, req.user._id, ["owner", "admin"]);
    if (!allowed) throw new ApiError(403, "Not allowed");
    
    const memberExists = board.members.some(
    m => m.user.toString() === userId
    );

    if (!memberExists) {
   throw new ApiError(404, "Member not found");
   };

    board.members = board.members.filter(
        m => m.user.toString() !== userId
    );

    const removedUser = await User.findById(userId);
    await board.save();
    
    req.app.get("io").to(boardId).emit("member:removed",{
        member: {
        user: {
            id: userId,
            name : removedUser.name
        }
    },
    action: "removed",
    user: {
        id: req.user._id,
        name: req.user.name
    },
    timestamp: Date.now()
    });

    return res.status(200).json(
        new ApiResponse(200, board, "Member removed")
    );
});