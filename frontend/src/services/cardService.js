import { createAPI } from "./http";

const API = createAPI("http://localhost:5000/api/cards");

// ================= GET CARDS =================
export const getCards = async (listId) => {
  try {
    const res = await API.get(`/list/${listId}`);
    return res.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Failed to fetch cards"
    );
  }
};

export const createCard = async (data) => {
  try {
    const res = await API.post("/", data);
    return res.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Failed to create card"
    );
  }
};

export const deleteCard = async (cardId) => {
  try {
    const res = await API.delete(`/${cardId}`);
    return res.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Failed to delete card"
    );
  }
};

export const updateCard = async (cardId,data) =>{
  try {
    const res = await API.patch(`/${cardId}`,data);
    return res.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Failed to update card"
    );
  }
};