import * as minutesService from "../services/minutesService.js";

export async function createTranscript(req, res) {
    try {
        const { url } = req.body;
        if (!url) {
            return res
                .status(400)
                .json({ success: false, error: "Thiếu url trong request body" });
        }

        const result = await minutesService.createTranscript(url);
        return res.status(200).json({
            success: true,
            message: "Tạo transcript thành công, Azure đang xử lý file audio",
            data: {
                result
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.response?.data || error.message || "Lỗi khi tạo transcript",
        });
    }

}