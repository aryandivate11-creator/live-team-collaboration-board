import { io } from "socket.io-client";

// 🔑 paste token from Postman login
const accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OWM0YmYzODFlZmNmY2YxNjExMzdkMmUiLCJlbWFpbCI6InZhaXNodUBlZHUuaW4iLCJpYXQiOjE3NzQ1MjU2MzEsImV4cCI6MTc3NDUyNzQzMX0.jBNHVFCsLinJG3VSIy1NdGLu3n-shlkcGvCRd0dDYCY";

// 🔌 connect to server
const socket = io("http://localhost:8000", {
    auth: {
        token: accessToken
    }
});

// ✅ connection success
socket.on("connect", () => {
    console.log("Connected:", socket.id);

    const boardId = "69c4c02e1efcfcf161137d34";

    // join board
    socket.emit("joinBoard", boardId);
});

// ❌ auth error
socket.on("connect_error", (err) => {
    console.log("Connection Error:", err.message);
});

// 👇 listen to events

// ================= CARDS =================
socket.on("card:created", (data) => {
    console.log("Card Created:", data);
});

socket.on("card:moved", (data) => {
    console.log("Card Moved:", data);
});

socket.on("card:updated", (data) => {
console.log(JSON.stringify(data, null, 2));
});

socket.on("card:deleted", (data) => {
    console.log("Card Deleted:", data);
});


// ================= LISTS =================
socket.on("list:created", (data) => {
    console.log("List Created:", data);
});

socket.on("list:updated", (data) => {
    console.log("List Updated:", data);
});

socket.on("list:deleted", (data) => {
    console.log("List Deleted:", data);
});


// ================= BOARDS =================
socket.on("board:updated", (data) => {
    console.log("Board Updated:", data);
});


// ================= MEMBERS =================
socket.on("member:added", (data) => {
    console.log("Member Added:", data);
});

socket.on("member:removed", (data) => {
    console.log("Member Removed:", data);
});

socket.on("member:roleUpdated", (data) => {
    console.log("Member Role Updated:", data);
});

socket.on("card:unassigned", (data) => {
    console.log("Member removed from card:", data);
});