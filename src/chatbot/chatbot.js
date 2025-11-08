import { streamPromptGroupId, streamPromptMeetingId } from "./chatbotService.js";

export async function handleStreamRequest(req, res) {
    try {
        const { prompt, meetingId, groupId } = req.body;
        // const userId = req.email;
        const userId = "xuanvy74269@gmail.com";
        

        if (!prompt || !prompt.trim()) {
            return res.status(400).json({
                success: false,
                error: "Thiếu prompt"
            });
        }
        if (!groupId && !meetingId) {
            return res.status(400).json({
                success: false,
                error: "thiếu groupId hoặc meetingId",
            })
        }

        if (groupId && meetingId) {
            return res.status(400).json({
                success: false,
                error: "Chỉ được truyền groupId hoặc meetingId",
            })
        }

        res.writeHead(200, {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        });

        let stream;
        if (meetingId) {
            stream = await streamPromptMeetingId(userId,prompt, meetingId);
        } else {
            stream = await streamPromptGroupId(userId, prompt,groupId);
        }

        for await (const chunk of stream) {
            const text = chunk.content || "";
            res.write(text);
        }
        res.end();

    } catch (err) {
        console.error("❌ Stream error:", err);
        res.write(`\n[ERROR]: ${err.message}`);
        res.end();
    }
}