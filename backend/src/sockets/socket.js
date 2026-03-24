import User from "../models/user.model";
import jwt from "jsonwebtoken";
import Board from "../models/board.model";

export const initSocket = (io) =>{

    io.use(async (socket, next) => {
      try {
         const token = socket.handshake.auth.token;

         if (!token) return next(new Error("Unauthorized"));

         const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

         const user = await User.findById(decoded._id);

         if (!user) {
            return next(new Error("Unauthorized"));
         }

         socket.user = user;
         next();

      } catch (err) {
         next(new Error("Unauthorized"));
      }
   });


    io.on("connection",(socket) =>{

        console.log("User connected :",socket.id);

        socket.on("Join Board", async (boardId) =>{

            const board = await Board.findById(boardId);

            if(!board) return ;

            const isMember = board.members.some(
                m => m.toString() === socket.user._id.toString()
            );
            
            if(!isMember) return;

            socket.join(boardId);

            console.log(`User joined board ${boardId}`);
        });

        socket.on("leaveBoard",(boardId) =>{
            socket.leave(boardId);
        });

        socket.on("disconnect",() =>{
            console.log("User disconnected",socket.id);
        });
    });
};