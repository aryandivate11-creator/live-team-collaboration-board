import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/auth",
  withCredentials: true // important for cookies (refresh token)
});

// ================= SIGNUP =================
export const signupUser = async (data) => {
  try {
    const res = await API.post("/register", data);
    return res.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Signup failed"
    );
  }
};

// ================= LOGIN =================
export const loginUser = async (data) => {
  try {
    const res = await API.post("/login", data);
    return res.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Login failed"
    );
  }
};

// ================= LOGOUT =================
export const logoutUser = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await API.post(
      "/logout",
      {},
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }
    );
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Logout failed");
  }
};