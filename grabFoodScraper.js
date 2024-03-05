const puppeteer = require('puppeteer');

class GrabFoodScraper {
    constructor(location) {
        this.location = location;
        this.data = [];
    }

    async scrape() {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('https://food.grab.com/sg/');

        try {
            console.log("hello1")
            await page.waitForSelector('input[name="location"]', { visible: true, timeout: 50000 }); 
            await page.type('input[name="location"]', this.location);
            console.log("hello2")
            await page.waitForSelector('.locationSuggestionItem', { visible: true, timeout: 50000 });
            await page.click('.locationSuggestionItem');
            await page.waitForSelector('.vendorTile', { visible: true, timeout: 10000 }); 

            const restaurants = await page.evaluate(() => {
                const restaurantNodes = document.querySelectorAll('.vendorTile');
                const restaurantList = [];
                restaurantNodes.forEach(node => {
                    const name = node.querySelector('.vendorName').innerText;
                    const cuisine = node.querySelector('.vendorCuisine').innerText;
                    const rating = node.querySelector('.vendorRating').innerText;
                    const deliveryTime = node.querySelector('.deliveryTime').innerText;
                    const distance = node.querySelector('.vendorDistance').innerText;
                    const offers = node.querySelector('.vendorPromotions').innerText;
                    const notice = node.querySelector('.vendorNotice') ? node.querySelector('.vendorNotice').innerText : "";
                    const imageLink = node.querySelector('.vendorImage img').getAttribute('src');
                    const isPromoAvailable = node.querySelector('.vendorPromotions') ? true : false;
                    const restaurantId = node.getAttribute('data-vendor-id');
                    const latitude = node.getAttribute('data-vendor-lat');
                    const longitude = node.getAttribute('data-vendor-lng');
                    const deliveryFee = node.querySelector('.deliveryFee').innerText;

                    restaurantList.push({ name, cuisine, rating, deliveryTime, distance, offers, notice, imageLink, isPromoAvailable, restaurantId, latitude, longitude, deliveryFee });
                });
                return restaurantList;
            });

            this.data = restaurants;
        } catch (error) {
            console.error('An error occurred during scraping:', error);
        } finally {
            await browser.close();
        }
    }

    saveDataToFile() {
        const fs = require('fs');
        const zlib = require('zlib');

        const jsonText = JSON.stringify(this.data);
        const jsonBuffer = Buffer.from(jsonText, 'utf-8');
        zlib.gzip(jsonBuffer, (err, result) => {
            if (err) throw err;
            fs.writeFile(`${this.location}_grab_food_data.ndjson.gz`, result, (err) => {
                if (err) throw err;
                console.log(`Data saved for ${this.location}`);
            });
        });
    }
}

async function main() {
    const locations = [
        "PT Singapore - Choa Chu Kang North 6, Singapore, 689577",
        "Chong Boon Dental Surgery - Block 456 Ang Mo Kio Avenue 10, #01-1574, Singapore, 560456"
    ];

    const tasks = locations.map(async location => {
        const scraper = new GrabFoodScraper(location);
        await scraper.scrape();
        scraper.saveDataToFile();
    });

    await Promise.all(tasks);
}

main().catch(error => {
    console.error('An error occurred:', error);
});

