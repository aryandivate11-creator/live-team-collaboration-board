import express from "express";
import User from "./models/user.model.js";
import errorHandler from "./middlewares/error.middleware.js";
import authRoutes from "./routes/auth.routes.js"

export const app = express();

app.use(express.json());

app.use("/api/auth",authRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "Server is running" });
});

app.use(errorHandler);