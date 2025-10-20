import { admin, db } from '../config/firebaseService.js';
import jwtService from '../services/jwtService.js';
import {mergeGroupAndAudio} from "../utils/mergeAudio.js"
import dotenv from "dotenv";
dotenv.config();


// Sửa file test.js
export async function test(req, res) {
  try {
    const  {groupId, url} = req.body;
    const result = await mergeGroupAndAudio(groupId, url)
    return res.status(200).json({
      success: true,
      message: "Test API thành công!",
      data: result,
    }
);
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
}