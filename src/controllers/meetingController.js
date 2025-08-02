const { generateBienBan,summarizeTranscript } = require('../services/geminiService');
const {saveOrUpdateMeeting} = require("../services/meetingService")
const {db,admin} =require("../services/firebaseService")



async function handleTranscriptUpload(req, res) {
    try {
      const email = req.email; 

      const transcriptRaw = req.body;  // gồm toàn bộ dữ liệu gởi từ frontend (transcript, bienBanData, meetingID, sumarryData,transcriptchat)
      const hasOldSummary = !!transcriptRaw.summaryData;   
      let summaryData;
      let summaryPromise = null;
  
      // console.log (transcriptRaw)
      if (hasOldSummary) {
        summaryData = transcriptRaw.summaryData;
      } else {
        summaryPromise = summarizeTranscript(transcriptRaw);
      }
        const bienBanPromise = generateBienBan(transcriptRaw);
      if (summaryPromise) {
        summaryData = await summaryPromise;
      }
  

      let transcript=transcriptRaw.transcript;
      let  thoiGianKetThuc= transcriptRaw.thoiGianKetThuc;
      let meetingId=transcriptRaw.meetingId;

      const bienBanData = await bienBanPromise;
      meetingId= await saveOrUpdateMeeting({email,transcript,summaryData,bienBanData,meetingId, thoiGianKetThuc })
      res.json({
        summaryData,
        bienBanData,
        transcript,
        meetingId,
        thoiGianKetThuc,
      });
    } catch (err) {
      console.error("❌ Lỗi khi xử lý transcript:", err);
      res.status(500).json({ error: "Lỗi xử lý transcript" });
    }
  }
  

  const getMeetingList = async (req, res) => {
    const email = req.email;
  
    try {
      const snapshot = await db
        .collection("meetings")
        .where("email", "==", email)
        .get();
  
      const meetings = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.bienBanData?.title || "Không có tiêu đề",
          createdAt: data.createdAt?.toDate() || null,
          updatedAt: data.updatedAt?.toDate() || null,
        };
      });
  
      res.status(200).json({
        message: "Lấy danh sách cuộc họp thành công",
        data: meetings,
      });
    } catch (error) {
      console.error(" Lỗi khi lấy danh sách cuộc họphọp:", error);
      res.status(500).json({ message: "Lỗi server khi lấy danh sách cuộc họp" });
    }
  };
  
  const getMeetingDetail = async (req, res) => {
    const meetingId = req.params.meetingId;
  
    try {
      const docRef = db.collection("meetings").doc(meetingId);
      const doc = await docRef.get();
  
      if (!doc.exists) {
        return res.status(404).json({ message: "Không tìm thấy biên bản họp" });
      }
  
      const meeting = doc.data();
  
      res.status(200).json({
        meetingID: doc.id,
        ...meeting,
      });
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết cuộc họp:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  };

  const deleteMeeting = async (req, res) => {
    const meetingId = req.params.meetingId;
  
    try {
      const meetingRef = db.collection("meetings").doc(meetingId);
  
      const doc = await meetingRef.get();
      if (!doc.exists) {
        return res.status(404).json({ message: "Meeting không tồn tại" });
      }
  
      await meetingRef.delete();
      res.status(200).json({ message: "Xoá cuộc họp thành công" });
    } catch (error) {
      console.error("Lỗi khi xoá:", error);
      res.status(500).json({ message: "Lỗi server khi xoá cuộc họp" });
    }
  };
module.exports = {  handleTranscriptUpload, getMeetingList, getMeetingDetail,deleteMeeting};