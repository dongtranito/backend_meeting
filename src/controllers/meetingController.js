// controllers/meetingController.js
const { db } = require("../services/firebaseService");

const createMeeting = async (req, res) => {
  const email = req.email; 
//   console.log(email)
  const { transcript, bienBanData, summaryData } = req.body;


  try {
    const newMeeting = {
      email,
      summaryData,
      transcript,
      bienBanData,
      createdAt: new Date(),
    };

    const docRef = await db.collection("meetings").add(newMeeting);

    res.status(201).json({
      message: "Lưu cuộc họp thành công",
      meetingId: docRef.id,
    });
  } catch (error) {
    console.error("🔥 Lỗi khi lưu cuộc họp:", error);
    res.status(500).json({ message: "Lỗi server khi lưu cuộc họp" });
  }
};

module.exports = { createMeeting };
