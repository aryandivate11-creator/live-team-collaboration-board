import { io } from "socket.io-client";

let socket;

export const connectSocket = () => {
  const token = localStorage.getItem("token");

  socket = io("http://localhost:4000", {
    auth: {
      token
    }
  });

  return socket;
};

export const getSocket = () => socket;