import Card from "../models/card.model.js";
import List from "../models/list.model.js";
import Board from "../models/board.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const createCard = asyncHandler(async (req,res) =>{

    const {title , listId} = req.body;
    
    const cleanedTitle = title.trim();

    if(!cleanedTitle || !listId){
        throw new ApiError(400,"Title and listID are required");
    };

    const list = await List.findById(listId);

    if(!list){
        throw new ApiError(404,"List not found");
    };

    const cardCount = await Card.countDocuments({ list : listId });

    const card = await Card.create({
        title : cleanedTitle,
        list : listId,
        position : cardCount + 1
    });

    return res.status(200).json(
        new ApiResponse(201,card,"Card created successfully")
    );
});

export const moveCard = asyncHandler(async(req,res) =>{

    const { cardId, sourceListId, destinationListId, newPosition } = req.body;
    
    const card = Card.findById(cardId);

    if(!card){
        throw new ApiError(404,"Card not found")
    };

    card.list = destinationListId;
    card.position = newPosition;

    await card.save;

    return res.status(200).json(
        new ApiResponse(200,card,"card moved successfully")
    );
});