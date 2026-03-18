const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

async function startTelegramBot() {
    // Environment Variables ලබාගැනීම
    const token = process.env.TELEGRAM_TOKEN;
    // Google Script එකෙන් එවන ID එක (Capital හෝ Simple දෙකම බලනවා)
    const chatId = process.env.USER_CHAT_ID || process.env.user_chat_id; 
    const fileId = process.env.FILE_ID;

    if (!token || !chatId || !fileId) {
        console.error("❌ Missing Required Environment Variables!");
        process.exit(1);
    }

    const bot = new TelegramBot(token, { polling: false });

    try {
        console.log(`🚀 Starting for Chat ID: ${chatId}`);
        await bot.sendMessage(chatId, "🍿 *MFlix Engine:* Request Received...", { parse_mode: 'Markdown' });

        // --- 1. Google Drive එකෙන් Download කිරීම ---
        console.log("📥 Downloading from Google Drive...");
        await bot.sendMessage(chatId, "📥 *Download වෙමින් පවතී...*", { parse_mode: 'Markdown' });
        
        // gdown භාවිතයෙන් ෆයිල් එක ගැනීම
        execSync(`gdown --fuzzy https://drive.google.com/uc?id=${fileId} --confirm-form-recovery`);

        // Download වුණු ෆයිල් එකේ නම සොයාගැනීම
        const currentFiles = fs.readdirSync('.');
        const ignoreFiles = ['send.js', 'package.json', 'node_modules', '.github', 'package-lock.json'];
        const finalFile = currentFiles.find(f => 
            !ignoreFiles.includes(f) && !fs.lstatSync(f).isDirectory()
        );

        if (!finalFile) throw new Error("File Download Failed or Not Found!");

        console.log(`✅ Downloaded: ${finalFile}`);

        // --- 2. Telegram එකට Upload කිරීම ---
        await bot.sendMessage(chatId, "📤 *Upload වෙමින් පවතී...*", { parse_mode: 'Markdown' });

        const ext = path.extname(finalFile).toLowerCase();
        const isSub = ['.srt', '.vtt', '.ass'].includes(ext);
        const fileType = isSub ? "Subtitles" : "Video";

        let caption = `💚 *${fileType} Uploaded Successfully!* 🍿\n\n` +
                      `📦 *File :* \`${finalFile}\` \n\n` +
                      `🏷️ *Mflix WhDownloader*\n` +
                      `💌 *Made With Sashika Sandras*\n\n` +
                      `☺️ *Mflix භාවිතා කළ ඔබට සුභ දවසක්...*\n` +
                      `*කරුණාකර Report කිරීමෙන් වළකින්න...* 💝`;

        console.log("📤 Sending to Telegram...");
        
        // Document එකක් ලෙස යැවීම (Quality එක අඩුවෙන්නේ නැහැ)
        await bot.sendDocument(chatId, fs.createReadStream(finalFile), {
            caption: caption,
            parse_mode: 'Markdown'
        });

        console.log("✅ Process Completed Successfully!");
        
        // --- 3. පිරිසිදු කිරීම (Cleanup) ---
        if (fs.existsSync(finalFile)) {
            fs.unlinkSync(finalFile);
            console.log("🧹 Local file deleted.");
        }
        
        process.exit(0);

    } catch (err) {
        console.error("❌ Error occurred:", err.message);
        try {
            await bot.sendMessage(chatId, "❌ *දෝෂයක් සිදු විය:* \n" + err.message);
        } catch (e) { console.log("Could not send error message to user."); }
        process.exit(1);
    }
}

startTelegramBot();
