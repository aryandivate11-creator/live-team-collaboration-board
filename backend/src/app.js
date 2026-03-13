import express from "express";
import User from "./models/user.model.js";

export const app = express();

app.get("/health", (req, res) => {
  res.json({ status: "Server is running" });
});

app.get("/test-user",async (req,res) =>{
      const user = await User.create({
         name: "Test User",
        email: "test@gmail.com",
        password: "123456"
      });

      res.json(user);
});