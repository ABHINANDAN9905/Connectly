import express from "express";

import {
  acceptFriendRequest,
  deactivateMyAccount,
  deleteMyAccount,
  getFriendRequests,
  getMyFriends,
  getMyProfile,
  getOutgoingFriendReqs,
  getRecommendedUsers,
  getUserById,
  searchUsers,
  sendFriendRequest,
  updateMyProfile,
} from "../Controller/user.controller.js";

import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Protect all user routes
|--------------------------------------------------------------------------
*/

router.use(protectRoute);

/*
|--------------------------------------------------------------------------
| My Profile
|--------------------------------------------------------------------------
*/

router.get("/me", getMyProfile);

router.put("/me", updateMyProfile);

router.patch("/me/deactivate", deactivateMyAccount);

router.delete("/me", deleteMyAccount);

/*
|--------------------------------------------------------------------------
| Friends
|--------------------------------------------------------------------------
*/

router.get("/friends", getMyFriends);

/*
|--------------------------------------------------------------------------
| Friend Requests
|--------------------------------------------------------------------------
*/

router.post("/friend-request/:id", sendFriendRequest);

router.put(
  "/friend-request/:id/accept",
  acceptFriendRequest
);

router.get("/friend-requests", getFriendRequests);

router.get(
  "/outgoing-friend-requests",
  getOutgoingFriendReqs
);

/*
|--------------------------------------------------------------------------
| Search Students
|--------------------------------------------------------------------------
| IMPORTANT:
| This route must come BEFORE "/:id"
|--------------------------------------------------------------------------
*/

router.get("/search", searchUsers);

/*
|--------------------------------------------------------------------------
| Recommended Students
|--------------------------------------------------------------------------
*/

router.get("/", getRecommendedUsers);

/*
|--------------------------------------------------------------------------
| Get Specific Student
|--------------------------------------------------------------------------
| IMPORTANT:
| Keep this route at the end because "/:id" is dynamic.
|--------------------------------------------------------------------------
*/

router.get("/:id", getUserById);

export default router;