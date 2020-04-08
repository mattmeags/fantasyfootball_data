# Fantasy Football Data Scraper

This project scrapes data from pro--football-reference.com and outputs csv files for your use in any data visualization tools you may use. Files are organized by team (which shows individual player stats for the year) or by league (all) (which shows overall team stats for the year) and by weekly individual player stats per team. Currently only scrapes the previous year.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

You must have Node.js installed
Works on Node v9.5.0 (I haven't tested on any others, but would imagine its fine on later versions)


### Installing

A step by step series of examples that tell you how to get a development env running

Download this repo.

Then install all dependencies - open terminal or command line and enter:

```
cd path/to/downloaded/repo

npm install
```


## Running

In your terminal or command line run:
```
npm run scrape
```

### Please note this takes a while to run so please be patient.

I am working to improve speed, but right now its what you get.


## Built With

* [Puppeteer](https://github.com/puppeteer/puppeteer) - The web scraping framework
 

## Authors

* **Matt Meagher** - *Initial work* - [PurpleBooth](https://github.com/mattmeags)


## Acknowledgments

* Thanks to PFF for actually logging all the data.

