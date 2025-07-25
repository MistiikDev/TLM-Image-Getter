const puppeteer = require('puppeteer-extra');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const https = require('https');
const prompt = require('prompt');

prefix = "https://tiermaker.com/"

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const ua_anonymizer = require('puppeteer-extra-plugin-anonymize-ua');

puppeteer.use(StealthPlugin()).use(ua_anonymizer());

prompt.start();

async function main(set_url = "https://tiermaker.com/create/fnaf-characters") {
    const url = set_url;

    const browser = await puppeteer.launch({
        headless: true
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('#create-image-carousel', { visible: true });

    const data = await page.evaluate(() => {
        return document.querySelector('#create-image-carousel').innerHTML;
    });

    let $ = cheerio.load(data);
    const pngUrls = [];

    // Find all <img> elements and check their src attribute
    $('img').each((index, img) => {
        const src = $(img).attr('src');
        
        console.log(img)

        if (src && src.endsWith('png')) {
            pngUrls.push(prefix + src);
        }
    });

    console.log(pngUrls)

    if (pngUrls.length > 0) {
        console.log("Found PNG URLs:", pngUrls);
        await downloadImages(pngUrls);
    } else {
        console.log("No PNG images found.");
    }

    await browser.close();
}

async function downloadImages(urls) {
    for (const url of urls) {
        const fileName = path.basename(url + ".png");
        const filePath = path.join(__dirname, 'downloaded_images', fileName);

        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        // Download the image
        https.get(url, (response) => {
            const file = fs.createWriteStream(filePath);
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded: ${fileName}`);
            });
        }).on('error', (err) => {
            console.log(`Error downloading ${url}: ${err.message}`);
        });
    }
}

// Call main function with the provided URL
main();
