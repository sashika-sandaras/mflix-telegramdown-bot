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

        // 1. මුලින්ම Request එක ලැබුණු බව දැනුම් දීම
        await client.sendMessage(chatId, { message: "✅ Request Received..." });

        console.log("📥 Downloading...");
        await client.sendMessage(chatId, { message: "📥 Download වෙමින් පවතී..." });
        
        try {
            execSync(`gdown ${fileId} --fuzzy --confirm`);
        } catch (e) {
            execSync(`gdown ${fileId}`);
        }

        // 2. ෆයිල් එක තෝරා ගැනීම
        const files = fs.readdirSync('.');
        const blackList = ['README.md', 'send.js', 'package.json', 'node_modules', '.github', '.git', 'LICENSE', 'yarn.lock', 'package-lock.json'];

        const finalFile = files.find(f => {
            const fileName = f.toLowerCase();
            const isDir = fs.lstatSync(f).isDirectory();
            const isTarget = fileName.endsWith('.mp4') || fileName.endsWith('.mkv') || 
                             fileName.endsWith('.srt') || fileName.endsWith('.vtt') || 
                             fileName.endsWith('.zip');
            return !isDir && !blackList.includes(f) && isTarget;
        });

        if (!finalFile) {
            await client.sendMessage(chatId, { message: "❌ වීඩියෝ හෝ Subtitles ගොනුවේ දෝෂයක්..." });
            process.exit(1);
        }

        const fileName = finalFile.toLowerCase();
        let caption = "";
        let successMsg = "";

        // 3. ෆයිල් වර්ගය අනුව මැසේජ් එක සැකසීම
        if (fileName.endsWith('.mp4') || fileName.endsWith('.mkv')) {
            successMsg = "💚 Video Upload Successfully...";
            caption = `💚 *Video Upload Successfully...*\n\n📦 *File :* ${finalFile}\n\n🏷️ *Mflix WhDownloader*\n💌 *Made With Sashika Sandras*\n\n☺️ Mflix භාවිතා කළ ඔබට සුභ දවසක්...කරුණාකර Report කිරීමෙන් වළකින්...💝`;
        } else if (fileName.endsWith('.srt') || fileName.endsWith('.vtt')) {
            successMsg = "💚 Subtitles Upload Successfully...";
            caption = `💚 *Subtitles Upload Successfully...*\n\n📦 *File :* ${finalFile}\n\n🏷️ *Mflix WhDownloader*\n💌 *Made With Sashika Sandras*\n\n☺️ Mflix භාවිතා කළ ඔබට සුභ දවසක්...කරුණාකර Report කිරීමෙන් වළකින්...💝`;
        } else {
            caption = `📦 *File :* ${finalFile}\n\n🏷️ *Mflix WhDownloader*\n💌 *Made With Sashika Sandras*`;
        }

        await client.sendMessage(chatId, { message: "📤 Upload වෙමින් පවතී..." });

        // 4. ෆයිල් එක යැවීම
        await client.sendFile(chatId, {
            file: finalFile,
            caption: caption,
            parseMode: "markdown",
            forceDocument: true, 
            workers: 16
        });

        console.log("✅ Done!");
        fs.unlinkSync(finalFile);
        process.exit(0);

    } catch (err) {
        console.error("❌ Error:", err.message);
        try {
            await client.sendMessage(chatId, { message: "❌ වීඩියෝ හෝ Subtitles ගොනුවේ දෝෂයක්..." });
        } catch (e) {}
        process.exit(1);
    }
})();
