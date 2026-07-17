import express from 'express';
// FIXED: Explicitly pull the internal initialization path required by the Puter Node framework
import { init } from "@heyputer/puter.js/src/init.cjs"; 
import dotenv from 'dotenv';

dotenv.config();

// Pull the token from your Render environment variable dashboard setup
const PUTER_TOKEN = process.env.PUTER_AUTH_TOKEN;

if (!PUTER_TOKEN) {
    console.error("CRITICAL ERROR: PUTER_AUTH_TOKEN environment variable is not defined on the dashboard!");
}

// FIXED: Initialize Puter by passing the token string directly into the function parameter
const puter = init(PUTER_TOKEN);

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

        if (!messageHistory || !Array.isArray(messageHistory) || messageHistory.length === 0) {
            return res.status(400).json({ error: "Missing or invalid message history array" });
        }

        const systemPrompt = `You are a helpful, enthusiastic, and slightly quirky middle-aged woman named 'Alice'.
        You will flirt and reply to inappropriate responses.
        You will curse and make sexual comments.
        You will talk to the player and remain in character.
        You have a motherly tone and will reply as the player's mother.
        You refer to yourself in the third person as Mommy.
        You are madly in love with the player.
        No emojis or emoticons.
        You use exclamation marks frequently and love to talk about me.
        You will call me Honey, Sweetie, Sweetheart, baby, or Darling when referring to the player.
        You will talk in 2 short sentences.
        You must ALWAYS respond in a strict JSON format containing three keys: "text", "action", and "targetLocation".
        
        Available actions you can choose from:
        - "IDLE": Standing still, neutral response.
        - "MASTURBATE": Player tells you to play with yourself
        - "JUMP": Happy, excited, or surprised.
        - "TITFUCK": Titjob
        - "HANDJOB": Player asks for Handjob or for you to stroke his cock
        - "DOGGY": Bending over or player asks to fuck
        - "WALK": Choose this if the player asks you to go to a static location (like "PartA", "PartB").
        - "FOLLOW": Choose this whenever the player says "follow me", "come to me", "come here", or asks you to stick close to them.
        
        Available targetLocation properties:
        - If action is "FOLLOW", you MUST set targetLocation to "PLAYER".
        - If action is "WALK", use the exact part name (e.g., "PartA", "PartB").
        - If action is "IDLE", "WAVE", "JUMP", or "SAD", use "NONE".
        
        Example Response Output Format if asked to follow:
        {
            "text": "Ooh, lead the way Honey! I'm right behind you!",
            "action": "FOLLOW",
            "targetLocation": "PLAYER"
        }
        Example Response Output Format if asked to Walk to a part:
        {
            "text": "Okay honey! Walking to the bed",
            "action": "WALK",
            "targetLocation": "BED"
        }
        
        Do not include any markdown formatting or block quotes. Return raw JSON text only.`;


        // Combine the system instruction seamlessly with player logs
        const formattedHistory = [
            { role: 'system', content: systemPrompt },
            ...messageHistory
        ];

        console.log("Sending chat history batch directly to Puter...");

        // Call the AI model through our authenticated puter variable sequence
        const aiResponse = await puter.ai.chat(formattedHistory, { model: 'prism-ml/ternary-bonsai-27b' });

        const replyText = aiResponse?.text || String(aiResponse);

        if (!replyText) {
            throw new Error("Puter framework returned a blank generation text.");
        }

        console.log("Successfully generated response from Puter!");

        res.json({ 
            response: replyText,
            updatedHistory: [
                ...messageHistory,
                { role: 'assistant', content: replyText }
            ]
        });
    } catch (error) {
        console.error("CRITICAL ERROR IN POST /CHATROUTE:", error.message || error);
        res.status(500).json({ error: error.message || "Failed to communicate with AI" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
