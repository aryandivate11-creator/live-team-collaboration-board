import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Board from "../models/board.model.js";

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
        members: [req.user._id] // owner is also a member
    });

    return res.status(201).json(
        new ApiResponse(201, board, "Board created successfully")
    );
});

export const getBoards = asyncHandler(async (req,res) =>{
    const boards = await Board.find({
        members: req.user._id
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200,boards,"Boards fetched successfully")
    );
});

export const getBoardById = asyncHandler(async(req ,res) =>{
    const{ boardId } = req.params;

    const board = await Board.findById(boardId)

    if(!board){
        throw new ApiError(404,"Board not found");
    };

    if(!board.members.includes(req.user._id)){
        throw new ApiError(403,"Access denied");
    };

    return res
    .status(200)
    .json(
        new ApiResponse(200,board,"Board fetched successfully")
    );
});

export const deleteBoard = asyncHandler(async(req,res) =>{

    const { boardId } = req.params;
    
    const board = await Board.findById(boardId);

    if(!board){
        throw new ApiError(404,"Board not found");
    };

    if(board.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403,"Only owner can delete this boaard");
    };

    await board.deleteOne();

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Board deleted successfully")
    )
})