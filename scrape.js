//TODO: option to set year
//TODO: option to set output path
const puppeteer = require('puppeteer'),
    fs = require('fs-extra'),
    pageselectors = require('./pageselectors'),
    GLOBALS = require('./globals'),
    TEAMS = GLOBALS.teams,
    TEAMCODES = GLOBALS.teamCodes,
    WEEKCODES = GLOBALS.weekCodes,
    utils = require('./utils');

let browser,
    page,
    year = '2019',
    pageSelectors = pageselectors.init(year, TEAMS),
    //TODO: this i don't believe is needed as specifc scrape uses its own data structure
    weeks = WEEKCODES;


async function init() {
    await initData();
    await initWeekly();
    await parseCheck();
}

/**
 * @function initData
 * @description launches headless browser and calls scrape of each data set 
 */
async function initData() {
    //pageSelectors = pageselectors.init(year, TEAMS);
    if (pageSelectors.length === 0) {
        console.log('JOB COMPLETE');
        return;
    }
    browser = await puppeteer.launch({
        args: ["--proxy-server='direct://'", '--proxy-bypass-list=*'],
        headless: true
    });
    for (let i = 0; i < pageSelectors.length; i++) {
        page = await browser.newPage();
        await scrape(pageSelectors[i]);
        await page.close();
    }

    await browser.close();

    //await parseCheck();
}

async function initWeekly() {
    browser = await puppeteer.launch({
        args: ["--proxy-server='direct://'", '--proxy-bypass-list=*'],
        headless: true
    });
    console.log('WEEKS: ', weeks)
    for (let i = 0; i < weeks.length; i++) {

        page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36')
        await page.goto(`https://www.pro-football-reference.com/years/${year}/${weeks[i]}.htm`, { waitUntil: 'domcontentloaded' });

        const gamesSelector = '.game_summaries .game_summary';
        await page.waitFor(gamesSelector);

        const numberOfGames = await page.$$eval(gamesSelector, gameSelector => gameSelector.length);

        await page.evaluate(() => document.querySelector('.game_summaries .game_summary:first-of-type .gamelink a').click());
        await console.log('should have opened first game');
        let j = 1;
        while (j < numberOfGames + 1) {
            await j++;
            await console.log(j);
            await console.log(numberOfGames);

            await scrapeWeekly(weeks[i], year);

            if (j <= numberOfGames) {
                let nextSelector = `.game_summaries .game_summary:nth-of-type(${j}) .gamelink a`;
                await page.waitFor(nextSelector);
                let nextGameLink = await page.$(nextSelector);
                await console.log(nextSelector);
                await nextGameLink.click();
            }
        }
        await page.close();
    }
    await browser.close();
    //await parseCheck();
}

/**
 * @function scrape
 * @description scrapes the webpage on the headless browsers and gets the needed csv data
 * @param {Object} table - data object whos properties are used to scrape the page
 * @param {Object} browser - the puppeteer headless browser object
 */
