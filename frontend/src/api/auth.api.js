import axiosClient from "./axiosClient";

// Every call returns response.data.data (the payload), unwrapped from the
// backend's { statusCode, data, message, success } envelope.

export const registerUser = async (formData) => {
  // formData must be a FormData instance: username, email, fullName,
  // password, avatar (file, required), coverImage (file, optional)
  const res = await axiosClient.post("/users/register", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
};

export const loginUser = async ({ email, password }) => {
  const res = await axiosClient.post("/users/login", { email, password });
  return res.data.data; // { accessToken, refreshToken, loggedInUser }
};

export const logoutUser = async () => {
  const res = await axiosClient.post("/users/logout");
  return res.data.data;
};

export const getCurrentUser = async () => {
  const res = await axiosClient.get("/users/current-user");
  return res.data.data;
};

export const changeCurrentPassword = async ({
  currentPassword,
  newPassword,
}) => {
  const res = await axiosClient.post("/users/change-password", {
    currentPassword,
    newPassword,
  });
  return res.data.data;
};

export const updateAccountDetails = async ({ fullName, email }) => {
  const res = await axiosClient.patch("/users/account-details", {
    fullName,
    email,
  });
  return res.data.data;
};
