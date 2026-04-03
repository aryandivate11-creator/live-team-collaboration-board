import { createAPI } from "./http";

const API = createAPI("http://localhost:5000/api/users");

export const searchUsers = async (query) => {
  try {
    const res = await API.get(`/search?search=${query}`);
    return res.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Search failed"
    );
  }
};