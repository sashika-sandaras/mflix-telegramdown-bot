const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

async function startTelegramBot() {
    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.USER_CHAT_ID || process.env.user_chat_id; 
    const fileId = process.env.FILE_ID;

    if (!token || !chatId || !fileId) {
        console.error("❌ Missing Required Environment Variables!");
        process.exit(1);
    }

    const bot = new TelegramBot(token, { polling: false });

    try {
        console.log(`🚀 Request Received for Chat: ${chatId}`);
        await bot.sendMessage(chatId, "🍿 *MFlix Engine:* Request Received...", { parse_mode: 'Markdown' });

        // --- 1. Google Drive එකෙන් Download කිරීම ---
        console.log("📥 Downloading from Google Drive...");
        await bot.sendMessage(chatId, "📥 *Download වෙමින් පවතී...*", { parse_mode: 'Markdown' });
        
        // gdown command එකේ --confirm-form-recovery අයින් කරලා --fuzzy සහ --id පාවිච්චි කරලා තියෙනවා
        try {
            execSync(`gdown --id ${fileId} --fuzzy --confirm`);
        } catch (downloadErr) {
            console.log("Retry download without fuzzy...");
            execSync(`gdown --id ${fileId} --confirm`);
        }

        // Download වුණු ෆයිල් එක සොයාගැනීම
        const currentFiles = fs.readdirSync('.');
        const ignoreFiles = ['send.js', 'package.json', 'node_modules', '.github', 'package-lock.json'];
        const finalFile = currentFiles.find(f => 
            !ignoreFiles.includes(f) && !fs.lstatSync(f).isDirectory()
        );

        if (!finalFile) throw new Error("File Download Failed! Please check if the Drive link is public.");

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
        
        // ලොකු ෆයිල් යවද්දී එන timeout අවුල් මගහැරීමට stream එකක් ලෙස යැවීම
        await bot.sendDocument(chatId, fs.createReadStream(finalFile), {
            caption: caption,
            parse_mode: 'Markdown'
        });

        console.log("✅ All Done!");
        
        // Cleanup
        if (fs.existsSync(finalFile)) fs.unlinkSync(finalFile);
        process.exit(0);

    } catch (err) {
        console.error("❌ Error:", err.message);
        try {
            await bot.sendMessage(chatId, "❌ *දෝෂයක් සිදු විය:* \n`" + err.message + "`");
        } catch (e) { console.log("Silent Error"); }
        process.exit(1);
    }
}

startTelegramBot();
