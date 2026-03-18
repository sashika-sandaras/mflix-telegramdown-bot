const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const { execSync } = require('child_process');

const apiId = parseInt(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;
const botToken = process.env.TELEGRAM_TOKEN;
const chatId = process.env.USER_CHAT_ID;
const fileId = process.env.FILE_ID;

(async () => {
    const client = new TelegramClient(new StringSession(""), apiId, apiHash, { connectionRetries: 5 });
    try {
        await client.start({ botAuthToken: botToken });

        // 1. Download
        console.log("📥 Downloading...");
        execSync(`gdown ${fileId} --fuzzy --confirm || gdown ${fileId}`);

        // 2. Select File (Blocking README.md)
        const files = fs.readdirSync('.');
        const blackList = ['README.md', 'send.js', 'package.json', 'node_modules', '.github', '.git', 'LICENSE', 'package-lock.json'];
        const finalFile = files.find(f => {
            const isVideo = f.endsWith('.mp4') || f.endsWith('.mkv') || f.endsWith('.zip') || f.endsWith('.srt');
            return !blackList.includes(f) && !fs.lstatSync(f).isDirectory() && isVideo;
        });

        if (!finalFile) throw new Error("File not found!");

        // 3. Send as ORIGINAL DOCUMENT
        console.log(`📤 Uploading Original File: ${finalFile}`);
        await client.sendFile(chatId, {
            file: finalFile,
            caption: `🎬 *MFlix Original File* \n\n📦 \`${finalFile}\``,
            parseMode: "markdown",
            forceDocument: true,   // මෙන්න මේක නිසා Original File එකක් විදිහටම යනවා ✅
            workers: 16,
            progressCallback: (p) => console.log(`Progress: ${(p * 100).toFixed(2)}%`),
        });

        console.log("✅ Done!");
        fs.unlinkSync(finalFile);
        process.exit(0);

    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
})();
