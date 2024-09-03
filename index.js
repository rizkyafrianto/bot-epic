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
      const $ = cheerio.load(data);

      // Menyimpan informasi game
      const games = [];

      // Temukan elemen yang berisi informasi tentang permainan gratis
      const relevantSections = $('h3:contains("free until"), h3:contains("free from")');

      if (relevantSections.length === 0) {
         console.log("Tidak ditemukan informasi permainan gratis.");
         return [];
      }

      relevantSections.each((index, element) => {
         const title = $(element).text();
         const link = $(element).find('a').attr('href');
         const description = $(element).next('p').text() || 'Deskripsi tidak tersedia';

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
      console.error('Terjadi kesalahan saat melakukan scraping:', error);
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
