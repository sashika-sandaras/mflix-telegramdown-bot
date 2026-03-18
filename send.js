const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const { execSync } = require('child_process');
const path = require('path');

// GitHub Secrets වලින් දත්ත ලබාගැනීම
const apiId = parseInt(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;
const botToken = process.env.TELEGRAM_TOKEN;
const chatId = process.env.USER_CHAT_ID || process.env.user_chat_id;
const fileId = process.env.FILE_ID;

const stringSession = new StringSession(""); // Bot කෙනෙක් නිසා හිස්ව තැබිය හැක

(async () => {
    console.log("🚀 MFlix GramJS Engine Starting...");
    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });

    try {
        // බොට් කෙනෙක් ලෙස ලොග් වීම
        await client.start({
            botAuthToken: botToken,
        });
        console.log("✅ Bot Authenticated Successfully!");

        // 1. Google Drive එකෙන් Download කිරීම
        console.log("📥 Downloading file from Drive...");
        try {
            execSync(`gdown ${fileId} --fuzzy --confirm`);
        } catch (e) {
            execSync(`gdown ${fileId}`);
        }

        // Download වුණු ෆයිල් එක සොයාගැනීම
        const files = fs.readdirSync('.');
        const ignore = ['send.js', 'package.json', 'node_modules', '.github', 'package-lock.json'];
        const finalFile = files.find(f => !ignore.includes(f) && !fs.lstatSync(f).isDirectory());

        if (!finalFile) throw new Error("Download Failed! No file found.");

        const stats = fs.statSync(finalFile);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`✅ File Ready: ${finalFile} (${fileSizeMB} MB)`);

        // 2. Telegram එකට Upload කිරීම (Large File Support)
        console.log("📤 Uploading to Telegram...");
        
        let caption = `💚 *Movie Uploaded Successfully!* 🍿\n\n` +
                      `📦 *File :* \`${finalFile}\` \n` +
                      `📏 *Size :* ${fileSizeMB} MB\n\n` +
                      `🏷️ *Mflix WhDownloader*\n` +
                      `💌 *Made With Sashika Sandras*`;

        await client.sendFile(chatId, {
            file: finalFile,
            caption: caption,
            parseMode: "markdown",
            forceDocument: true, // වීඩියෝ එක Document එකක් ලෙස යැවීමට
            workers: 4, // Upload speed එක වැඩි කිරීමට
            progressCallback: (p) => {
                console.log(`Upload Progress: ${(p * 100).toFixed(2)}%`);
            },
        });

        console.log("✅ Upload Completed!");

        // Cleanup
        if (fs.existsSync(finalFile)) fs.unlinkSync(finalFile);
        process.exit(0);

    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
})();
