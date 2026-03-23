import List from "../models/list.model.js";
import Board from "../models/board.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Card from "../models/card.model.js";

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

    if(!board.members.some(m =>m.toString() === req.user._id.toString())){
        throw new ApiError(403,"Access denied");
    };

    const listCount = await List.countDocuments({board : boardId});

    const list = await List.create({
        title:cleanedTitle,
        board:boardId,
        position: listCount + 1
    });

    return res.status(201).json(
        new ApiResponse(201 , list , "list created successfully")
    );
});

export const getLists = asyncHandler(async (req,res) =>{

    const { boardId } = req.params;

    const lists = await List.find({board:boardId}).sort({position:1});

    return res.status(200).json(
        new ApiResponse(200,lists,"Lists fetched successfully")
    );
});

export const deleteList = asyncHandler(async(req , res) =>{

    const { listId } = req.params;
    
    const list = await List.findById(listId);

    if(!list){
        throw new ApiError(404,"List not found")
    };

    await Card.deleteMany({ list : listId});

    await List.updateMany(
        {
            board : list.board,
            position : {$gt: list.position}
        },
        { $inc:{ position: -1 } }
    );

    await list.deleteOne();

    return res.status(200).json(
        new ApiResponse(200,{},"List deleted successfully")
    );
});