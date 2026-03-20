import mongoose from "mongoose";

const listSchema = new mongoose.Schema(
    {
      title:{
        type:String,
        required:true,
        trime:true
      },
      board:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Board",
        required:true
      },
      position:{
        type:Number,
        required:true
      }
    },
    {
        timestamps:true
    }
);

const List =  mongoose.model("List",listSchema);

export default List;