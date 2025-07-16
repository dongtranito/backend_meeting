const { generateBienBan,summarizeTranscript } = require('../services/geminiService');



const  getBienBanController= async (req, res) => {
    transcriptRaw  = req.body;
    bienBan = await generateBienBan(transcriptRaw);
    res.json({ bienBan });
  };


async function handleTranscriptUpload(req, res) {
    try {
      const transcriptRaw = req.body;
      const hasOldSummary = !!transcriptRaw.summaryData;   
      console.log(hasOldSummary)
      let summaryData;
      let summaryPromise = null;
  
      if (hasOldSummary) {
        summaryData = transcriptRaw.summaryData;
      } else {
        summaryPromise = summarizeTranscript(transcriptRaw);
      }
        const bienBanPromise = generateBienBan(transcriptRaw);
        console.log (bienBanPromise)

      if (summaryPromise) {
        summaryData = await summaryPromise;
      }
  
      const bienBanData = await bienBanPromise;
  
      res.json({
        summaryData,
        bienBanData,
        transcriptRaw
      });
    } catch (err) {
      console.error("❌ Lỗi khi xử lý transcript:", err);
      res.status(500).json({ error: "Lỗi xử lý transcript" });
    }
  }
  



  

module.exports = { getBienBanController, handleTranscriptUpload};