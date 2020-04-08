//TODO: maybe one init function that takes options object
const GLOBALS = require('./globals'),
    TEAMS = GLOBALS.teams,
    teamCodes = GLOBALS.teamCodes,
    passingMenuSelector = '#all_passing',
    passingCsvSelector = '#csv_passing',
    rushRecMenuSelector = '#all_rushing_and_receiving',
    rushRecCsvSelector = '#csv_rushing_and_receiving',
    passFileName = '/passing',
    rushRecFileName = '/rushRec',
    weekCodes = GLOBALS.weekCodes;
let exportedPageSelectors = [];

/**
 * @class
 * @desc - Team name and PFF code pairing
 */
class TeamCode {
    constructor(name) {
        this.name = name;
        var index = TEAMS.findIndex((el) => el === name);
        this.code = teamCodes[index];
    }
}

/**
 * @class
 * @desc - object used to navigate to page, find data and download it
 */
class PageSelector {
    constructor(url, menuSelectors, csvSelectors, fileNames, all, passing, rushRec, whole) {
        const baseURL = 'https://www.pro-football-reference.com';
        this.url = baseURL + url;
        switch (true) {
            case all:
                this.menuSelectors = menuSelectors;
                this.csvSelector = csvSelectors;
                this.fileName = fileNames;
                break;
            case passing:
                this.menuSelectors = [menuSelectors[0]];
                this.csvSelector = [csvSelectors[0]];
                this.fileName = [fileNames[0]];
                break;
            case rushRec:
                this.menuSelectors = [menuSelectors[1]];
                this.csvSelector = [csvSelectors[1]];
                this.fileName = [fileNames[1]];
                break;
            case whole:
                this.menuSelectors = [menuSelectors[2]];
                this.csvSelector = [csvSelectors[2]];
                this.fileName = [fileNames[2]];
                break;
        }
    }
}

/**
 * @class
 * @description - PageSelector object specific to team data
 */
class TeamPageSelector extends PageSelector {
    constructor(teamObj, year, passing = true, rushRec = true) {
        const all = passing && rushRec,
            menuSelectorArr = [passingMenuSelector, rushRecMenuSelector],
            csvSelectorArr = [passingCsvSelector, rushRecCsvSelector],
            fileNameArr = [teamObj.name + '/' + year + passFileName, teamObj.name + '/' + year + rushRecFileName],
            url = '/teams/' + teamObj.code + '/' + year + '.htm'

        super(url, menuSelectorArr, csvSelectorArr, fileNameArr, all, passing, rushRec);
    }
}

/**
 * @class
 * @description - PageSelector object specific to total league offensive data
 */
class LeagueOffensePageSelector extends PageSelector {
    constructor(year, passing = true, rushing = true, whole = true) {
        const url = '/years/' + year + '/',
            menuSelectorArr = [passingMenuSelector, '#all_rushing', '#all_team_stats',],
            csvSelectorArr = [passingCsvSelector, '#csv_rushing', '#csv_team_stats'],
            fileNameArr = ['all/' + year + '/passingOffense', 'all/' + year + '/rushingOffense', 'all/' + year + '/allTeamOffense'],
            all = passing && rushing && whole;

        super(url, menuSelectorArr, csvSelectorArr, fileNameArr, all, passing, rushing, whole);
    }
}

/**
 * @class
 * @description - PageSelector object specific to total league defensive data
 */
class LeagueDefensePageSelector extends PageSelector {
    constructor(year, passing = true, rushing = true, whole = true) {
        const url = '/years/' + year + '/opp.htm',
            menuSelectorArr = [passingMenuSelector, '#all_rushing', '#all_team_stats'],
            csvSelectorArr = [passingCsvSelector, '#csv_rushing', '#csv_team_stats'],
            fileNameArr = ['all/' + year + '/passingDefense', 'all/' + year + '/rushingDefense', 'all/' + year + '/allTeamDefense'],
            all = passing && rushing && whole;

        super(url, menuSelectorArr, csvSelectorArr, fileNameArr, all, passing, rushing, whole);
    }
}

class TeamWeeklyPageSelector {
    constructor(year, week) {
        const baseURL = 'https://www.pro-football-reference.com';
        this.url = `${baseURL}/years/${year}/${week}.htm`;
        this.week = week;
        //this.linkSelector = '.gamelink a';

        //this.offMenuSelector = '#all_player_offense';
        //this.offCsvSelector = '#csv_player_offense';
        //this.defMenuSelector = '#all_player_defense';
    }
}

