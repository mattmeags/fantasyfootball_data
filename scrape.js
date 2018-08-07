const puppeteer = require('puppeteer'),
    cheerio = require('cheerio'),
    fs = require('fs-extra');

const url = 'https://www.pro-football-reference.com/years/2017/'

async function scrape() {
    const browser = await puppeteer.launch({
        //headless: false
    });
    const page = await browser.newPage();

    await page.goto(url);

    await page.waitFor('#all_team_stats .hasmore li:nth-of-type(4) button');

    let html = await page.content();

    const $ = cheerio.load(html);

    await page.hover('#all_team_stats .hasmore');

    const tableMenu = await page.$('#all_team_stats .hasmore');

    await tableMenu.hover();

    await page.waitFor('.drophover');

    const csvBtn = await page.$('#all_team_stats .hasmore li:nth-of-type(4) button');

    await csvBtn.click();

    const content = await page.$('.table_outer_container');;

    await page.waitFor('#csv_team_stats');

    let text = await page.evaluate(() => document.querySelector('#csv_team_stats').innerHTML);
    text = text.slice(19, -1).trim();
    console.log(text);

    await browser.close();

    await writeCSVFiles(text);
}

async function writeCSVFiles(data) {
    try {
        fs.outputFile('./data_files/allTeamOffense.csv', data);
    } catch (error) {
        console.log(error);
    }
}

scrape();
