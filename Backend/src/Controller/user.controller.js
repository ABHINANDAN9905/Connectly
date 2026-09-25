import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import { upsertStreamUser } from "../lib/stream.js";

/*
|--------------------------------------------------------------------------
| SAFE USER FIELDS
|--------------------------------------------------------------------------
*/

const safeUserFields =
  "-password " +
  "-verificationToken " +
  "-verificationTokenExpiry " +
  "-resetPasswordToken " +
  "-resetPasswordTokenExpiry";

/*
|--------------------------------------------------------------------------
| PROFILE FIELDS
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| GET PROFILE UPDATES
|--------------------------------------------------------------------------
*/

const getProfileUpdates = (body) => {
  return profileFields.reduce((updates, field) => {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }

    return updates;
  }, {});
};

/*
|--------------------------------------------------------------------------
| GET MY PROFILE
|--------------------------------------------------------------------------
*/

export async function getMyProfile(req, res) {
  try {
    const user = await User.findById(req.user.id).select(
      safeUserFields
    );

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
    console.error(
      "Error in getMyProfile:",
      error.message
    );

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

/*
|--------------------------------------------------------------------------
| GET USER BY ID
|--------------------------------------------------------------------------
| Used for:
| /student/:id
|--------------------------------------------------------------------------
*/

export async function getUserById(req, res) {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select(
      safeUserFields
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Only explicitly deactivated accounts are hidden.
    // This also supports older users where isActive may
    // not exist in the database.
    if (user.isActive === false) {
      return res.status(404).json({
        success: false,
        message:
          "This student account is no longer available",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(
      "Error in getUserById:",
      error.message
    );

    // Invalid MongoDB ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE MY PROFILE
|--------------------------------------------------------------------------
*/

export async function updateMyProfile(req, res) {
  try {
    const updates = getProfileUpdates(req.body);

    /*
    |--------------------------------------------------------------------------
    | FULL NAME
    |--------------------------------------------------------------------------
    */

    if (updates.fullName !== undefined) {
      if (!updates.fullName.trim()) {
        return res.status(400).json({
          message: "Full name is required",
        });
      }

      updates.fullName = updates.fullName.trim();
    }

    /*
    |--------------------------------------------------------------------------
    | REGISTRATION ID
    |--------------------------------------------------------------------------
    */

    if (updates.registrationId !== undefined) {
      if (!updates.registrationId.trim()) {
        return res.status(400).json({
          message: "Registration ID is required",
        });
      }

      updates.registrationId = updates.registrationId
        .trim()
        .toUpperCase();
    }

    /*
    |--------------------------------------------------------------------------
    | COURSE
    |--------------------------------------------------------------------------
    */

    if (updates.course !== undefined) {
      updates.course = updates.course.trim();
    }

    /*
    |--------------------------------------------------------------------------
    | BRANCH
    |--------------------------------------------------------------------------
    */

    if (updates.branch !== undefined) {
      updates.branch = updates.branch.trim();
    }

    /*
    |--------------------------------------------------------------------------
    | YEAR
    |--------------------------------------------------------------------------
    */

    if (updates.year !== undefined) {
      updates.year = updates.year.trim();
    }

    /*
    |--------------------------------------------------------------------------
    | SEMESTER
    |--------------------------------------------------------------------------
    */

    if (updates.semester !== undefined) {
      updates.semester = updates.semester.trim();
    }

    /*
    |--------------------------------------------------------------------------
    | BIO
    |--------------------------------------------------------------------------
    */

    if (updates.bio !== undefined) {
      updates.bio = updates.bio.trim();
    }

    /*
    |--------------------------------------------------------------------------
    | LOCATION
    |--------------------------------------------------------------------------
    */

    if (updates.location !== undefined) {
      updates.location = updates.location.trim();
    }

    /*
    |--------------------------------------------------------------------------
    | SKILLS
    |--------------------------------------------------------------------------
    */

    if (updates.skills !== undefined) {
      if (!Array.isArray(updates.skills)) {
        return res.status(400).json({
          message: "Skills must be an array",
        });
      }

      updates.skills = updates.skills
        .map((skill) => String(skill).trim())
        .filter(Boolean);
    }

    /*
    |--------------------------------------------------------------------------
    | LOOKING FOR
    |--------------------------------------------------------------------------
    */

    if (updates.lookingFor !== undefined) {
      if (!Array.isArray(updates.lookingFor)) {
        return res.status(400).json({
          message: "Looking For must be an array",
        });
      }

      updates.lookingFor = updates.lookingFor
        .map((item) => String(item).trim())
        .filter(Boolean);
    }

    /*
    |--------------------------------------------------------------------------
    | USER ID
    |--------------------------------------------------------------------------
    */

    const userId = req.user.id || req.user._id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized - user id missing",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE USER
    |--------------------------------------------------------------------------
    */

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: updates,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select(safeUserFields);

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE STREAM USER
    |--------------------------------------------------------------------------
    */

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
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "Error in updateMyProfile controller:",
      error.message
    );

    /*
    |--------------------------------------------------------------------------
    | DUPLICATE KEY
    |--------------------------------------------------------------------------
    */

    if (error.code === 11000) {
      const duplicateField = Object.keys(
        error.keyPattern || {}
      )[0];

      if (duplicateField === "registrationId") {
        return res.status(409).json({
          message:
            "This Registration ID is already registered",
        });
      }

      if (duplicateField === "email") {
        return res.status(409).json({
          message: "This email is already registered",
        });
      }

      if (duplicateField === "username") {
        return res.status(409).json({
          message: "This username is already taken",
        });
      }

      return res.status(409).json({
        message:
          "A user with this information already exists",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATION ERROR
    |--------------------------------------------------------------------------
    */

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: Object.values(error.errors)
          .map((err) => err.message)
          .join(", "),
      });
    }

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

/*
|--------------------------------------------------------------------------
| DEACTIVATE ACCOUNT
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| DELETE ACCOUNT
|--------------------------------------------------------------------------
*/

export async function deleteMyAccount(req, res) {
  try {
    const userId = req.user.id;

    /*
    |--------------------------------------------------------------------------
    | DELETE FRIEND REQUESTS
    |--------------------------------------------------------------------------
    */

    await FriendRequest.deleteMany({
      $or: [
        { sender: userId },
        { recipient: userId },
      ],
    });

    /*
    |--------------------------------------------------------------------------
    | REMOVE USER FROM FRIEND LISTS
    |--------------------------------------------------------------------------
    */

    await User.updateMany(
      { friends: userId },
      {
        $pull: {
          friends: userId,
        },
      }
    );

    /*
    |--------------------------------------------------------------------------
    | DELETE USER
    |--------------------------------------------------------------------------
    */

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

/*
|--------------------------------------------------------------------------
| GET RECOMMENDED USERS
|--------------------------------------------------------------------------
*/

export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user.id;

    const currentUser = await User.findById(
      currentUserId
    ).select("friends");

    if (!currentUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const recommendedUsers = await User.find({
      _id: {
        $ne: currentUserId,
        $nin: currentUser.friends || [],
      },

      isOnboarded: true,
      isActive: true,
    })
      .select(safeUserFields)
      .sort({ createdAt: -1 });

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

/*
|--------------------------------------------------------------------------
| SEARCH USERS BY NAME
|--------------------------------------------------------------------------
*/

export async function searchUsers(req, res) {
  try {
    const { name } = req.query;

    const searchName = name?.trim();

    // No search text
    if (!searchName) {
      return res.status(200).json([]);
    }

    const currentUserId = req.user.id;

    const users = await User.find({
      // Don't show current user
      _id: {
        $ne: currentUserId,
      },

      // Only active + onboarded students
      isActive: true,
      isOnboarded: true,

      // Case-insensitive partial name search
      fullName: {
        $regex: searchName,
        $options: "i",
      },
    })
      .select(safeUserFields)
      .limit(20)
      .sort({
        fullName: 1,
      });

    return res.status(200).json(users);
  } catch (error) {
    console.error(
      "Error in searchUsers controller:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

/*
|--------------------------------------------------------------------------
| GET MY FRIENDS
|--------------------------------------------------------------------------
*/

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("friends")
      .populate(
        "friends",
        `
        fullName
        username
        profilePic
        registrationId
        course
        branch
        year
        semester
        skills
        lookingFor
        bio
        location
        `
      );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json(user.friends || []);
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

/*
|--------------------------------------------------------------------------
| SEND FRIEND REQUEST
|--------------------------------------------------------------------------
*/

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user.id;
    const { id: recipientId } = req.params;

    /*
    |--------------------------------------------------------------------------
    | SELF REQUEST
    |--------------------------------------------------------------------------
    */

    if (
      myId.toString() === recipientId.toString()
    ) {
      return res.status(400).json({
        message:
          "You can't send friend request to yourself",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK RECIPIENT
    |--------------------------------------------------------------------------
    */

    const recipient = await User.findOne({
      _id: recipientId,
      isActive: true,
      isOnboarded: true,
    });

    if (!recipient) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | ALREADY FRIENDS
    |--------------------------------------------------------------------------
    */

    if (
      recipient.friends?.some(
        (friendId) =>
          friendId.toString() === myId.toString()
      )
    ) {
      return res.status(400).json({
        message:
          "You are already friends with this user",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | EXISTING REQUEST
    |--------------------------------------------------------------------------
    */

    const existingRequest =
      await FriendRequest.findOne({
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

    /*
    |--------------------------------------------------------------------------
    | CREATE REQUEST
    |--------------------------------------------------------------------------
    */

    const friendRequest =
      await FriendRequest.create({
        sender: myId,
        recipient: recipientId,
        status: "pending",
      });

    res.status(201).json({
      success: true,
      message: "Friend request sent",
      friendRequest,
    });
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

/*
|--------------------------------------------------------------------------
| ACCEPT FRIEND REQUEST
|--------------------------------------------------------------------------
*/

export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;

    /*
    |--------------------------------------------------------------------------
    | FIND REQUEST
    |--------------------------------------------------------------------------
    */

    const friendRequest =
      await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({
        message: "Friend request not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK RECIPIENT
    |--------------------------------------------------------------------------
    */

    if (
      friendRequest.recipient.toString() !==
      req.user.id.toString()
    ) {
      return res.status(403).json({
        message:
          "You are not authorized to accept this request",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK STATUS
    |--------------------------------------------------------------------------
    */

    if (friendRequest.status !== "pending") {
      return res.status(400).json({
        message:
          "This friend request is no longer pending",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | ACCEPT REQUEST
    |--------------------------------------------------------------------------
    */

    friendRequest.status = "accepted";

    await friendRequest.save();

    /*
    |--------------------------------------------------------------------------
    | ADD SENDER TO RECIPIENT FRIENDS
    |--------------------------------------------------------------------------
    */

    await User.findByIdAndUpdate(
      friendRequest.recipient,
      {
        $addToSet: {
          friends: friendRequest.sender,
        },
      }
    );

    /*
    |--------------------------------------------------------------------------
    | ADD RECIPIENT TO SENDER FRIENDS
    |--------------------------------------------------------------------------
    */

    await User.findByIdAndUpdate(
      friendRequest.sender,
      {
        $addToSet: {
          friends: friendRequest.recipient,
        },
      }
    );

    res.status(200).json({
      success: true,
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

/*
|--------------------------------------------------------------------------
| GET FRIEND REQUESTS
|--------------------------------------------------------------------------
*/

export async function getFriendRequests(req, res) {
  try {
    /*
    |--------------------------------------------------------------------------
    | INCOMING REQUESTS
    |--------------------------------------------------------------------------
    */

    const incomingReqs =
      await FriendRequest.find({
        recipient: req.user.id,
        status: "pending",
      })
        .populate(
          "sender",
          `
          fullName
          username
          profilePic
          registrationId
          course
          branch
          year
          semester
          skills
          lookingFor
          bio
          location
          `
        )
        .sort({
          createdAt: -1,
        });

    /*
    |--------------------------------------------------------------------------
    | ACCEPTED REQUESTS
    |--------------------------------------------------------------------------
    */

    const acceptedReqs =
      await FriendRequest.find({
        sender: req.user.id,
        status: "accepted",
      })
        .populate(
          "recipient",
          `
          fullName
          username
          profilePic
          registrationId
          course
          branch
          year
          semester
          skills
          lookingFor
          bio
          location
          `
        )
        .sort({
          updatedAt: -1,
        });

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

/*
|--------------------------------------------------------------------------
| GET OUTGOING FRIEND REQUESTS
|--------------------------------------------------------------------------
*/

export async function getOutgoingFriendReqs(req, res) {
  try {
    const outgoingRequests =
      await FriendRequest.find({
        sender: req.user.id,
        status: "pending",
      })
        .populate(
          "recipient",
          `
          fullName
          username
          profilePic
          registrationId
          course
          branch
          year
          semester
          skills
          lookingFor
          bio
          location
          `
        )
        .sort({
          createdAt: -1,
        });

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