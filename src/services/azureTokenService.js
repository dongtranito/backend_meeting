const axios = require('axios');

const getAzureSpeechToken = async (key, region) => {
    const url = `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
    const response = await axios.post(url, null, {
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return response.data;
  };
  
  module.exports = { getAzureSpeechToken };
  