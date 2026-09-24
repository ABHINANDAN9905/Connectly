import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import { upsertStreamUser } from "../lib/stream.js";

const profileFields = [
  "fullName",
  "registrationId",
  "course",
  "branch",
  "year",
  "semester",
  "skills",
  "lookingFor",
  "bio",
  "location",
  "profilePic",
];

const getProfileUpdates = (body) => {
  return profileFields.reduce((updates, field) => {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }

    return updates;
  }, {});
};

export async function getMyProfile(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error in getMyProfile:", error.message);

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

export async function updateMyProfile(req, res) {
  try {
    const updates = getProfileUpdates(req.body);

    // Full name validation
    if (
      updates.fullName !== undefined &&
      !updates.fullName.trim()
    ) {
      return res.status(400).json({
        message: "Full name is required",
      });
    }

    // Registration ID validation
    if (
      updates.registrationId !== undefined &&
      !updates.registrationId.trim()
    ) {
      return res.status(400).json({
        message: "Registration ID is required",
      });
    }

    // Skills validation
    if (
      updates.skills !== undefined &&
      !Array.isArray(updates.skills)
    ) {
      return res.status(400).json({
        message: "Skills must be an array",
      });
    }

    // Looking For validation
    if (
      updates.lookingFor !== undefined &&
      !Array.isArray(updates.lookingFor)
    ) {
      return res.status(400).json({
        message: "Looking For must be an array",
      });
    }

    const userId = req.user.id || req.user._id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized - user id missing",
      });
    }

    // Normalize Registration ID
    if (updates.registrationId) {
      updates.registrationId = updates.registrationId
        .trim()
        .toUpperCase();
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      {
        new: true,
        runValidators: true,
      }
    ).select(
      "-password -verificationToken -verificationTokenExpiry -resetPasswordToken -resetPasswordTokenExpiry"
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Update Stream user
    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
    } catch (streamError) {
      console.log(
        "Error updating Stream user from profile:",
        streamError.message
      );
    }

    res.status(200).json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "Error in updateMyProfile controller:",
      error.message
    );

    // Duplicate registration ID / other unique field
    if (error.code === 11000) {
      const duplicateField = Object.keys(
        error.keyPattern || {}
      )[0];

      if (duplicateField === "registrationId") {
        return res.status(409).json({
          message: "This Registration ID is already registered",
        });
      }

      return res.status(409).json({
        message: "A user with this information already exists",
      });
    }

    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
}

export async function deactivateMyAccount(req, res) {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      isActive: false,
      deactivatedAt: new Date(),
    });

    res.clearCookie("jwt");

    res.status(200).json({
      success: true,
      message: "Account deactivated successfully",
    });
  } catch (error) {
    console.error(
      "Error in deactivateMyAccount controller:",
      error.message
    );

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

export async function deleteMyAccount(req, res) {
  try {
    const userId = req.user.id;

    await FriendRequest.deleteMany({
      $or: [
        { sender: userId },
        { recipient: userId },
      ],
    });

    await User.updateMany(
      { friends: userId },
      {
        $pull: {
          friends: userId,
        },
      }
    );

    await User.findByIdAndDelete(userId);

    res.clearCookie("jwt");

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error(
      "Error in deleteMyAccount controller:",
      error.message
    );

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user.id;
    const currentUser = req.user;

    const recommendedUsers = await User.find({
      $and: [
        {
          _id: {
            $ne: currentUserId,
          },
        },
        {
          _id: {
            $nin: currentUser.friends || [],
          },
        },
        {
          isOnboarded: true,
        },
        {
          isActive: true,
        },
      ],
    }).select(
      "-password -verificationToken -verificationTokenExpiry -resetPasswordToken -resetPasswordTokenExpiry"
    );

    res.status(200).json(recommendedUsers);
  } catch (error) {
    console.error(
      "Error in getRecommendedUsers controller:",
      error.message
    );

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("friends")
      .populate(
        "friends",
        "fullName profilePic registrationId course branch year semester skills lookingFor bio location"
      );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json(user.friends);
  } catch (error) {
    console.error(
      "Error in getMyFriends controller:",
      error.message
    );

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user.id;
    const { id: recipientId } = req.params;

    // Prevent sending request to yourself
    if (myId === recipientId) {
      return res.status(400).json({
        message: "You can't send friend request to yourself",
      });
    }

    const recipient = await User.findById(recipientId);

    if (!recipient) {
      return res.status(404).json({
        message: "Recipient not found",
      });
    }

    // Check if already friends
    if (recipient.friends.includes(myId)) {
      return res.status(400).json({
        message: "You are already friends with this user",
      });
    }

    // Check existing request
    const existingRequest = await FriendRequest.findOne({
      $or: [
        {
          sender: myId,
          recipient: recipientId,
        },
        {
          sender: recipientId,
          recipient: myId,
        },
      ],
    });

    if (existingRequest) {
      return res.status(400).json({
        message:
          "A friend request already exists between you and this user",
      });
    }

    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
    });

    res.status(201).json(friendRequest);
  } catch (error) {
    console.error(
      "Error in sendFriendRequest controller:",
      error.message
    );

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;

    const friendRequest =
      await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({
        message: "Friend request not found",
      });
    }

    // Verify current user is recipient
    if (
      friendRequest.recipient.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message:
          "You are not authorized to accept this request",
      });
    }

    friendRequest.status = "accepted";

    await friendRequest.save();

    // Add sender to recipient's friends
    await User.findByIdAndUpdate(
      friendRequest.sender,
      {
        $addToSet: {
          friends: friendRequest.recipient,
        },
      }
    );

    // Add recipient to sender's friends
    await User.findByIdAndUpdate(
      friendRequest.recipient,
      {
        $addToSet: {
          friends: friendRequest.sender,
        },
      }
    );

    res.status(200).json({
      message: "Friend request accepted",
    });
  } catch (error) {
    console.error(
      "Error in acceptFriendRequest controller:",
      error.message
    );

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

export async function getFriendRequests(req, res) {
  try {
    const incomingReqs = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate(
      "sender",
      "fullName profilePic registrationId course branch year semester skills lookingFor"
    );

    const acceptedReqs = await FriendRequest.find({
      sender: req.user.id,
      status: "accepted",
    }).populate(
      "recipient",
      "fullName profilePic registrationId course branch year semester skills lookingFor"
    );

    res.status(200).json({
      incomingReqs,
      acceptedReqs,
    });
  } catch (error) {
    console.error(
      "Error in getFriendRequests controller:",
      error.message
    );

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

export async function getOutgoingFriendReqs(req, res) {
  try {
    const outgoingRequests = await FriendRequest.find({
      sender: req.user.id,
      status: "pending",
    }).populate(
      "recipient",
      "fullName profilePic registrationId course branch year semester skills lookingFor"
    );

    res.status(200).json(outgoingRequests);
  } catch (error) {
    console.error(
      "Error in getOutgoingFriendReqs controller:",
      error.message
    );

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}