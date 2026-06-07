import { axiosInstance } from "./axios";

export const signup = async (signupData) => {
  const fallbackUsername = (signupData.email || signupData.fullName || "user")
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 18);

  const response = await axiosInstance.post("/auth/register", {
    ...signupData,
    username: signupData.username || fallbackUsername || "user",
  });
  return response.data;
};

export const login = async (loginData) => {
  const response = await axiosInstance.post("/auth/login", loginData);
  return response.data;
};
export const logout = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};



export const uploadProfilePicture = async (file) => {
  const formData = new FormData();
  formData.append("profilePic", file);

  const response = await axiosInstance.post("/auth/upload-profile-picture", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get("/auth/me", {
      validateStatus: () => true, // Don't throw on any status code
    });
    if (res.status === 401) {
      return null; // Silently return null for 401
    }
    if (res.status === 200) {
      return res.data;
    }
    console.error("Unexpected status from auth/me:", res.status);
    return null;
  } catch (error) {
    // Log only non-401 errors
    if (error.response?.status !== 401) {
      console.error("Error in getAuthUser:", error.message);
    }
    return null;
  }
};

export const completeOnboarding = async (userData) => {
  const response = await axiosInstance.post("/auth/onboarding", userData);
  return response.data;
};

export async function getUserFriends() {
  const response = await axiosInstance.get("/users/friends");
  return response.data;
}

export async function getMyProfile() {
  const response = await axiosInstance.get("/users/me");
  return response.data;
}

export async function updateMyProfile(profileData) {
  const response = await axiosInstance.put("/users/me", profileData);
  return response.data;
}

export async function deactivateMyAccount() {
  const response = await axiosInstance.patch("/users/me/deactivate");
  return response.data;
}

export async function deleteMyAccount() {
  const response = await axiosInstance.delete("/users/me");
  return response.data;
}

export async function getRecommendedUsers() {
  const response = await axiosInstance.get("/users");
  return response.data;
}

export async function getOutgoingFriendReqs() {
  const response = await axiosInstance.get("/users/outgoing-friend-requests");
  return response.data;
}

export async function sendFriendRequest(userId) {
  const response = await axiosInstance.post(`/users/friend-request/${userId}`);
  return response.data;
}

export async function getFriendRequests() {
  const response = await axiosInstance.get("/users/friend-requests");
  return response.data;
}

export async function acceptFriendRequest(requestId) {
  const response = await axiosInstance.put(`/users/friend-request/${requestId}/accept`);
  return response.data;
}

export async function getStreamToken() {
  const response = await axiosInstance.get("/chat/token");
  return response.data;
}
