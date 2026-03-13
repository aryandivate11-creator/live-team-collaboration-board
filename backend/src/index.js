import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./config/db.js";

dotenv.config({
    path:"./.env"
})

const PORT = process.env.PORT || 8000

connectDB()
.then(() =>{
    app.listen(PORT , () =>{
        console.log(`Server is running on http://localhost:${PORT}`)
    });
})
.catch((error) =>{
   console.log("SERVER  NOT STARTED")
})

app.get('/',(req,res) =>{
  res.send("<h1>Real-time Collabration Board </h1>");
});