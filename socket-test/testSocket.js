import { io } from "socket.io-client";

// 🔑 paste token from Postman login
const accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OWJhNGNiMTk3Y2ZhODJhZjE4M2IzNzYiLCJlbWFpbCI6ImFyeWFuQGVkdS5pbiIsImlhdCI6MTc3NDQxNjQ3MCwiZXhwIjoxNzc0NDE4MjcwfQ.QadrkGCokgZSD_9jH1fv8RGIwMl4XV0ZvPzMsCSfeos";

// 🔌 connect to server
const socket = io("http://localhost:8000", {
    auth: {
        token: accessToken
    }
});

// ✅ connection success
socket.on("connect", () => {
    console.log("Connected:", socket.id);

    const boardId = "69ba8e845891ec9e9f05ed4a";

    // join board
    socket.emit("joinBoard", boardId);
});

// ❌ auth error
socket.on("connect_error", (err) => {
    console.log("Connection Error:", err.message);
});

// 👇 listen to events
socket.on("card:created", (data) => {
    console.log("Card Created:", data);
});

socket.on("card:moved", (data) => {
    console.log("Card Moved:", data);
});

socket.on("card:deleted", (data) => {
    console.log("Card Deleted:", data);
});

socket.on("list:created", (data) => {
    console.log("List Created:", data);
});

socket.on("list:deleted", (data) => {
    console.log("List Deleted:", data);
});