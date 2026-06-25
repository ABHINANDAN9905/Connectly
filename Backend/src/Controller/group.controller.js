import Group from "../models/Group.js";
import { streamClient } from "../lib/stream.js";

export const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Group name is required",
      });
    }

    const channelId = `group-${Date.now()}`;

    const channel = streamClient.channel(
      "messaging",
      channelId,
      {
        name,
        created_by_id: req.user._id.toString(),
        members: [req.user._id.toString()],
      }
    );

    await channel.create();

    const group = await Group.create({
      name,
      description,
      admin: req.user._id,
      members: [req.user._id],
      streamChannelId: channelId,
    });

    res.status(201).json({
      success: true,
      group,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create group",
    });
  }
};