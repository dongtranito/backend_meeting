const { db, admin } = require('./firebaseService');

async function saveOrUpdateMeeting({ email, transcript, summaryData, bienBanData, meetingId,thoiGianKetThuc }) {
  const meetingData = {
    email,
    summaryData,
    transcript,
    bienBanData,
    updatedAt: admin.firestore.Timestamp.now(),
    thoiGianKetThuc,
  };

  if (meetingId) {
    const ref = db.collection('meetings').doc(meetingId);
    const doc = await ref.get();

    if (!doc.exists) {
      meetingData.createdAt = admin.firestore.Timestamp.now();
      const docRef = await db.collection('meetings').add(meetingData);
      return docRef.id;
    }

    await ref.update(meetingData);
    return meetingId;
  } else {
    meetingData.createdAt = admin.firestore.Timestamp.now();
    const docRef = await db.collection('meetings').add(meetingData);
    return docRef.id;
  }
}

module.exports = { saveOrUpdateMeeting };
