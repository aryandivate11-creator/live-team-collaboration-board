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
    
    req.app.get("io").to(list.board).emit("card:created",{
        card: {
        id: card._id,
        title: card.title,
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
    })
    return res.status(200).json(
        new ApiResponse(201,card,"Card created successfully")
    );
});

export const moveCard = asyncHandler(async(req,res) =>{

    const { cardId, sourceListId, destinationListId, newPosition } = req.body;
    
    const card = Card.findById(cardId);
    
    const list = List.findById(card.list);

    if(!card){
        throw new ApiError(404,"Card not found")
    };

    const sourceList = await List.findById(sourceListId);
    const destinationList = await List.findById(destinationListId);
    
    if (!sourceList || !destinationList) {
        throw new ApiError(404, "List not found");
    }

    // ✅ Ensure both lists belong to same board
    if (sourceList.board.toString() !== destinationList.board.toString()) {
        throw new ApiError(400, "Cannot move card across different boards");
    }

    if(sourceListId === destinationListId){
        await Card.updateMany(
            {
                list: sourceListId,
                position: {$gte:newPosition}
            },
            { $inc : {position: 1}}
        );

    }
    else{
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

    card.list = destinationListId;
    card.position = newPosition;
    
    req.app.get("io").to(destinationList.board.toString()).emit("card:moved",{
        card: {
        id: card._id
    },
    from: {
        listId: sourceListId,
        position: card.position
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
})
    await card.save();

    return res.status(200).json(
        new ApiResponse(200, card, "Card moved successfully")
    );
});

export const deleteCard = asyncHandler(async(req,res) => {

    const { cardId } = req.params;

    const card = await Card.findById(cardId);
    
    const list = await List.findById(card.list);

    if(!card){
        throw new ApiError(404 ,"Card not found")
    };

    await Card.updateMany(
        {
            list: card.list,
            position: { $gt : card.position}
        },
        { $inc : { position : -1 } }
    );
    
    await card.deleteOne();
    
    req.app.get("io").to(list.board.toString).emit("card:deleted",{
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
