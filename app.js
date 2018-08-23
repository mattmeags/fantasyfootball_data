const puppeteer = require('puppeteer'),
    cheerio = require('cheerio'),
    fs = require('fs-extra'),
    tableInfoObject = require('./pageselectors');

let browser, page;



async function initData() {
    const dataTables = Object.keys(tableInfoObject);
    console.log(dataTables)

    for (let i = 0; i < dataTables.length; i++) {
        console.log(i);
        await scrape(tableInfoObject[dataTables[i]]);
        //console.log(tableInfoObject[dataTables[i]]);
    }

}

async function scrape(table) {
    try {
        console.log(table);

        browser = await puppeteer.launch({
            //headless: false
        });
        page = await browser.newPage();
        await page.goto(table.url, {waitUntil: 'domcontentloaded'});

        await console.log('loaded url');

        //await page.waitFor('#all_team_stats .hasmore li:nth-of-type(4) button');

        let html = await page.content();
        const $ = cheerio.load(html);

        //await page.hover('#all_team_stats .hasmore');

        const hoverSelector = table.menuSelector + ' .hasmore';
        await console.log(hoverSelector);
        //const tableMenu = await page.$('#all_team_stats .hasmore');
        const tableMenu = await page.$(hoverSelector);

        //console.log(tableMenu.html());

        await page.hover(hoverSelector)

        await page.waitFor('.drophover');

        const csvBtnSelector = hoverSelector + ' li:nth-of-type(4) button';
        //const csvBtn = await page.$('#all_team_stats .hasmore li:nth-of-type(4) button');
        await console.log(csvBtnSelector);
        const csvBtn = await page.$(csvBtnSelector);
        await console.log('after hover wait and button query');

        await csvBtn.click();
        await console.log('after click');
        const content = await page.$('.table_outer_container');

        await page.$eval('.table_outer_container', (element) => {
           console.log(element.innerHTML);
        });


        await page.waitFor(table.csvSelector);
        await console.log('after waiting for csv table');
        await console.log(table.csvSelector);

        let text = await page.evaluate(() => document.querySelector('[id^="csv_"]').innerHTML);
        text = await text.slice(19, -1).trim();
        await console.log(text);

        await writeCSVFiles(text, table.fileName);
        await console.log('end...');

        await browser.close();
    } catch (error) {
        console.log(error);
    }

}

async function writeCSVFiles(data, fileName) {
    try {
        const fullPath = './data_files_test/' + fileName + '.csv';
        fs.outputFile(fullPath, data);
    } catch (error) {
        console.log(error);
    }
}

initData();
