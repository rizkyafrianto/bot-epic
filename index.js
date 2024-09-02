const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const cheerio = require('cheerio');
const schedule = require('node-schedule');

// URL untuk scraping
const url = 'https://www.rockpapershotgun.com/epic-games-free-games-list';

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
      // Ambil HTML dari situs
      const { data } = await axios.get(url);

      // Load HTML ke cheerio
      const $ = cheerio.load(data);

      // Menyimpan informasi game
      const games = [];

      // Menargetkan elemen yang mengandung informasi game
      $('.article_body .article_body_content').each((index, element) => {
         // Ambil elemen h3
         const h3Element = $(element).find('h3');
         const title = h3Element.text().trim();

         // Ambil elemen a di dalam h3
         const linkElement = h3Element.find('a');
         const link = linkElement.attr('href');

         // Ambil deskripsi jika ada
         const description = $(element).find('.post-excerpt').text().trim();

         if (title && link) {
            games.push({
               Title: title,
               Link: link.startsWith('http') ? link : `https://www.rockpapershotgun.com${link}`,
               Description: description
            });
         }
      });

      return games;
   } catch (error) {
      console.error('Error fetching data:', error);
      return [];
   }
}

// Handler untuk pesan masuk
client.on('message', async message => {
   if (message.body.startsWith('/')) {
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
      } else {
         message.reply("Invalid command. Please use '/hello' or '/games'.");
      }
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
