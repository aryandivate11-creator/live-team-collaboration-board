import mongoose from "mongoose";

const boardSchema = new mongoose.Schema(
{
    title: {
        type: String,
        required: true,
        trim: true
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    members: [
        {
      user: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
      },
      role: {
         type: String,
         enum: ["owner", "admin", "member", "viewer"],
         default: "member"
      }
   }
    ]
},
{
    timestamps: true
});

const Board = mongoose.model("Board", boardSchema);

export default Board;