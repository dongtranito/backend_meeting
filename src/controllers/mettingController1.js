import * as meetingService from "../services/meetingService1.js";
export async function getListMeeting(req, res) {
    try {
        const userId = req.email;
        const { groupId } = req.query;
        if (!groupId) {
            return res.status(400).json({ error: "Thiếu grouopId " });
        }
        const meetings = await meetingService.getListMeeting(userId, groupId);
        return res.status(200).json({
            success: true,
            data: meetings,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message || "Internal server error",
        });
    }
}

export async function createMeeting(req, res) {
    try {

        const userId = req.email;
        const { groupId, title, description, scheduledAt, audioUrl, metaData } = req.body;

        if (!groupId || !title || !scheduledAt) {
            return res.status(400).json({
                success: false,
                error: "Thiếu groupId, title hoặc scheduleAt",
            });
        }

        // 🧠 Gọi service để tạo cuộc họp
        const newMeeting = await meetingService.createMeeting(userId, groupId, {
            title,
            description,
            scheduledAt,
            audioUrl,
            metaData,
        });

        return res.status(201).json({
            success: true,
            data: newMeeting,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message || "Internal server error",
        });
    }
}


export async function deleteMeeting(req, res) {
    try {
        const userId = req.email;
        const { meetingId } = req.params; // URL: /meetings/:meetingId

        if (!meetingId) {
            return res.status(400).json({
                success: false,
                error: "Thiếu meetingId",
            });
        }

        const result = await meetingService.deleteMeeting(userId, meetingId);

        return res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message || "Internal server error",
        });
    }
}


export async function updateMeeting(req, res) {
    try {
        const userId = req.email;
        const { meetingId } = req.params;
        const { title, description, scheduledAt, status, audioUrl, metaData } = req.body;

        if (!meetingId) {
            return res.status(400).json({
                success: false,
                error: "Thiếu meetingId",
            });
        }

        // Gọi service để update
        const updatedMeeting = await meetingService.updateMeeting(
            userId,
            meetingId,
            { title, description, scheduledAt, metaData }
        );

        return res.status(200).json({
            success: true,
            data: updatedMeeting,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message || "Internal server error",
        });
    }
}

export async function getMeeting(req, res) {
    try {
        const userId = req.email;
        const { meetingId } = req.params; // URL: /meetings/:meetingId

        if (!meetingId) {
            return res.status(400).json({
                success: false,
                error: "Thiếu meetingId",
            });
        }

        const result = await meetingService.getMeeting(userId, meetingId);

        return res.status(200).json({
            success: true,
            data: result,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message || "Internal server error",
        });
    }
}
