const puppeteer = require('puppeteer'),
    cheerio = require('cheerio'),
    fs = require('fs-extra');

const url = 'https://www.pro-football-reference.com/years/2017/';

async function scrape() {
    const browser = await puppeteer.launch({
        headless: false
    });
    const page = await browser.newPage();

    await page.goto(url, {waitUntil: 'domcontentloaded'});

    await page.waitFor('#all_rushing .hasmore li:nth-of-type(4) button');

    let html = await page.content();

    const $ = cheerio.load(html);

    await page.hover('#all_rushing.table_wrapper .hasmore');

    const tableMenu = await page.$('#all_rushing .hasmore');

    await tableMenu.hover();

    await page.waitFor('.drophover');
    //
    const csvBtn = await page.$('#all_rushing .hasmore li:nth-of-type(4) button');

    let test = await page.$eval('#all_rushing .hasmore li:nth-of-type(4) button', (element) => {
      return element.innerHTML
    });
    console.log(test);

    await csvBtn.click();


    const content = await page.$('.table_outer_container');
    console.log('breaking where expected?');

    await page.waitFor('#csv_rushing');

    let text = await page.evaluate(() => document.querySelector('#csv_rushing').innerHTML);
    text = text.slice(19, -1).trim();
    console.log(text);

    await browser.close();

    await writeCSVFiles(text);
}

async function writeCSVFiles(data) {
    try {
        fs.outputFile('./data_files_test/rushingOffense.csv', data);
    } catch (error) {
        console.log(error);
    }
}

scrape();
