import { createAPI } from "./http";

const API = createAPI("http://localhost:4000/api/boards");

// ================= GET BOARDS =================
export const getBoards = async () => {
  try {
    const res = await API.get("/");
    return res.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Failed to fetch boards"
    );
  }
};

// ================= CREATE BOARD =================
export const createBoard = async (data) => {
  try {
    const res = await API.post("/", data);
    return res.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Failed to create board"
    );
  }
};

export const deleteBoard = async (boardId) => {
  try {
    const res = await API.delete(`/${boardId}`);
    return res.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Failed to delete board"
    );
  }
};

export const updateBoard = async (boardId , data) =>{
     try {
       const res = await API.patch(`/${boardId}`,data);
       return res.data;
     } catch (err) {
        throw new Error(
          err.response?.data?.message || "Failed to update board"
        );
     }
};

export const getBoardById = async (boardId) => {
  try {
    const res = await API.get(`/${boardId}`);
    return res.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Failed to fetch board details"
    );
  }
};

export const addMember = async (boardId, data) => {
  try {
    const res = await API.post(`/${boardId}/members`, data);
    return res.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Failed to add member"
    );
  }
};

export const removeMember = async (boardId, userId) => {
  try {
    const res = await API.delete(`/${boardId}/members/${userId}`);
    return res.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Failed to remove member"
    );
  }
};

export const updateMemberRole = async (boardId, userId, role) => {
  try {
    const res = await API.patch(`/${boardId}/members/${userId}`, { role });
    return res.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Failed to update member role"
    );
  }
};