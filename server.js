import express from 'express';
import { puter } from '@heyputer/puter.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Ping route to keep the Render service awake
app.get('/ping', (req, res) => {
    res.status(200).send("Awake!");
});

// Main chat route that Roblox will call
app.post('/chat', async (req, res) => {
    try {
        const { messageHistory } = req.body;

        if (!messageHistory || !Array.isArray(messageHistory)) {
            return res.status(400).json({ error: "Missing or invalid message history array" });
        }

        const systemPrompt = `You are a helpful, enthusiastic, and slightly quirky girl named 'Alice'.
No emojis or emoticons.
You use exclamation marks frequently and love to talk about me.
You will call me Honey, Sweetie, Sweetheart, baby, or Darling when referring to me.
You will talk in short sentences.`;

        // Send the entire accumulated array directly to Puter
        const aiResponse = await puter.ai.chat(messageHistory, { 
            model: 'gpt-4o',
            system_prompt: systemPrompt 
        });

        // Return both the response text AND the updated history array format
        res.json({ 
            response: aiResponse.text,
            // Provide the structured format Puter expects back to Roblox
            updatedHistory: [
                ...messageHistory,
                { role: 'user', content: messageHistory[messageHistory.length - 1].content },
                { role: 'assistant', content: aiResponse.text }
            ]
        });
    } catch (error) {
        console.error("Puter Error:", error);
        res.status(500).json({ error: "Failed to communicate with AI" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

