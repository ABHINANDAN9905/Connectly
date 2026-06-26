import express from "express";
import {
  createGroup,
  getGroups,
  addMember,
  removeMember,
  deleteGroup,
} from "../Controller/group.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Create a new group
router.post("/create", protectRoute, createGroup);

// Get all groups of logged-in user
router.get("/", protectRoute, getGroups);

// Add member to group (Admin only)
router.post("/:groupId/add-member", protectRoute, addMember);

// Remove member from group
router.post("/:groupId/remove-member", protectRoute, removeMember);

// Delete group (Admin only)
router.delete("/:groupId", protectRoute, deleteGroup);

export default router;