const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const cheerio = require('cheerio');
const schedule = require('node-schedule');

// Inisialisasi klien WhatsApp
const client = new Client({
   authStrategy: new LocalAuth() // Untuk menyimpan sesi secara lokal
});

client.on('qr', (qr) => {
   // Generate QR code di terminal
   qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
   console.log('Client is ready!');
});

// Fungsi untuk mengambil informasi game gratis dari Rock Paper Shotgun
async function getEpicGamesInfo() {
   try {
      const response = await axios.get("https://www.rockpapershotgun.com/epic-games-free-games-list");
      const html = response.data;
      const $ = cheerio.load(html);

      const results = [];
      const relevantSections = $("p:contains('free until'), p:contains('free from')");

      relevantSections.each((index, element) => {
         const parent = $(element);
         const text = parent.text().trim();

         const match = text.match(/(.+?free (until|from) .+)/);
         if (match) {
            const title = match[1];
            const linkTag = parent.find('a[href*="store.epicgames"]');
            if (linkTag.length) {
               const gameUrl = linkTag.attr('href');
               const descriptionTag = linkTag.next('p');
               const description = descriptionTag.text().trim();

               results.push({
                  Title: title,
                  Link: gameUrl,
                  Description: description
               });
            }
         }
      });

      return results;
   } catch (error) {
      console.error("Error fetching game info:", error);
      return [];
   }
}

// Handler untuk pesan masuk
client.on('message', async message => {
   if (message.body === '/hello') {
      message.reply('Hello, how can I help you?');
   } else if (message.body === '/games') {
      message.reply('Fetching game information...');

      // Ambil data game dan kirim ke pengguna
      const gamesInfo = await getEpicGamesInfo();
      if (gamesInfo.length > 0) {
         let responseMessage = "Here are the current free games on Epic Games:\n\n";
         gamesInfo.forEach(game => {
            responseMessage += `Title: ${game.Title}\nLink: ${game.Link}\nDescription: ${game.Description}\n\n`;
         });
         message.reply(responseMessage);
      } else {
         message.reply("Sorry, I couldn't find any free games at the moment.");
      }
   }
   else {
      message.reply("dongo");
   }
});

// Fungsi untuk mengirim notifikasi ke grup atau pengguna tertentu
async function notifyGroupOfNewGames() {
   const groupId = 'your_group_id';  // Ganti dengan ID grup atau nomor telepon
   const gamesInfo = await getEpicGamesInfo();

   if (gamesInfo.length > 0) {
      let notificationMessage = "Here are the current free games on Epic Games:\n\n";
      gamesInfo.forEach(game => {
         notificationMessage += `Title: ${game.Title}\nLink: ${game.Link}\nDescription: ${game.Description}\n\n`;
      });
      client.sendMessage(`${groupId}@g.us`, notificationMessage);  // Untuk grup
      // client.sendMessage(`${groupId}@s.whatsapp.net`, notificationMessage);  // Untuk pengguna
   }
}

// Jadwalkan untuk mengirim notifikasi setiap hari pada pukul 10:00 pagi
schedule.scheduleJob('0 10 * * *', notifyGroupOfNewGames);

// Memulai client
client.initialize();
