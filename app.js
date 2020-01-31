const rp = require('request-promise');
const cheerio = require('cheerio');
const scrapeSeries = require('./scrapeAMCSeries');
const scrapeMovie = require('./scrapeAMCMovies');
const json2xls = require('json2xls');
const fs = require('fs');

// URI's to scrape
const URIMovie = 'https://www.amc.com/movies';
const URISeries = 'https://www.amc.com/full-episodes-archive';

// create excel from json function
function json2excel(data, fileName) {
  var xls = json2xls(data);
  fs.appendFileSync(fileName, xls, 'binary');
}

async function startMovies(url) {
  const res = await scrapeMovie.start(url);

  return res;
}

async function startSeries(url) {
  const res = await scrapeSeries.start(url);

  return res;
}

// scraping movies URI
rp(URIMovie)
  .then((html) => {
    const movieURI = cheerio('div .movie-item > meta[itemprop=url]', html);
    const movieList = [];

    for (let i = 0; i < movieURI.length; i++) {
      movieList.push(movieURI[i].attribs.content);
    }

    const promiseArr = movieList.map(function (url) {
      return new Promise(function (resolve, reject) {
        const data = startMovies(url);
        return resolve(data);
      });
    });

    Promise.all(promiseArr).then(function (data) {
      json2excel(data, 'acmMovies.xlsx');
    });
  })
  .catch(function (error) {
    console.log(error);
  });

rp(URISeries)
  .then((html) => {
    const series = cheerio('div[class=list] > a', html);
    const tempList = [];

    for (let i = 0; i < series.length; i++) {
      tempList.push(series[i].attribs.href);
    }

    const promiseArr = tempList.map(function (url) {
      return new Promise(function (resolve, reject) {
        const data = startSeries(url);
        return resolve(data);
      });
    });

    Promise.all(promiseArr).then(function (data) {
      json2excel(data, 'acmSeries.xlsx');
    });
  })
  .catch((e) => {
    console.log(e);
  });