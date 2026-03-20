import mongoose, { Mongoose } from "mongoose";

const cardSchema = new mongoose.Schema(
    {
     title:{
        type:String,
        required:true,
        trim:true
     },
     description:{
        type:String,
        default:""
     },
     list:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"List",
        required:true 
     },
     position:{
        type:Number,
        required:true
     },
     assignedUsers:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
     ]
    },
    {
        timestamps:true
    }
);

const Card = mongoose.model("Card",cardSchema);

export default Card;