import * as minutesService from "../services/minutesService.js";

export async function createTranscript(req, res) {
    try {
        const { url, groupId } = req.body;
        const userId = req.email;
        //sau này mà refactor code thì các validation này phải viết riêng ra, và các lỗi trả về phải viết một cái cha class
        if (!groupId || !url) {
            return res.status(400).json({
                success: false,
                error: "Thiếu trường groupId và thiếu url trong body",
            });
        }
        const result = await minutesService.createTranscript(userId, groupId, url);
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