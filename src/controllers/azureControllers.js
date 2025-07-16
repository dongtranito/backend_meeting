require('dotenv').config();
const { getAzureSpeechToken } = require('../services/azureTokenService');

const getToken = async (req, res) => {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_REGION;

  try {
    const token = await getAzureSpeechToken(key, region);
    res.json({ token, region });
  } catch (error) {
    console.error('[Token Error]', error.message);
    res.status(500).json({ error: 'Failed to fetch Azure Speech token' });
  }
};


const saveTextResult = async (req, res) => {
  const a = req.body;

  // if (!text || typeof text !== 'string') {
  //   return res.status(400).json({ error: 'Text is required' });
  // }

  try {
    console.log('[Received Text]', a);
    // Ở đây bạn có thể lưu vào DB, ghi file, gọi API khác...

    res.status(200).json({ message: 'Text received successfully' });
  } catch (error) {
    console.error('[Save Error]', error.message);
    res.status(500).json({ error: 'Failed to save text' });
  }
};



module.exports = { getToken, saveTextResult };


