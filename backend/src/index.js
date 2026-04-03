// import dotenv from "dotenv";
// import { app } from "./app.js";
// import connectDB from "./config/db.js";

// dotenv.config({
//     path:"./.env"
// })

// const PORT = process.env.PORT || 8000

// connectDB()
// .then(() =>{
//     app.listen(PORT , () =>{
//         console.log(`Server is running on http://localhost:${PORT}`)
//     });
// })
// .catch((error) =>{
//    console.log("SERVER  NOT STARTED")
// })

// app.get('/',(req,res) =>{
//   res.send("<h1>Real-time Collabration Board </h1>");
// });

import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./config/db.js";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { initSocket } from "./sockets/socket.js";

dotenv.config({
    path: "./.env"
});

const PORT = process.env.PORT || 5000;

// 🔹 Create HTTP server from Express app
const server = http.createServer(app);

// 🔹 Attach Socket.IO
const io = new Server(server, {
    cors: { 
        origin: "*"
    }
});


initSocket(io);

app.set("io",io);

// 🔹 Connect DB and start server
connectDB()
.then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
})
.catch((error) => {
    console.log("SERVER NOT STARTED", error);
});  