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
    console.log("🚀 MFlix Engine Starting...");
    const client = new TelegramClient(new StringSession(""), apiId, apiHash, { connectionRetries: 5 });

    try {
        await client.start({ botAuthToken: botToken });

        // 1. Download
        execSync(`gdown ${fileId} --fuzzy --confirm || gdown ${fileId}`);

        // 2. Select File (Blocking README.md)
        const files = fs.readdirSync('.');
        const blackList = ['README.md', 'send.js', 'package.json', 'node_modules', '.github', '.git', 'LICENSE', 'yarn.lock', 'package-lock.json'];

        const finalFile = files.find(f => {
            const fileName = f.toLowerCase();
            const isDir = fs.lstatSync(f).isDirectory();
            const isVideo = fileName.endsWith('.mp4') || fileName.endsWith('.mkv') || fileName.endsWith('.zip') || fileName.endsWith('.srt');
            return !isDir && !blackList.includes(f) && isVideo;
        });

        if (!finalFile) throw new Error("Video file not found!");

        // 3. Send as ORIGINAL DOCUMENT
        await client.sendFile(chatId, {
            file: finalFile,
            caption: `🎬 *MFlix Original File* \n\n📦 \`${finalFile}\``,
            parseMode: "markdown",
            forceDocument: true,     // Original File ලෙස යැවීමට ✅
            workers: 16
        });

        console.log("✅ Done!");
        fs.unlinkSync(finalFile);
        process.exit(0);

    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
})();