/**
 * @private
 * @function getTeamCodes
 * @description - get an array of TeamCode objects {teamName, pffTeamCode}
 * @param {Array} - array of team names that will be used in scrape job
 * @returns {Array} - array of TeamCode Objects
 */
function getTeamCodes(teams) {
    const teamCodesArr = [];
    teams.forEach(element => {
        teamCodesArr.push(new TeamCode(element));
    });
    console.log(teamCodesArr);
    return teamCodesArr;
}

/**
 * @private
 * @param {Array} teams - array of TeamCodes Objects to be used in scrape
 * @param {string} year - year to scan
 * @returns {Array} exportedPageSelectors - array of PageSelector Objects for passing
 * @desc adds page selector objects for team passing stats
 */
function getTeamSelectors(teams, year, passing = true, rushRec = true) {
    for (var i = 0; i < teams.length; i++) {
        exportedPageSelectors.push(
            new TeamPageSelector(
                teams[i],
                year,
                passing,
                rushRec
            )
        );
    }
    return exportedPageSelectors;
}

/**
 * @private
 * @param {string} year - year to scan
 * @description creates PageSelectors for offensive and defensive league data
 */
function getLeagueSelectors(year) {
    getLeagueOffenseSelectors(year);
    getLeagueDefenseSelctors(year);
}

/**
 * @public
 * @param {string} year - year to scan
 * @param {boolean} pass - include offensive passing in page selectors
 * @param {boolean} rush - include offensive rushing in page selectors
 * @param {boolean} whole - include 'whole' offensive in page selectors
 */
function getLeagueOffenseSelectors(year, pass = true, rush = true, whole = true) {
    exportedPageSelectors.push(
        new LeagueOffensePageSelector(year, pass, rush, whole)
    );
}

/**
 * @public
 * @param {string} year - year to scan
 * @param {boolean} pass - include defensive passing in page selectors
 * @param {boolean} rush - include defensive rushing in page selectors
 * @param {boolean} whole - include 'whole' defensive in page selectors
 */
function getLeagueDefenseSelctors(year, pass = true, rush = true, whole = true) {
    exportedPageSelectors.push(
        new LeagueDefensePageSelector(year, pass, rush, whole)
    );
}

/**
 * @public
 * @param {array} missingTeams 
 * @param {string} year 
 */
function fixTeamsPass(missingTeams, year) {
    exportedPageSelectors = [];
    const scanMissingTeams = getTeamCodes(missingTeams);
    getTeamSelectors(scanMissingTeams, year, true, false);
    return exportedPageSelectors;
}

/**
 * @public
 * @param {array} missingTeams 
 * @param {string} year 
 */
function fixTeamsRushRec(missingTeams, year) {
    exportedPageSelectors = [];
    const scanMissingTeams = getTeamCodes(missingTeams);
    getTeamSelectors(scanMissingTeams, year, false, true);
    return exportedPageSelectors;
}

/**
 * 
 * @param {string} year 
 * TODO: this isn't done
 */
function initWeeklyTeam(year) {
    exportedPageSelectors = [];
    for (var i = 0; i < weekCodes.length; ++i) {
        exportedPageSelectors.push(
            new TeamWeeklyPageSelector(
                year,
                weekCodes[i]
            )
        );
    }
    console.log(exportedPageSelectors);
    return exportedPageSelectors;
}

/**
 * 
 * @param {*} year 
 * @param {*} teams 
 */
function fixTeams(year, teams) {
    exportedPageSelectors = [];
    if (teams) {
        const scanTeams = getTeamCodes(teams);
        getTeamSelectors(scanTeams, year);
    }
    return exportedPageSelectors;
}

/**
 * @public
 * @param {string} year 
 * @param {array} teams 
 */
function init(year, teams = TEAMS) {
    exportedPageSelectors = [];
    const scanTeams = getTeamCodes(teams);
    getTeamSelectors(scanTeams, year);
    getLeagueSelectors(year);
    return exportedPageSelectors;
}

module.exports = {
    init: init,
    //fixTeamsPass: fixTeamsPass,
    //fixTeamsRushRec: fixTeamsRushRec,
    getLeagueOffenseSelectors: getLeagueOffenseSelectors,
    getLeagueDefenseSelctors: getLeagueDefenseSelctors,
    getLeagueSelectors: getLeagueSelectors,
    initWeeklyTeam: initWeeklyTeam,
    fixTeams: fixTeams
}