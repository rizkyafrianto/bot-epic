const axios = require('axios');
const cheerio = require('cheerio');

const url = 'https://www.rockpapershotgun.com/epic-games-free-games-list';

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

// Fungsi utama untuk menampilkan hasil
(async () => {
   const games = await getEpicGamesInfo();
   if (games.length > 0) {
      console.log('Free games on Epic Games:');
      games.forEach(game => {
         console.log(`Title: ${game.Title}`);
         console.log(`Link: ${game.Link}`);
         console.log(`Description: ${game.Description}`);
         console.log('---');
      });
   } else {
      console.log("No free games found.");
   }
})();
