import express from "express";
import User from "./models/user.model.js";
import errorHandler from "./middlewares/error.middleware.js";
import authRoutes from "./routes/auth.routes.js"
import boardRoutes from "./routes/board.routes.js"
import listRoutes from "./routes/list.routes.js";
import cardRoutes from "./routes/card.routes.js";
import cookieParser from "cookie-parser"
import verifyJWT from "./middlewares/auth.middleware.js";

export const app = express();

app.use(express.json());

app.use(cookieParser());

app.use("/api/auth",authRoutes);

app.use("/api/boards",boardRoutes);

app.use("/api/lists", listRoutes);

app.use("/api/cards", cardRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "Server is running" });
});

app.get("/protected",verifyJWT,(req,res) =>{
  res.json({
    message:"Access Granted",
    user : req.user
  })
})

app.use(errorHandler);