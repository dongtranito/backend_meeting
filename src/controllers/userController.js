import fs from "fs";
import { parseFile } from "music-metadata";
import * as userService from "../services/userService.js";

export async function createSampleVoice(req, res) {
  try {
    const email = req.email;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No audio file uploaded." });
    }

    if (!file.mimetype.startsWith("audio/")) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: "File phải là audio" });
    }

    const metadata = await parseFile(file.path);
    const duration = metadata.format.duration;
    if (duration > 10) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: "Audio phải <= 10 giây" });
    }

    const result = await userService.createSampleVoice(email, file);

    return res.status(200).json({
      success: true,
      data: {
        ...result,
        duration: Number(duration.toFixed(2))
      }
    });

  } catch (error) {
    console.error("Error in controller:", error);
    return res.status(500).json({ error: error.message || "Server error" });
  }
}

export async function getSampleVoice(req, res) {
  try {
    const { email } = req;
    const result = await userService.getSampleVoice(email);
    return res.json({ success: true, data: result });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: err.message || "Internal server error" });
  }
}