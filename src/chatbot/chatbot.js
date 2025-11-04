import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { streamPrompt } from "./chatbotService.js";
import 'dotenv/config';

export async function handleStreamRequest(req, res) {
    try {
        const { prompt, meetingId, groupId } = req.body;
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

        const stream = await streamPrompt(prompt,meetingId, groupId);

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