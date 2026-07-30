import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // required: backend auth relies on httpOnly cookies
});

// --- Refresh-token flow ---
// When an access-token expires, the backend returns 401. We hit
// /users/refresh-token once, then retry the original request.
// A queue prevents multiple simultaneous requests from each firing
// their own refresh call.

let isRefreshing = false;
let pendingQueue = [];

const processQueue = (error) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  pendingQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isAuthRoute =
      originalRequest.url?.includes("/users/login") ||
      originalRequest.url?.includes("/users/refresh-token");

    if (status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        // Wait for the in-flight refresh to finish, then retry.
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then(() => axiosClient(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axiosClient.post("/users/refresh-token");
        processQueue(null);
        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Refresh failed too -> the session is truly dead.
        // Let calling code (AuthContext) decide what to do (e.g. redirect to /login).
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
