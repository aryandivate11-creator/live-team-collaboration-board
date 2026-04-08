import { createAPI } from "./http";

const API = createAPI("http://localhost:4000/api/cards");

// ================= GET CARDS =================
export const getCards = async (listId, params = {}) => {
  try {
    const res = await API.get(`/list/${listId}`, {
      params: { limit: 200, ...params }
    });
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

export const unassignUserFromCard = async (cardId, userId) => {
  try {
    const res = await API.patch(`/${cardId}/unassign`, { userId });
    return res.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Failed to unassign user"
    );
  }
};

export const moveCard = async ({ cardId, sourceListId, destinationListId, newPosition }) => {
  try {
    const res = await API.patch("/move", {
      cardId,
      sourceListId,
      destinationListId,
      newPosition
    });
    return res.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Failed to move card"
    );
  }
};