async function scrape(table) {
    try {

        //page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36')
        console.log(table)
        console.log(table.url);
        await page.goto(table.url, { waitUntil: 'networkidle2' }); //domcontentloaded

        await console.log('loaded url');

        //await page.waitFor('#all_team_stats .hasmore li:nth-of-type(4) button');

        let html = await page.content();
        //const $ = cheerio.load(html);

        //await page.hover('#all_team_stats .hasmore');

        //all table properties should have same length execpt url which is a string and not an array
        for (let i = 0; i < table.menuSelectors.length; i++) {
            const hoverSelector = table.menuSelectors[i] + ' .hasmore';
            await console.log(hoverSelector);

            //const tableMenu = await page.$('#all_team_stats .hasmore');
            //const tableMenu = await page.$(hoverSelector);

            //console.log(tableMenu.html());

            await page.waitFor(hoverSelector);
            await page.hover(hoverSelector, { visible: true });

            //hacky but seems to work
            try {
                await page.waitFor('.drophover', { visible: true });
            } catch (e) {
                await page.hover(hoverSelector, { visible: true });
                await page.waitFor('.drophover', { visible: true });
            }


            const csvBtnSelector = hoverSelector + ' li:nth-of-type(4) button';
            //const csvBtn = await page.$('#all_team_stats .hasmore li:nth-of-type(4) button');

            await console.log(csvBtnSelector);
            const csvBtn = await page.$(csvBtnSelector);
            await console.log('after hover wait and button query');
            //await console.log(csvBtn);

            await page.waitFor(csvBtnSelector, { visible: true });
            await csvBtn.click();
            await console.log('after click');
            //TODO: commenting out cause I don't know if these do anything
            // const content = await page.$('.table_outer_container');

            // await page.$eval('.table_outer_container', (element) => {
            //     console.log(element.innerHTML);
            // });

            await page.waitFor(table.csvSelector[i]);
            await console.log('after waiting for csv table');
            await console.log(table.csvSelector[i]);

            let text = await page.evaluate(() => document.querySelector('[id^="csv_"]').innerHTML);
            //csv plain text loaded w/ HTML comment, this removes comment
            text = await text.slice(19, -1).trim();
            await console.log(text);

            await writeCSVFiles(text, table.fileName[i]);
            //await page.mouse.move(100, 100);
            await page.reload();

        }
        //await page.close();
        await console.log('end...');
        return;

    } catch (error) {
        console.log('==========================error==================');
        console.log(error);
    }

}

async function scrapeWeekly(week, year) {
    try {

        const teamCodeLinkSelector = '.linescore td > a';
        await page.waitFor(teamCodeLinkSelector, { visible: true });
        let teamCode = await page.$$eval(teamCodeLinkSelector, links => {
            // Get the team code by substringing - 7 chars if after '/teams/' and 3 for team code 
            // Winner will be first in this list and first in the table
            return links.map(link => link.pathname.substr(7, 3));
        });

        await console.log(teamCode);
        const offenseTableRow = 'table#player_offense tbody tr';
        await page.waitFor(offenseTableRow, { visible: true });
        // CSV data has both teams grouped together - this gives us what row to break apart
        let dividerRowNumber = await page.$$eval(offenseTableRow, rows => {
            let rowCount = 0;
            for (row of rows) {
                if (row.className != 'over_header thead') {
                    rowCount++;
                } else {
                    break;
                }
            }
            return rowCount;
        });


        //TODO: this is all taken from the above, once working try to modularize
        const hoverSelector = '#all_player_offense .hasmore';

        console.log('after hover');
        const csvBtnSelector = hoverSelector + ' li:nth-of-type(4) button';
        await page.waitFor(csvBtnSelector, { visible: true });

        await console.log(csvBtnSelector);
        await console.log('after hover wait and button query');

        let result = await page.evaluate((selector) => document.querySelector(selector).click(), csvBtnSelector);
        await console.log(result);
        await console.log('after csv click');
        await page.waitFor('#csv_player_offense', { visible: true });
        await console.log('after waiting for csv table');

        let text = await page.evaluate(() => document.querySelector('[id^="csv_"]').innerHTML);
        //csv plain text loaded w/ HTML comment, this removes comment
        text = await text.slice(19, -1).trim();
        await console.log(text);
        //END repeated
        let rows = text.split('\n');
        //skip the 2 headings
        rows.shift();
        rows.shift();

        let teamStorage = [
            {
                //TODO: This could be a good utility
                name: TEAMS[TEAMCODES.indexOf(teamCode[0])],
                csv: []
            },
            {
                name: TEAMS[TEAMCODES.indexOf(teamCode[1])],
                csv: []
            }
        ]
        await console.log(teamStorage);

        for (let i = 0; i < rows.length; i++) {
            if (i < dividerRowNumber) {
                teamStorage[0].csv.push(rows[i]);
            } else {
                teamStorage[1].csv.push(rows[i]);
            }
        }
        const fileName1 = `${teamStorage[0].name}/${year}/${week}`;
        const fileName2 = `${teamStorage[1].name}/${year}/${week}`
        await writeCSVFiles(teamStorage[0].csv, fileName1);
        await writeCSVFiles(teamStorage[1].csv, fileName2);

    } catch (error) {
        console.log('==========================error==================');
        console.log(error);
    }
}

