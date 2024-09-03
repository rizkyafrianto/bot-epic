const axios = require('axios');
const cheerio = require('cheerio');

// Fungsi untuk melakukan scraping
async function scrapeWebsite() {
    try {
        const url = 'https://www.rockpapershotgun.com/epic-games-free-games-list';
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        // Temukan elemen yang berisi informasi tentang permainan gratis
        const relevantSections = $('h3:contains("free until"), h3:contains("free from")');

        if (relevantSections.length === 0) {
            console.log("Tidak ditemukan informasi permainan gratis.");
            return;
        }

        relevantSections.each((index, element) => {
            const title = $(element).text();
            const link = $(element).find('a').attr('href');
            const description = $(element).next('p').text() || 'Deskripsi tidak tersedia';

            console.log(`Judul: ${title}`);
            console.log(`Link: ${link}`);
            console.log(`Deskripsi: ${description}`);
            console.log('');
            console.log('-----------------------------------');
            console.log('');
        });

    } catch (error) {
        console.error('Terjadi kesalahan saat melakukan scraping:', error);
    }
}

// Jalankan fungsi scraping
scrapeWebsite();
