import axios from "axios";

const AUTH_BASE = "http://localhost:5000/api/auth";

export function createAPI(baseURL) {
  const API = axios.create({
    baseURL,
    withCredentials: true
  });

  // attach token
  API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // refresh on 401 once
  let isRefreshing = false;
  let pendingQueue = [];

  const processQueue = (error, token = null) => {
    pendingQueue.forEach(({ resolve, reject, config }) => {
      if (error) {
        reject(error);
      } else {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        resolve(axios(config));
      }
    });
    pendingQueue = [];
  };

  API.interceptors.response.use(
    (res) => res,
    async (error) => {
      const originalConfig = error.config || {};
      if (error.response?.status === 401 && !originalConfig._retry) {
        originalConfig._retry = true;
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            pendingQueue.push({ resolve, reject, config: originalConfig });
          });
        }

        isRefreshing = true;
        try {
          const refreshRes = await axios.post(`${AUTH_BASE}/refresh`, {}, { withCredentials: true });
          const newToken = refreshRes?.data?.data?.accessToken || refreshRes?.data?.accessToken;
          if (newToken) {
            localStorage.setItem("token", newToken);
            processQueue(null, newToken);
            isRefreshing = false;
            originalConfig.headers = originalConfig.headers || {};
            originalConfig.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalConfig);
          }
          throw new Error("Failed to refresh token");
        } catch (e) {
          processQueue(e, null);
          isRefreshing = false;
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          return Promise.reject(e);
        }
      }
      return Promise.reject(error);
    }
  );

  return API;
}

