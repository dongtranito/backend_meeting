import * as minutesService from "../services/minutesService.js";

export async function createTranscript(req, res) {
    try {
        const { url, meetingId } = req.body;
        const userId = req.email;
        //sau này mà refactor code thì các validation này phải viết riêng ra, và các lỗi trả về phải viết một cái cha class
        if (!meetingId || !url) {
            return res.status(400).json({
                success: false,
                error: "Thiếu trường meetingId và thiếu url trong body",
            });
        }
        const result = await minutesService.createTranscript(userId, meetingId, url);
        return res.status(200).json({
            success: true,
            message: "Tạo transcript thành công",
            data: result,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.response?.data || error.message || "Lỗi khi tạo transcript",
        });
    }

}

export async function createMinute(req, res) {
    try {
        const { url, meetingId } = req.body;
        const userId = req.email;
        if (!meetingId || !url) {
            return res.status(400).json({
                success: false,
                error: "Thiếu trường meetingId hoặc thiếu url trong body",
            });
        }
        const result = await minutesService.createMinute(userId, meetingId, url);
        return res.status(200).json({
            success: true,
            message: "Tạo biên bản thành công",
            data: result,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.response?.data || error.message || "Lỗi khi tạo biên bản",
        });
    }
}
export async function getMinute(req, res) {
    try {
        const { meetingId } = req.params;
        const userId = req.email;
        if (!meetingId) {
            return res.status(400).json({
                success: false,
                error: "Thiếu trường meetingId ở params",
            });
        }
        const result = await minutesService.getMinute(userId, meetingId);
        return res.status(200).json({
            success: true,
            message: "lấy biên bản thành công",
            data: result,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.response?.data || error.message || "Lỗi khi tạo biên bản",
        });
    }
}

export async function updateMinute(req, res) {
    try {
        const { meetingId } = req.params;
        const userId = req.email;
        const { placeholder } = req.body;
        if (!meetingId || !placeholder) {
            return res.status(400).json({
                success: false,
                error: "Thiếu trường meetingId ở params hoặc placeholder ở body",
            });
        }
        const result = await minutesService.updateMinute(userId, meetingId, placeholder);
        return res.status(200).json({
            success: true,
            message: "update biên bản thành công ",
            data: result,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.response?.data || error.message || "Lỗi khi tạo biên bản",
        });
    }
}

export async function send2Sign(req, res) {
    try {

        const userId = req.email;
        const { meetingId } = req.params
        const { signers } = req.body;
        if (!meetingId) {
            return res.status(400).json({
                success: false,
                error: "Thiếu meetingId",
            });
        }
        if (!signers) {
            return res.status(400).json({
                success: false,
                error: "Thiếu trường 'signers'.",
            });
        }

        if (!Array.isArray(signers)) {
            return res.status(400).json({
                success: false,
                error: "'signers' phải là một mảng.",
            });
        }


        const result = await minutesService.send2Sign(userId, meetingId, signers);
        return res.status(200).json({
            success: true,
            result
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.response?.data || error.message,
        });
    }
}