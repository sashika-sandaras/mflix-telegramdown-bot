const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

async function startTelegramBot() {
    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.USER_CHAT_ID || process.env.user_chat_id; 
    const fileId = process.env.FILE_ID;

    if (!token || !chatId || !fileId) {
        process.exit(1);
    }

    const bot = new TelegramBot(token, { polling: false });

    try {
        await bot.sendMessage(chatId, "🍿 *MFlix Engine:* Request Received...", { parse_mode: 'Markdown' });
        await bot.sendMessage(chatId, "📥 *Download වෙමින් පවතී...*", { parse_mode: 'Markdown' });
        
        // --- මෙන්න මෙතන තමයි වෙනස ---
        execSync(`gdown ${fileId}`);

        const currentFiles = fs.readdirSync('.');
        const ignoreFiles = ['send.js', 'package.json', 'node_modules', '.github', 'package-lock.json'];
        const finalFile = currentFiles.find(f => 
            !ignoreFiles.includes(f) && !fs.lstatSync(f).isDirectory()
        );

        if (!finalFile) throw new Error("File Download Failed!");

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

        await bot.sendDocument(chatId, fs.createReadStream(finalFile), {
            caption: caption,
            parse_mode: 'Markdown'
        });

        if (fs.existsSync(finalFile)) fs.unlinkSync(finalFile);
        process.exit(0);

    } catch (err) {
        console.error(err);
        await bot.sendMessage(chatId, "❌ *දෝෂයක් සිදු විය:* \n`" + err.message + "`");
        process.exit(1);
    }
}

startTelegramBot();