async function initScrapeSpecificGameByWeek(missingWeeks) {

    try {
        browser = await puppeteer.launch({
            args: ["--proxy-server='direct://'", '--proxy-bypass-list=*'],
            headless: true
        });
        page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36')
        for (let i = 0; i < missingWeeks.length; i++) {
            await page.goto(`https://www.pro-football-reference.com/years/${missingWeeks[i].year}/${missingWeeks[i].week}.htm`, { waitUntil: 'networkidle2' })

            const code = utils.getCodeFromName(missingWeeks[i].team);

            await console.log(missingWeeks[i]);

            await page.waitFor('.game_summaries', { visibile: true });
            const gameExists = await page.$(`.game_summaries a[href*="${code}"]`);

            if (gameExists) {
                await page.evaluate(code => {
                    const gameSummary = document.querySelector(`.game_summaries a[href*="${code}"]`).closest('.game_summary');
                    gameSummary.querySelector('.gamelink a').click();
                }, code);

                await scrapeWeekly(missingWeeks[i].week, missingWeeks[i].year)
            }

        }
        await page.close();
        await browser.close();
        await parseCheck();
    } catch (error) {
        console.log('==========================error==================');
        console.log(error);
    }

}

/**
 * @function writeCSVFiles
 * @description - takes raw data and writes it to a csv file
 * @param {string | array} data - raw data in comma seperated value format
 * @param {string} fileName - file name of the csv file to write too
 */
async function writeCSVFiles(data, fileName) {
    try {
        const fullPath = 'data_files/csv/' + fileName + '.csv';
        console.log(fullPath);
        if (typeof data === 'string') {
            fs.outputFile(fullPath, data);
        } else {
            fs.exists(fullPath, exists => {
                if (!exists) {
                    for (line of data) {
                        fs.appendFile(fullPath, line + '\n', (err) => {
                            if (err) {
                                throw err;
                            }
                            console.log('updated');
                        });
                    }
                } else {
                    console.log('file exists');
                }
            });
        }

    } catch (error) {
        console.log(error);
    }
}

/**
 * @function parseCheck
 * @description checks that the scrape was successful and all csv files were created, and if not creates a new pageselector object of everything missing and reruns the scrape
 */
