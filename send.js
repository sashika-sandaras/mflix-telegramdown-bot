const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

async function startTelegramBot() {
    const token = process.env.TELEGRAM_TOKEN; // BotFather ගෙන් ගත්ත Token එක
    const chatId = process.env.USER_CHAT_ID;  // ඔයාගේ Telegram Chat ID එක
    const fileId = process.env.FILE_ID;

    const bot = new TelegramBot(token, { polling: false });

    try {
        await bot.sendMessage(chatId, "✅ *Request Received...*", { parse_mode: 'Markdown' });
        await bot.sendMessage(chatId, "📥 *Download වෙමින් පවතී...*", { parse_mode: 'Markdown' });

        // --- Download Logic ---
        let finalFile = "";
        execSync(`gdown --fuzzy https://drive.google.com/uc?id=${fileId}`);
        
        const files = fs.readdirSync('.');
        finalFile = files.find(f => 
            !['send.js', 'package.json', 'node_modules', '.github', 'package-lock.json'].includes(f) && 
            !fs.lstatSync(f).isDirectory()
        );

        if (!finalFile) throw new Error("File Download Failed");

        await bot.sendMessage(chatId, "📤 *Upload වෙමින් පවතී...*", { parse_mode: 'Markdown' });

        const ext = path.extname(finalFile).toLowerCase();
        const isSub = ['.srt', '.vtt', '.ass'].includes(ext);
        let status = isSub ? "Subtitles Upload Successfully..." : "Video Upload Successfully...";

        let caption = `💚 *${status}*\n\n` +
                      `📦 *File :* ${finalFile}\n\n` +
                      `🏷️ *Mflix WhDownloader*\n` +
                      `💌 *Made With Sashika Sandras*\n\n` +
                      `☺️ *Mflix භාවිතා කළ ඔබට සුභ දවසක්...*\n` +
                      `*කරුණාකර Report කිරීමෙන් වළකින්න...* 💝`;

        // --- Telegram එකට Document එකක් ලෙස යැවීම ---
        await bot.sendDocument(chatId, fs.createReadStream(finalFile), {
            caption: caption,
            parse_mode: 'Markdown'
        });

        if (fs.existsSync(finalFile)) fs.unlinkSync(finalFile);
        process.exit(0);

    } catch (err) {
        console.error(err);
        await bot.sendMessage(chatId, "❌ *වීඩියෝ හෝ Subtitles ගොනුවේ දෝෂයක්...*");
        process.exit(1);
    }
}

startTelegramBot();
