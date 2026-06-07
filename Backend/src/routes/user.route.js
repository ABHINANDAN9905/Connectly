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
  sendFriendRequest,
  updateMyProfile,
} from "../Controller/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.get("/me", getMyProfile);


router.put("/me", updateMyProfile);
router.patch("/me/deactivate", deactivateMyAccount);
router.delete("/me", deleteMyAccount);

router.get("/", getRecommendedUsers);
router.get("/friends", getMyFriends);

router.post("/friend-request/:id", sendFriendRequest);
router.put("/friend-request/:id/accept", acceptFriendRequest);

router.get("/friend-requests", getFriendRequests);
router.get("/outgoing-friend-requests", getOutgoingFriendReqs);

export default router;