//TODO: need to figure out out to handle bye week
async function parseCheck() {

    const filesPerTeamFolder = 18, //2 - for 2018
        teamFiles = ['passing.csv', 'rushRec.csv', 'week_1.csv', 'week_2.csv', 'week_3.csv', 'week_4.csv', 'week_5.csv', 'week_6.csv', 'week_7.csv', 'week_8.csv', 'week_9.csv', 'week_10.csv', 'week_11.csv', 'week_12.csv', 'week_13.csv', 'week_14.csv', 'week_15.csv', 'week_16.csv', 'week_17.csv'],
        allFolderFiles = ['allTeamOffense', 'passingOffense', 'rushingOffense', 'allTeamDefense', 'passingDefense', 'rushingDefense'],
        expectedFolders = new Array('all').concat(TEAMS),
        numFilesInAllFolder = allFolderFiles.length;

    let newPageSelectors = [],
        missingPassTeams = [],
        missingRushRecTeams = [],
        //I think we have to re scan a week if one is missing because we cant go to weekly games by team, but by game
        missingWeeks = [];

    console.log('parseCheck');
    fs.readdir('data_files/csv/', async (err, createdFolders) => {
        console.log('READING first dir??');
        // FOLDER CHECKING
        let missingFolders = expectedFolders.filter(folderName => !createdFolders.includes(folderName));

        if (missingFolders.includes('all')) {
            // handle all folder not existing
            newPageSelectors = newPageSelectors.concat(pageselectors.getLeagueSelectors(year));
            if (missingFolders.length > 1) {
                // All folder is missing but other folders are missing as well
                const otherMissingFolders = missingFolders.splice(missingFolders.indexOf('all'), missingFolders.indexOf('all') + 1);
                newPageSelectors = newPageSelectors.concat(pageselectors.init(otherMissingFolders, year));
            }
        } else if (missingFolders.length > 0) {
            // All folder exists, just team folders missing
            const missingTeamSelectors = pageselectors.init(missingFolders, year);
            newPageSelectors = newPageSelectors.concat(missingTeamSelectors);
        }
        // FILE CHECKING
        for (let i = 0; i < createdFolders.length; i++) {
            let createdFiles = fs.readdirSync(`data_files/csv/${createdFolders[i]}/${year}`);
            if (createdFolders[i] === 'all') {
                if (createdFiles.length != numFilesInAllFolder) {
                    // Checking missing files in the all folder
                    let missingAllFiles = allFolderFiles.filter(fileName => !createdFiles.includes(fileName));

                    if (!missingAllFiles.includes('allTeamOffense')) {
                        newPageSelectors = newPageSelectors.concat(pageselectors.getLeagueOffenseSelectors(year, false, false));
                    }
                    if (!missingAllFiles.includes('passingOffense')) {
                        newPageSelectors = newPageSelectors.concat(pageselectors.getLeagueOffenseSelectors(yaer, true, false, false));
                    }
                    if (!missingAllFiles.includes('rushingOffense')) {
                        newPageSelectors = newPageSelectors.concat(pageselectors.getLeagueOffenseSelectors(year, false, true, false));
                    }
                    if (!missingAllFiles.includes('allTeamDefense')) {
                        newPageSelectors = newPageSelectors.concat(pageselectors.getLeagueDefenseSelctors(year, false, false));
                    }
                    if (!missingAllFiles.includes('passingDefense')) {
                        newPageSelectors = newPageSelectors.concat(pageselectors.getLeagueDefenseSelctors(year, true, false, false));
                    }
                    if (!missingAllFiles.includes('rushingDefense')) {
                        newPageSelectors = newPageSelectors.concat(pageselectors.getLeagueDefenseSelctors(year, false, true, false));
                    }
                }
            } else {
                // Check missing files in team folders
                if (createdFiles.length < filesPerTeamFolder) {
                    console.log(createdFolders[i]);
                    let missingTeamFiles = teamFiles.filter(fileName => !createdFiles.includes(fileName));
                    console.log('createdTeamFiles: ', createdFiles);
                    console.log('missingTeamFiles: ', missingTeamFiles);
                    if (missingTeamFiles.includes('passing.csv')) {
                        console.log('missingPassTeam: ', createdFolders[i]);
                        missingPassTeams.push(createdFolders[i]);
                    }
                    if (missingTeamFiles.includes('rushRec.csv')) {
                        console.log('missingRushRecTeam: ', createdFolders[i]);
                        missingRushRecTeams.push(createdFolders[i]);
                    }
                    // Look for weekly files
                    for (week of WEEKCODES) {
                        if (missingTeamFiles.includes(`${week}.csv`)) {
                            missingWeeks.push({
                                team: createdFolders[i],
                                week: week,
                                year: year
                            });
                        }
                    }
                }
            }
        }
        const missingTeams = utils.arrayUnique(missingPassTeams.concat(missingRushRecTeams));

        console.log(missingPassTeams);
        console.log(missingRushRecTeams);
        console.log('missingteams: ', missingTeams)
        newPageSelectors = newPageSelectors.concat(pageselectors.fixTeams(year, missingTeams));
        console.log('NEW PAGE SELECTORS: ', newPageSelectors);
        pageSelectors = [];
        pageSelectors = pageSelectors.concat(newPageSelectors);
        console.log('PAGE SELECTORS: ', pageSelectors);
        console.log('missing weeks: ', missingWeeks);


        if (pageSelectors.length) {
            console.log('pageSelectors: ', pageSelectors);
            await initData();
        }
        if (missingWeeks.length) {
            await initScrapeSpecificGameByWeek(missingWeeks);
        }

    });
}

//parseCheck();
//initData();
//initWeekly();
init();
