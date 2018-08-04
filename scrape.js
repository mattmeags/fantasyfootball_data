const puppeteer = require('puppeteer'),
    cheerio = require('cheerio');

const url = 'https://www.pro-football-reference.com/years/2017/'

async function run() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(url);
    //await page.waitFor('#csv_team_stats');

    await page.click('#all_team_stats .hasmore li:nth-of-type(4) button');

    let html = await page.content();

    const $ = cheerio.load(html);

    await console.log($('#all_team_stats .hasmore').html());

    await browser.close();
}

run();
