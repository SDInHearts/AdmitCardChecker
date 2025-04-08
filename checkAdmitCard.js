const axios = require('axios');
const cheerio = require('cheerio');

// 📝 CONFIGURATION
const urls = [
    'http://dgfood.teletalk.com.bd/admitcard/',
    'http://ndr.teletalk.com.bd/admitcard/',
    'http://tici.teletalk.com.bd/admitcard/',
    'http://eedmoe.teletalk.com.bd/admitcard/',
    'http://dpe.teletalk.com.bd/admitcard/',
    // Add more URLs here
];

const targetText = 'Admit Card has not been published yet!';

// 🟢 Your Telegram Bot Token and Chat ID
const botToken = '7535728447:AAELYrApQ7kS0DXCjcjOXX_4dTYa-o3Kbbo';     // Replace with your actual Bot token
const chatId = '1835034927';         // Replace with your actual Chat ID

// ✅ Send Telegram Message
async function sendTelegramMessage(botToken, chatId, message) {
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await axios.post(telegramUrl, {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
    });
}

// 🔍 Check a single URL
async function checkAdmitCard(url) {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const fullTitle = $('title').text().trim();
        const cleanTitle = fullTitle.split('|')[0].trim();

        const bodyText = $('body').text();
        const isPublished = !bodyText.includes(targetText);

        let admitLink = null;

        if (isPublished) {
            $('a').each((_, el) => {
                const linkText = $(el).text().toLowerCase();
                const href = $(el).attr('href') || '';
                if (linkText.includes('admit') || href.toLowerCase().includes('admit')) {
                    admitLink = href;
                    return false; // break loop
                }
            });
        }

        const admitUrl = admitLink
            ? new URL(admitLink, url).href
            : url;

        return { result: isPublished, title: cleanTitle, link: admitUrl };
    } catch (error) {
        console.error(`Error checking ${url}:`, error.message);
        return { result: false, title: 'Error', link: null };
    }
}

// 🚀 Main
(async () => {
    let allSuccessful = true;
    let message = `📢 *Checker List*\n\n`;

    for (const url of urls) {
        const { result, title, link } = await checkAdmitCard(url);
        if (!result) allSuccessful = false;

        message += `${result ? '✅' : '❌'} *${title}*\n`;
        message += result
            ? `🔗 [Download Admit Card](${link})\n\n`
            : `⛔ Not Published Yet\n\n`;
    }

    await sendTelegramMessage(botToken, chatId, message);
    // process.exit(allSuccessful ? 0 : 1);
})();
