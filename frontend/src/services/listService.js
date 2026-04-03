import { createAPI } from "./http";

const API = createAPI("http://localhost:4000/api/lists");

// ================= GET LISTS =================
export const getLists = async (boardId) => {
  try {
    const res = await API.get(`/${boardId}`);
    return res.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Failed to fetch lists"
    );
  }
};

// ================= CREATE LIST =================
export const createList = async (data) => {
  try {
    const res = await API.post("/", data);
    return res.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Failed to create list"
    );
  }
};

export const deleteList = async (listId) => {
  try {
    const res = await API.delete(`/${listId}`);
    return res.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Failed to delete list"
    );
  }
};

export const updateList = async (listId , data) =>{
  try {
    const res = await API.patch(`/${listId}`,data);
    return res.data
  } catch (err) {
      throw new Error(
        err.response?.data?.message || "Failed to update the List"
      );
  }
};

